# Supabaseローカル環境セットアップガイド

このドキュメントでは、DayRampプロジェクトのSupabaseローカル環境を立ち上げる詳細な手順を説明します。

## 📋 前提条件

### 必要なソフトウェア

1. **Docker Desktop**
   - インストール確認: `docker --version`
   - [Docker Desktop ダウンロード](https://www.docker.com/products/docker-desktop)
   - Dockerが起動していることを確認してください

2. **Node.js 18以上**
   - インストール確認: `node --version`
   - [Node.js ダウンロード](https://nodejs.org/)

3. **Supabase CLI**
   - インストール確認: `npx supabase --version`
   - プロジェクトではnpx経由で実行されるため、別途インストールは不要です

## 🚀 初回セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
# .env.localファイルを作成
cp .env.local.example .env.local
```

ローカル開発用の`.env.local`に以下の値を設定:

```env
# Supabase Local - これらの値はsupabase startコマンド実行後に表示されます
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321
NEXT_PUBLIC_SUPABASE_ANON_KEY=（supabase start実行後に表示される値）
SUPABASE_SERVICE_ROLE_KEY=（supabase start実行後に表示される値）
SUPABASE_DB_PASSWORD=postgres

# Stripe（テスト環境の値を使用）
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Resend（開発用のテストキーを使用）
RESEND_API_KEY=re_test_xxx

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3007
```

### 3. Supabaseローカル環境の起動

```bash
npm run supabase:start
```

初回起動時は以下のDockerイメージがダウンロードされます（時間がかかる場合があります）:
- supabase/postgres
- supabase/storage-api
- supabase/realtime
- supabase/studio
- その他関連イメージ

起動完了後、以下の情報が表示されます:

```
Started supabase local development setup.

         API URL: http://127.0.0.1:55321
          DB URL: postgresql://postgres:postgres@127.0.0.1:55322/postgres
      Studio URL: http://127.0.0.1:55323
    Inbucket URL: http://127.0.0.1:55324
        anon key: eyJ...（この値を NEXT_PUBLIC_SUPABASE_ANON_KEY に設定）
service_role key: eyJ...（この値を SUPABASE_SERVICE_ROLE_KEY に設定）
```

**重要**: 上記の`anon key`と`service_role key`を`.env.local`にコピーしてください。

### 4. データベースマイグレーションの実行

```bash
npm run migration:up
```

このコマンドは以下を実行します:
- `supabase/migrations/`内のすべてのマイグレーションファイルを適用
- TypeScript型定義を自動生成

### 5. TypeScript型定義の生成（必要に応じて）

マイグレーション実行時に自動生成されますが、手動で生成する場合:

```bash
npm run generate-types
```

生成されたファイル: `src/types/supabase/database.types.ts`

### 6. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは http://localhost:3007 でアクセス可能です。

## 🌐 ローカル環境のURL

| サービス | URL | 説明 |
|---------|-----|------|
| アプリケーション | http://localhost:3007 | Next.js開発サーバー |
| Supabase Studio | http://localhost:55323 | データベース管理UI |
| Supabase API | http://127.0.0.1:55321 | Supabase APIエンドポイント |
| Inbucket | http://127.0.0.1:55324 | メールテスト用（認証メール確認） |

## 📝 よく使うコマンド

### Supabase管理

```bash
# ステータス確認
npm run supabase:status

# 停止
npm run supabase:stop

# データベースリセット（全データ削除）
npm run supabase:reset

# 再起動（停止→起動）
npm run supabase:stop && npm run supabase:start
```

### データベース操作

```bash
# 新しいマイグレーション作成
npm run migration:new <マイグレーション名>
# 例: npm run migration:new add_user_settings_table

# マイグレーション一覧表示
npm run migration:list

# 型定義の再生成
npm run generate-types
```

## 🔍 トラブルシューティング

### 1. Dockerが起動していない

**エラー**: `Cannot connect to the Docker daemon`

**解決方法**:
- Docker Desktopを起動
- システムトレイのDockerアイコンが緑色であることを確認

### 2. ポートが既に使用されている

**エラー**: `bind: address already in use`

**解決方法**:
```bash
# 使用中のポートを確認
lsof -i :55321
lsof -i :55322
lsof -i :55323

# 既存のSupabaseコンテナを停止
npm run supabase:stop
```

### 3. マイグレーションエラー

**エラー**: `migration failed`

**解決方法**:
```bash
# データベースをリセット
npm run supabase:reset

# マイグレーションを再実行
npm run migration:up
```

### 4. 型定義が古い

**症状**: TypeScriptのエラーが発生

**解決方法**:
```bash
# 型定義を再生成
npm run generate-types

# TypeScriptサーバーを再起動（VS Codeの場合）
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

### 5. 認証メールが届かない

**解決方法**:
- Inbucket (http://127.0.0.1:55324) でメールを確認
- ローカル環境では実際のメールは送信されません

## 📧 メール確認方法

### Inbucket（メールキャッチャー）

Supabaseローカル環境には、送信されるメールをキャッチして表示するInbucketが含まれています。

**アクセス方法**:
```
http://127.0.0.1:55324
```

**確認できるメール**:
- ユーザー登録確認メール
- パスワードリセットメール
- マジックリンク認証メール
- その他Supabase Authから送信されるメール

**使い方**:
1. アプリケーションで認証アクション（サインアップ、パスワードリセット等）を実行
2. Inbucket (http://127.0.0.1:55324) を開く
3. 受信トレイにメールが表示される
4. メールをクリックして内容を確認
5. 確認リンクなどをクリックして認証を完了

### React Emailプレビュー

メールテンプレートの開発時:

```bash
# メール開発サーバーを起動
npm run email:dev
```

プレビューURL: http://localhost:30071

これにより、メールテンプレートをリアルタイムで編集・プレビューできます。

## 🛠️ 開発のベストプラクティス

### 1. データベース変更時のワークフロー

1. 新しいマイグレーションを作成
   ```bash
   npm run migration:new 変更内容の説明
   ```

2. 生成されたファイルを編集
   ```
   supabase/migrations/YYYYMMDDHHMMSS_変更内容の説明.sql
   ```

3. マイグレーションを適用
   ```bash
   npm run migration:up
   ```

4. 型定義が自動生成されることを確認

### 2. チーム開発時の注意点

- マイグレーションファイルはGitにコミット
- `.env.local`はGitにコミットしない（.gitignoreに登録済み）
- 他の開発者がpullした後は`npm run migration:up`を実行

### 3. データのシード

初期データが必要な場合は`supabase/seed.sql`に記述:

```sql
-- supabase/seed.sql
INSERT INTO public.users (email, name) VALUES
  ('test1@example.com', 'Test User 1'),
  ('test2@example.com', 'Test User 2');
```

リセット時に自動的に実行されます:
```bash
npm run supabase:reset
```

## 🚀 本番環境へのデプロイ

### 初回セットアップ

```bash
# 1. Supabaseにログイン
npx supabase login

# 2. プロジェクトとリンク（プロジェクトIDは Supabase Dashboard > Settings > General で確認）
npx supabase link --project-ref <your-project-ref>

# 3. リンクされているプロジェクトを確認
npx supabase projects list
```

### マイグレーションの適用

```bash
# 本番環境の現在の状態を確認
npx supabase migration list

# ローカルと本番の差分を確認
npm run db:diff

# 本番環境にマイグレーションを適用
npm run migration:push:prod

# または直接実行
npx supabase db push
```

**注意**: 接続エラーが発生する場合は、Supabase Dashboardで以下を確認してください：
1. Settings > Database > Connection string で「Direct connection」のURLを使用
2. パスワードはDashboardで確認（プールされた接続URLではなく直接接続を使用）

### スキーマの同期

```bash
# 本番環境のスキーマをローカルに取得
npm run db:pull

# 本番環境の変更からマイグレーションファイルを作成
npm run db:remote-commit
```

### デプロイワークフロー

#### 推奨デプロイ手順

1. **開発環境でマイグレーション作成**
   ```bash
   npm run migration:new feature_name
   # マイグレーションファイルを編集
   npm run migration:up  # ローカルでテスト
   ```

2. **ステージング環境でテスト**
   ```bash
   # ステージング環境にマイグレーション適用
   npx supabase db push --db-url $STAGING_DB_URL
   ```

3. **本番環境へデプロイ**
   ```bash
   # 本番環境のバックアップを取得（推奨）
   pg_dump $PRODUCTION_DB_URL > backup_$(date +%Y%m%d_%H%M%S).sql

   # 本番環境にマイグレーション適用
   npx supabase db push --db-url $PRODUCTION_DB_URL
   ```

### 本番環境のトラブルシューティング

#### ロールバック手順

```bash
# 特定のマイグレーションまでロールバック
npx supabase migration repair <version> --db-url $PRODUCTION_DB_URL

# バックアップから復元
psql $PRODUCTION_DB_URL < backup_YYYYMMDD_HHMMSS.sql
```

#### 本番環境の状態確認

```bash
# 適用済みマイグレーションの確認
npx supabase migration list --db-url $PRODUCTION_DB_URL

# スキーマの差分確認
npx supabase db diff --db-url $PRODUCTION_DB_URL

# データベース接続テスト
npx supabase db remote commit --dry-run
```

### セキュリティのベストプラクティス

1. **環境変数の管理**
   - 本番環境のキーは環境変数で管理
   - `.env.production`はGitにコミットしない
   - CI/CDツールのシークレット機能を使用

2. **Row Level Security (RLS)**
   ```sql
   -- 本番環境では必ずRLSを有効化
   ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
   ```

3. **定期バックアップ**
   ```bash
   # 日次バックアップスクリプト例
   #!/bin/bash
   pg_dump $PRODUCTION_DB_URL | gzip > backup_$(date +%Y%m%d).sql.gz
   ```

## 📋 コマンドリファレンス

### ローカル開発コマンド

| コマンド | 説明 | 使用場面 |
|---------|------|----------|
| `npm run supabase:start` | ローカルSupabase起動 | 開発開始時 |
| `npm run supabase:stop` | ローカルSupabase停止 | 開発終了時 |
| `npm run supabase:reset` | データベースリセット | クリーンな状態に戻す時 |
| `npm run migration:new <name>` | 新規マイグレーション作成 | スキーマ変更時 |
| `npm run migration:up` | マイグレーション適用 | ローカルDB更新時 |
| `npm run migration:list` | マイグレーション一覧 | 状態確認 |
| `npm run generate-types` | TypeScript型生成 | スキーマ変更後 |

### 本番環境デプロイコマンド

| コマンド | 説明 | 使用場面 |
|---------|------|----------|
| `npm run db:push` | スキーマを本番に適用 | 本番デプロイ時 |
| `npm run db:pull` | 本番スキーマを取得 | 本番の状態を同期 |
| `npx supabase db diff --linked` | スキーマ差分確認 | デプロイ前確認 |
| `npx supabase db remote commit` | 本番変更からマイグレーション作成 | 本番で直接変更した場合 |
| `npx supabase migration repair <version>` | 特定バージョンまでロールバック | 問題発生時 |

### スキーマ管理コマンド

| コマンド | 説明 | 使用場面 |
|---------|------|----------|
| `npx supabase db lint` | スキーマの問題をチェック | デプロイ前 |
| `npx supabase db dump -f schema.sql` | スキーマをダンプ | バックアップ作成 |
| `npx supabase test db` | データベーステスト実行 | CI/CD |

## 📚 参考リンク

- [Supabase CLIドキュメント](https://supabase.com/docs/guides/cli)
- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Supabase Migrations](https://supabase.com/docs/guides/cli/managing-migrations)
- [Supabase Production Deployment](https://supabase.com/docs/guides/platform/going-into-prod)

## ❓ サポート

問題が解決しない場合は、以下の情報を含めてissueを作成してください:

1. エラーメッセージの全文
2. 実行したコマンド
3. `npm run supabase:status`の出力
4. `docker ps`の出力
5. Node.jsとDockerのバージョン