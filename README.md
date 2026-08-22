# portable-ui-template

React + Vite テンプレート。スキル管理・複数配布形式・DuckDB-WASM によるブラウザ内データ管理を備えた UI コンポーネントの開発基盤。

## Quick Start

```bash
pnpm install
pnpm dev
```

## ビルド

| コマンド | 出力先 | 用途 |
|---------|--------|------|
| `pnpm build` | `dist/` | デフォルトビルド |
| `pnpm build:pages` | `docs/` | GitHub Pages |
| `pnpm build:static` | `static_site/` | スタンドアロン静的サイト |

## ディレクトリ構成

```
.github/skills/          # 設計方針・スキルドキュメント (portable-ui-xxx.md)
docs/                    # GitHub Pages 出力先
static_site/             # 静的サイト出力先
dist/components/         # コンポーネントライブラリ + バインディング
streamlit_sample/        # Streamlit 連携サンプル
src/
  components/            # React コンポーネント
  domain/                # データ型定義（単一テーブル / CAS）
  db/                    # DuckDB-WASM 初期化・クエリヘルパー
  hooks/                 # DB コンテキスト・カスタムフック
```

## データ設計

詳細は `.github/skills/portable-ui-data-model.md` を参照。

- **`items` テーブル**: DynamoDB 風単一テーブル設計（`pk` / `sk` / `data` JSON）
- **`assets` テーブル**: コンテンツアドレス型ストレージ（SHA-256 ハッシュキー）
- **DuckDB-WASM**: ブラウザ内 SQL エンジン。キャッシュ・エクスポート・インポート対応

## スキル一覧 (.github/skills/)

| ファイル | 内容 |
|---------|------|
| `portable-ui-architecture.md` | 全体アーキテクチャ・配布形式 |
| `portable-ui-data-model.md` | データモデル詳細 |
| `portable-ui-duckdb.md` | DuckDB-WASM 活用パターン |
| `portable-ui-distribution.md` | 各配布形式の詳細 |
| `portable-ui-components.md` | コンポーネント設計ガイドライン |
