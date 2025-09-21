# Core & Timezone MVP — Implementation Plan

この計画は、本プロジェクト構成（Next.js App Router + Supabase）に沿って「/core 体験」と「TZ（タイムゾーン）必須要件」を最小で成立させるための実装手順をまとめたものです。既存の TODO 機能は今回の範囲では不使用のため、/core からは取り除き、後述の段階で API/DB のクリーンアップを行います。

---

## 0. 前提・スコープ
- 対象ルート（ログイン後領域）
  - `src/app/(app)/core/page.tsx`
  - `src/app/(app)/settings/timezone/page.tsx`
- 共通ユーティリティ/クライアント
  - `src/libs/tz.ts`（date-fns/date-fns-tz ベースの TZ 変換）
  - `src/libs/api.ts`（Tasks API クライアント薄ラッパー）
- 新規データモデル（Supabase / RLS）
  - entries, tasks, daily_plans（すべて UTC 保存）
  - 既存の `users` テーブルに `timezone` を追加（このリポジトリには profiles ではなく users が存在）
- 依存追加
  - `date-fns`, `date-fns-tz`, `@vvo/tzdb`

---

## 1) IA/ルーティング（/core 基点）
- `/core`（デフォルト）
  - 上：🎙️クイックキャプチャ（最大60秒、早期終了＋テキスト入力）
  - 中：タイムライン（startAt/endAt/dueAt を持つカード）
  - 右/下：Untimed（時間未定。MITピン最大3件固定領域）
  - 下：＋（手動追加）／検索
- モーダル/シート
  - Capture モーダル（/core 上で開く）
  - Review & Publish モーダル（LLM 出力を確認→保存）
  - Task 編集シート（単一タスクの時刻・メモ編集/DST 補正警告）
- 設定
  - `/settings/timezone`（IANA TZ 選択・保存）
- 実装場所
  - `src/app/(app)/core/page.tsx`（Today=Core 画面）
  - `src/app/(app)/settings/timezone/page.tsx`（TZ 設定）
  - `src/components/` 配下に UI コンポーネントを追加
    - `CaptureBar.tsx`（🎙️60秒/テキスト）
    - `ReviewModal.tsx`
    - `Timeline.tsx`
    - `UntimedPane.tsx`
    - `TaskSheet.tsx`

---

## 2) タイムゾーン設計（必須）
- 原則
  - 保存はすべて UTC（ISO 文字列）
  - 表示・“その人の今日”の切り出しは IANA TZ（例: `Asia/Tokyo`）
  - “日付キー”は TZ で境界決定（DST も考慮）
- ユーザー設定
  - 本リポジトリでは `profiles` ではなく `users` テーブルを使用
  - `users.timezone`（IANA 文字列、初回はブラウザ検出→保存、設定で変更可）
- “今日”の定義
  - `userNow = now.tz(user.timezone)`
  - `dayStart = startOfDay(userNow)` / `dayEnd = endOfDay(userNow)`
  - DB 照会は `[dayStart(UTC) .. dayEnd(UTC))` の範囲で tasks を取得
- 曖昧語の解決
  - 「〜まで」→ dueAt
  - 「X〜Y」→ startAt/endAt
  - 「朝/昼/夕方/夜」等は保守的既定（朝=09:00, 昼=12:00, 夕方=17:00, 夜=20:00）
  - 不確実なら Untimed へ

---

## 3) データモデル（最小・TZ 対応）
- TypeScript 型（アプリ側の概念）
  ```ts
  type ID = string;

  export type Profile = {
    id: ID;
    timezone: string; // IANA, 例: "Asia/Tokyo"
  };

  export type Entry = {
    id: ID;
    userId: ID;
    createdAt: string;      // UTC ISO
    source: 'voice' | 'text';
    transcript?: string;
    audioUrl?: string;
    lang?: 'ja' | 'en' | 'auto';
  };

  export type Task = {
    id: ID;
    userId: ID;
    entryId?: ID;
    title: string;
    note?: string;
    // すべて UTC 保存（null 相当なら Untimed）
    startAt?: string;       // UTC ISO
    endAt?: string;         // UTC ISO
    dueAt?: string;         // UTC ISO
    estimateMin?: number;
    priority?: 'low' | 'mid' | 'high';
    status: 'todo' | 'done' | 'deleted';
    source: 'voice' | 'manual';
    confidence?: number;
    createdAt: string;      // UTC ISO
    updatedAt: string;      // UTC ISO
  };

  export type DailyPlan = {
    id: ID;
    userId: ID;
    date: string;           // 表示用の“ユーザー日付” YYYY-MM-DD（TZで算出）
    taskIds: ID[];
    createdFromEntryId?: ID;
  };
  ```
