# portable-ui-duckdb

## このスキルの目的

DuckDB-WASM を「ブラウザで動くローカル DB」として扱い、GitHub Pages を含む静的配布でも再現可能に保つ。
実装判断は「CDN 依存を減らし、配布物だけで起動できるか」を最優先にする。

## 判断基準

1. **配布物に必要な資産が含まれているか**
   - `docs/` や `static_site/` だけを配れば起動できること
   - `.wasm` と worker がビルド成果物へ一緒に出力されること
2. **ブラウザ内で閉じるか**
   - 初期化、CRUD、エクスポート、インポートがブラウザだけで完結すること
   - 外部サービス停止やネットワーク制限で壊れないこと
3. **配布形式ごとの差分が小さいか**
   - `dist/`、`docs/`、`static_site/` で同じ DB 初期化コードを再利用できること
   - 配布先ごとに実装を分岐させすぎないこと

## 設計方針

### 1. DuckDB-WASM 資産はローカル配布を前提にする

`getJsDelivrBundles()` のような CDN 前提ではなく、npm パッケージに含まれる `.wasm` と worker を Vite のアセットとして取り込む。
これにより `pnpm build:pages` の出力だけで GitHub Pages 上の実行可否を判断できる。

### 2. DB 本体はメモリ、永続化はブラウザストレージ

- 実行時 DB: `:memory:`
- セッション跨ぎの復元: `localStorage` キャッシュ
- 外部共有: JSON エクスポート / インポート

この分離により、起動速度と移植性を保ちながら、サーバー依存なしで状態を持ち回せる。

### 3. データ設計は SQL で扱いやすい最小構成に寄せる

- `items`: UI データ本体
- `assets`: バイナリ資産

DuckDB を採用する理由は、単なる KVS ではなく「JSON とバイナリを同じ問い合わせ面で扱えること」にある。

## 評価ポイント

- `pnpm build:pages` 後の `docs/` に DuckDB-WASM の `.wasm` / worker が出力されている
- `pnpm preview` でページを開き、DB 初期化エラーなく UI が表示される
- Export / Import / Clear Cache がブラウザ上で操作できる

## 関連スキル

- `portable-ui-architecture.md`
- `portable-ui-data-model.md`
- `portable-ui-distribution.md`
