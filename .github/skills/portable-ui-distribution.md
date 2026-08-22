# portable-ui-distribution

## このスキルの目的

同じ UI とデータモデルを、利用者ごとの受け取り方に合わせて複数の出力先へ配布する。
判断基準は「利用環境に合わせて最小の依存だけを渡せるか」であり、出力先を増やすこと自体が目的ではない。

## なぜ複数配置にするのか

### `docs/`

GitHub Pages ですぐ確認できる実行環境を持つため。
レビュー、検証、デモでは「まずブラウザで触れること」が価値になる。

### `static_site/`

リポジトリ外へ成果物だけを持ち出したいケースに備えるため。
ZIP 配布や別サーバー配置など、GitHub Pages 前提ではない配布先に向く。

### `dist/`

テンプレートを部品として再利用するため。
アプリ全体ではなくコンポーネント単位で組み込みたい利用者には、静的サイトよりライブラリ出力が適している。

### `streamlit_sample/`

Python 側の統合イメージを早く評価するため。
フロントエンド単独ではなく、他ランタイムとの接続点も最初から確認対象に含める。

## 判断基準

1. **利用者が受け取る単位が明確か**
   - デモを見る人には `docs/`
   - 配布物をそのまま置きたい人には `static_site/`
   - 組み込みたい人には `dist/`
2. **出力先ごとの差分が実装都合ではなく利用都合か**
   - 同じ UI を別の目的で包み直しているだけであること
   - 出力先ごとに別実装を増やさないこと
3. **検証方法が出力先ごとに定義されているか**
   - `docs/`: ブラウザで動作確認できる
   - `dist/`: ライブラリとして参照できる
   - `streamlit_sample/`: 統合サンプルとして読める

## 実装上の整理

- `pnpm build` → デフォルトの `dist/`
- `pnpm build:pages` → `docs/`
- `pnpm build:static` → `static_site/`
- `pnpm build:streamlit` → `streamlit_sample/frontend/`

Vite の `build.outDir` を切り替えて、同じアプリ本体から出力先だけを変える。
この構成により、配布戦略の差分をビルド設定へ閉じ込められる。

## Streamlit カスタムコンポーネントとしてのビルド

`streamlit_sample/frontend/` は Python パッケージが管理するディレクトリではなく、
Vite でビルドした静的アセット（`index.html` + JS/CSS）を配置する場所。

```bash
# ビルド
pnpm build:streamlit
# → streamlit_sample/frontend/ に index.html + assets/ が生成される

# Streamlit で確認
cd streamlit_sample
pip install -r requirements.txt
streamlit run app.py
```

`streamlit_sample/__init__.py` が `components.declare_component("sample_component", path=...)` で
`frontend/` を参照し、Streamlit が iframe 内でアセットを配信する。
Python 側はビルド成果物の中身を解釈しない。