- Supabase（例 SQL; 実装はマイグレーションで追加）
  - users: `alter table users add column if not exists timezone text not null default 'UTC';`
  - entries: 音声/テキスト入力の起点
  - tasks: 時間あり/なしのタスク
  - daily_plans: その日のピン/並び（最小）
  - 主要 index: `tasks(start_at)`, `tasks(due_at)`

---

## 4) TZ ユーティリティ（実用コード）
- 依存: `date-fns`, `date-fns-tz`
- 追加ファイル: `src/libs/tz.ts`
  ```ts
  import { parseISO } from 'date-fns';
  import { utcToZonedTime, zonedTimeToUtc, format as tzFormat } from 'date-fns-tz';

  export const detectBrowserTZ = () =>
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // ローカル（TZ）→ UTC ISO
  export const toUTC = (localISO: string, tz: string) =>
    zonedTimeToUtc(localISO, tz).toISOString();

  // UTC ISO → ローカル（TZ）表示用
  export const fromUTC = (utcISO: string, tz: string) => {
    const d = utcToZonedTime(parseISO(utcISO), tz);
    return {
      localISO: tzFormat(d, "yyyy-MM-dd'T'HH:mm", { timeZone: tz }),
      dateKey: tzFormat(d, 'yyyy-MM-dd', { timeZone: tz }),
    };
  };

  // “ユーザーの今日”の UTC 範囲
  export const userDayUtcRange = (utcNowISO: string, tz: string) => {
    const nowZoned = utcToZonedTime(parseISO(utcNowISO), tz);
    const dayStr = tzFormat(nowZoned, 'yyyy-MM-dd', { timeZone: tz });
    const startLocal = `${dayStr}T00:00:00`;
    const endLocal = `${dayStr}T23:59:59`;

    // DST の“飛ぶ/重なる”時間を考慮しつつ変換
    const startUtc = zonedTimeToUtc(startLocal, tz).toISOString();
    const endUtc = zonedTimeToUtc(endLocal, tz).toISOString();
    return { startUtc, endUtc, dayKey: dayStr };
  };
  ```
- DST 非存在時刻: `zonedTimeToUtc` は近似補正。編集時にトースト警告を出す。

---

## 5) LLM 構造化スキーマ（保存は UTC 変換）
```json
{
  "date": "YYYY-MM-DD",
  "timezone": "Asia/Tokyo",
  "tasks": [
    {
      "title": "テキスト",
      "note": "任意",
      "time": {
        "type": "range|deadline|none",
        "startLocal": "YYYY-MM-DDTHH:mm",
        "endLocal": "YYYY-MM-DDTHH:mm",
        "dueLocal": "YYYY-MM-DDTHH:mm"
      },
      "estimateMin": 25,
      "priority": "low|mid|high",
      "confidence": 0.87
    }
  ],
  "language": "ja|en"
}
```
- 受け側で `toUTC(startLocal, tz)` / `toUTC(dueLocal, tz)` へ変換→保存
- 曖昧語は `time.type:"none"` または `confidence` を下げて Untimed へ

---

## 6) /core 実装の要点（Next.js）
- ディレクトリ
  - `src/app/(app)/core/page.tsx`（SSR/サーバー側でユーザー+TZ取得→日付範囲で tasks 取得→初期描画）
  - `src/app/(app)/settings/timezone/page.tsx`
  - `src/libs/tz.ts`, `src/libs/api.ts`
  - `src/components/{CaptureBar,ReviewModal,Timeline,UntimedPane,TaskSheet}.tsx`
