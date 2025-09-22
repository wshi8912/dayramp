# DayRamp

Start your day with focus and productivity - タスク管理と生産性向上のためのSaaSアプリケーション

## 🚀 クイックスタート

### 前提条件
- Docker Desktop (Supabaseローカル環境用)
- Node.js 18以上
- npm または yarn
- Supabase CLI

### 初回セットアップ

```bash
# 1. 依存関係のインストール
npm install

# 2. 環境変数の設定
cp .env.local.example .env.local
# .env.localを編集して必要な値を設定

# 3. Supabaseローカル環境を起動
npm run supabase:start

# 4. マイグレーションを実行
npm run migration:up

# 5. TypeScript型定義を生成
npm run generate-types

# 6. 開発サーバーを起動
npm run dev
```

アプリケーションは http://localhost:3007 でアクセス可能です。

📚 **詳細なSupabaseセットアップ手順**: [docs/SUPABASE_LOCAL_SETUP.md](./docs/SUPABASE_LOCAL_SETUP.md)を参照してください。

## 📁 プロジェクト構成

### Supabase関連ファイル
```
supabase/
├── migrations/           # データベースマイグレーション
│   └── YYYYMMDD_XXX_*.sql  # 日付_連番_説明.sql
├── config.toml          # Supabase設定 (ポート: 553xx系)
└── seed.sql            # 初期データ

src/types/supabase/
└── database.types.ts   # 自動生成される型定義

src/libs/supabase/
├── supabase-server-client.ts
├── supabase-middleware-client.ts
└── supabase-admin.ts
```

### 型定義ファイル
- **場所**: `src/types/supabase/database.types.ts`
- **生成コマンド**: `npm run generate-types`
- **注意**: このファイルは自動生成されるため、直接編集しないでください

## 🛠️ 開発コマンド

### アプリケーション
```bash
npm run dev          # 開発サーバー起動 (port 3007)
npm run build        # プロダクションビルド
npm run start        # プロダクションサーバー起動
npm run lint         # ESLint実行
```

### Supabase
```bash
npm run supabase:start   # Supabaseローカル環境起動
npm run supabase:stop    # Supabaseローカル環境停止
npm run supabase:status  # ステータス確認
npm run supabase:reset   # データベースリセット (注意: 全データ削除)
```

### データベース管理
```bash
npm run migration:new <name>  # 新しいマイグレーション作成
npm run migration:up          # マイグレーション適用
npm run migration:squash      # マイグレーション統合
npm run generate-types        # TypeScript型定義生成
```

### Email開発
```bash
npm run email:dev     # Email開発サーバー起動 (port 30071)
npm run email:build   # Emailビルド
npm run email:export  # Email エクスポート
```

### Stripe
```bash
npm run stripe:listen  # Stripe Webhook リスナー起動
```

## 📝 マイグレーション管理

### 命名規則
`YYYYMMDD_XXX_description.sql`
- **YYYYMMDD**: 作成日（例: 20250830）
- **XXX**: 連番（001, 002, 003...）
- **description**: 変更内容の説明（例: add_user_table）

### 例
- `20250830_001_dayramp_init.sql` - 初期セットアップ
- `20250830_002_add_analytics_table.sql` - 分析テーブル追加

## 🔧 環境変数

### ローカル開発環境 (.env.local)

```env
# Supabase Local
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DB_PASSWORD=postgres

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Resend
RESEND_API_KEY=re_xxx

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3007
```

## 🌐 ローカル開発URL

- **アプリケーション**: http://localhost:3007
- **Supabase Studio**: http://localhost:55323
- **Email Preview**: http://localhost:30071

## 📦 主な技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **決済**: Stripe
- **メール**: React Email + Resend
- **スタイリング**: Tailwind CSS + shadcn/ui
- **型安全性**: TypeScript

## 🚢 本番環境へのデプロイ

### 1. Supabase Cloud セットアップ
1. [supabase.com](https://supabase.com) でプロジェクト作成
2. プロジェクト設定から接続情報を取得
3. マイグレーションを本番環境に適用

### 2. Vercel デプロイ
1. GitHubリポジトリをVercelに接続
2. 環境変数を設定
3. デプロイ実行

### 3. Stripe Webhook設定
1. Stripe Dashboardでエンドポイント追加
2. `https://your-domain.com/api/webhooks` を設定
3. Webhook Secretを環境変数に追加

## 📚 ドキュメント

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)

## 🔀 Git Worktreeを使用した並列Claude Codeセッション

複数のタスクを同時に処理する必要がある場合、Git worktreeを使用してClaude Codeインスタンス間で完全なコード分離を実現できます。

### Git Worktreeとは
Git worktreeを使用すると、同じリポジトリから複数のブランチを別々のディレクトリにチェックアウトできます。各worktreeは独自の作業ディレクトリを持ち、ファイルが分離されていますが、同じGit履歴を共有します。

### 使用方法

#### 1. 新しいworktreeを作成

```bash
# 新しいブランチで新しいworktreeを作成
git worktree add ../dayramp-feature-a -b feature-a

# または既存のブランチでworktreeを作成
git worktree add ../dayramp-bugfix bugfix-123
```

これにより、リポジトリの独立した作業コピーを持つ新しいディレクトリが作成されます。

#### 2. 各worktreeでClaude Codeを実行

```bash
# worktreeに移動
cd ../dayramp-feature-a

# この独立した環境でClaude Codeを実行
claude
```

#### 3. 別のworktreeでClaudeを実行

```bash
cd ../dayramp-bugfix
claude
```

#### 4. worktreeの管理

```bash
# すべてのworktreeを一覧表示
git worktree list

# 作業完了後にworktreeを削除
git worktree remove ../dayramp-feature-a
```

### メリット
- 複数の機能開発を並行して進められる
- 各タスクが完全に分離された環境で実行される
- ブランチの切り替えなしに複数の作業を同時進行できる
- Claude Codeセッション間での干渉がない

## 🤝 Contributing

プルリクエストは歓迎です。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## 📄 License

MIT