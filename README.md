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
| `pnpm build` | `dist/` | Default build |
| `pnpm build:pages` | `docs/` | GitHub Pages |
| `pnpm build:static` | `static_site/` | Standalone static site |
| `pnpm build:streamlit` | `streamlit_portable_ui_sample/frontend/*/` | All Streamlit component builds |

## ディレクトリ構成

```
.github/skills/          # 設計・評価基準をまとめたスキル (portable-ui-xxx.md)
docs/                    # GitHub Pages 用の静的出力
static_site/             # GitHub Pages 以外へ持ち出す静的出力
dist/components/         # 再利用用のコンポーネントライブラリ + バインディング
streamlit_sample/        # Streamlit 連携サンプル
src/
  components/            # React コンポーネント
  domain/                # データモデル / DuckDB-WASM 初期化 / クエリ
  hooks/                 # DB コンテキスト・カスタムフック
```

## データ設計

詳細は `.github/skills/portable-ui-data-model.md` を参照。

- **`items` テーブル**: DynamoDB 風単一テーブル設計（`pk` / `sk` / `data` JSON）
- **`assets` テーブル**: コンテンツアドレス型ストレージ（SHA-256 ハッシュキー）
- **DuckDB-WASM**: ブラウザ内 SQL エンジン。キャッシュ・エクスポート・インポート対応

## スキル一覧 (.github/skills/)

単なるテーマ一覧ではなく、「どう判断して、なぜその構成にするか」を残すためのスキル群。

| ファイル | 内容 |
|---------|------|
| `portable-ui-architecture.md` | 全体アーキテクチャ・配布形式 |
| `portable-ui-data-model.md` | データモデル詳細 |
| `portable-ui-duckdb.md` | DuckDB-WASM の配置方針・検証基準 |
| `portable-ui-distribution.md` | 複数配布形式を採る理由と判断基準 |
| `portable-ui-components.md` | コンポーネント設計ガイドライン |