- 初期化フロー
  1) `users.timezone` を取得（未設定なら `detectBrowserTZ()` を提案→保存）
  2) `userDayUtcRange(nowUTC, user.timezone)` で当日 UTC 範囲を算出
  3) その範囲で tasks を取得
  4) `startAt/endAt/dueAt` があれば Timeline、無ければ Untimed に分類
- API（最小）
  - `GET /api/tasks?from=...&to=...`（範囲取得）
  - `POST /api/tasks`（作成）
  - `PATCH /api/tasks/[id]`（更新）
  - `DELETE /api/tasks/[id]`（削除・論理削除でも可）

---

## 7) 設定（/settings/timezone）
- IANA TZ セレクト（`@vvo/tzdb` 利用）
- 保存時の再計算
  - Core 画面の “今日” のキー（dayKey）
  - 既存 Task の表示時刻（保存は UTC のため再換算のみ）

---

## 8) 音声→スキーマ→UTC 保存の流れ（MVP）
1) 🎙️録音→STT（外部連携は後続。MVP はテキスト入力を主）
2) LLM へ `timezone` と `YYYY-MM-DD in TZ` を渡し Strict JSON を受領
3) tasks へ保存
   - `range` → `startAt = toUTC(startLocal, tz)`, `endAt = ...`
   - `deadline` → `dueAt = toUTC(dueLocal, tz)`
   - `none` → Untimed（時刻フィールドは保存しない）

---

## 9) エッジケース（QA 観点）
- DST 切替日：02:30 が存在しない/重複 → 補正＋編集シートで明示
- TZ 変更直後：/core は新 TZ で “今日” 再計算（保存 UTC は不変）
- 自然言語で日付越え（例:「明日の朝」）：TZ 基準で翌日に解釈→Publish 前に日付バッジで確認

---

## 10) Definition of Done（/core & TZ）
- `/core` で 60秒→Publish→カード化 が 3クリック以内
- `users.timezone` 未設定ユーザーは、初回導線で自動検出→保存
- 保存は全て UTC、表示は `users.timezone` に基づく
- “ユーザーの今日” が TZ で正しく切り出される（DST日を含む）
- `/settings/timezone` で変更→即時反映

---

## 11) 実装タスク（段階的）
1. 依存追加・雛形
   - 追加: `date-fns`, `date-fns-tz`, `@vvo/tzdb`
   - `src/libs/tz.ts` 作成
   - `src/libs/api.ts` 雛形（fetch ラッパー）
2. DB / Supabase（マイグレーション）
   - `alter table users add column if not exists timezone text not null default 'UTC';`
   - `entries`, `tasks`, `daily_plans` を新規作成（RLS: auth.uid() = user_id）
   - `create index if not exists tasks_start_idx on tasks (start_at);`
   - `create index if not exists tasks_due_idx on tasks (due_at);`
   - `npm run migration:up` → `npm run generate-types`
3. API ルート
   - `src/app/api/tasks/route.ts`（GET/POST）
   - `src/app/api/tasks/[id]/route.ts`（PATCH/DELETE）
4. UI の最小構築
   - `/core` を TODO 依存から切り離し、CaptureBar/Timeline/Untimed のプレースホルダを表示
   - 編集シート・レビューはモックから開始
5. TZ 設定ページ
   - `/settings/timezone` で IANA 選択→`users.timezone` 更新
6. LLM 連携の受け口（後続）
   - スキーマに準拠した JSON を受け取り tasks 保存
7. 既存 TODO の撤去（安全策）
   - UI から排除（`src/app/(app)/core/page.tsx` の TodoList を削除）
   - API `/api/todos/*` は段階的に非推奨→不要ならテーブル削除マイグレーション

---

## 12) Supabase: 推奨マイグレーション断片（例）
- users への TZ 追加
  ```sql
  alter table users add column if not exists timezone text not null default 'UTC';
  ```
- entries
  ```sql
  create table if not exists entries (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users not null,
    source text check (source in ('voice','text')) not null,
    transcript text,
    audio_url text,
    lang text check (lang in ('ja','en','auto')),
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
  );
  alter table entries enable row level security;
  create policy "Users can manage own entries" on entries
    using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create trigger entries_updated_at before update on entries
    for each row execute procedure update_updated_at_column();
  ```
- tasks
  ```sql
  create table if not exists tasks (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users not null,
    entry_id uuid references entries(id),
    title text not null,
    note text,
    start_at timestamptz,
    end_at timestamptz,
    due_at timestamptz,
    estimate_min int,
    priority text check (priority in ('low','mid','high')),
    status text check (status in ('todo','done','deleted')) not null default 'todo',
    source text check (source in ('voice','manual')) not null,
    confidence numeric,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
  );
  alter table tasks enable row level security;
  create policy "Users can manage own tasks" on tasks
    using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create index if not exists tasks_start_idx on tasks (start_at);
  create index if not exists tasks_due_idx on tasks (due_at);
  create trigger tasks_updated_at before update on tasks
    for each row execute procedure update_updated_at_column();
  ```
- daily_plans（最小）
  ```sql
  create table if not exists daily_plans (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users not null,
    date text not null, -- YYYY-MM-DD（表示の“ユーザー日付”）
    task_ids uuid[] not null default '{}',
    created_from_entry_id uuid references entries(id),
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
  );
  alter table daily_plans enable row level security;
  create policy "Users can manage own plans" on daily_plans
    using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create unique index if not exists daily_plans_user_date_idx on daily_plans(user_id, date);
  create trigger daily_plans_updated_at before update on daily_plans
    for each row execute procedure update_updated_at_column();
  ```

---

## 13) API 仕様（最小）
- `GET /api/tasks?from=ISO&to=ISO`
  - 認証必須。RLS 前提で `user_id` でスコープ
  - 返却: tasks[]（UTC ISO）
- `POST /api/tasks`
  - body: Task 作成用（UTC で渡す）
- `PATCH /api/tasks/[id]`, `DELETE /api/tasks/[id]`
- `GET /api/user`（既存 `get-user` を流用）で `timezone` を含める／または `/api/user/timezone` の PATCH を用意

---

## 14) UI 構成（Props 目安）
- `CaptureBar`
  - props: `{ onSubmit(textOrEntry), maxSec=60 }`
- `ReviewModal`
  - props: `{ draft, onPublish(tasks[]), onClose }`
- `Timeline`
  - props: `{ tasks: Task[], tz: string, onMoveOrResize(taskId, newRange) }`
- `UntimedPane`
  - props: `{ tasks: Task[], onPinTop(taskId), onQuickSetTime(taskId, when) }`
- `TaskSheet`
  - props: `{ task, tz, onSave(updated), onDelete(id) }`

---

## 15) 既存 TODO の扱い（段階的撤去）
- `/core` から TodoList を除去し、新 UI のプレースホルダに差し替え
- `/api/todos/*` は当面残置（他画面未参照の前提）。安定後にテーブル `todos` を drop（要周知）

---

## 16) 動作確認・テスト
- ユニット
  - `tz.ts` の `toUTC/fromUTC/userDayUtcRange` の基本テスト（夏時間境界日を含む）
- 結合
  - `/settings/timezone` 変更→ `/core` の “今日” 反映
  - `from..to` 範囲 API が TZ を跨ぐ日でも正しく返却
- E2E（最低限の手動）
  - DST 切替日の時刻編集で補正トーストが出る
  - 60秒キャプチャ→Publish→カード化が 3クリック以内

---

## 17) ロールアウト手順
1. 依存追加 → `tz.ts` 追加 → `/core` の UI プレースホルダ
2. DB マイグレーション & 型再生成
3. Tasks API 実装
4. `/settings/timezone` 実装
5. `/core` タイムライン/Untimed の最小表示
6. Capture→Review→Publish（MVP）
7. TODO の API/テーブル削除（必要に応じて）

---

## 参考（導線）
- ナビゲーション: 既に `/core` へのリンクあり（`src/app/navigation.tsx`）。設定ページへのリンク追加を検討。
- サーバーサイドの認証ガード: 既存 `(app)` レイアウトのリダイレクト仕様を踏襲。

---

この計画に従い、最小機能で「TZ 一貫の Today 体験」を構築し、その後 LLM/STT 連携やドラッグ編集などのリッチ化を進めます。
