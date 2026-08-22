# ブラウザキャッシュ設計

## 概要

このテンプレートでは UI の状態・データをブラウザ内にキャッシュする仕組みを持つ。
バックエンドは不要で、データはすべてクライアント側で完結する。

現在の実装は **DuckDB-WASM** を採用しているが、設計の関心はあくまで
「ブラウザキャッシュとしての使い勝手」であり、将来的に別の実装（IndexedDB 直接・
OPFS・SQLite-WASM 等）に置き換えても同じインターフェースを維持できるようにしておく。

実装コードは `src/domain/duckdb.ts` を参照。

## キャッシュの役割

- `items` / `assets` テーブルのデータをブラウザセッション間で保持する
- キャッシュがなくても動作する（Optional）— 初回は空の状態から始まる
- キャッシュがあれば前回の状態を復元する

## 永続化

シリアライズした状態（JSON）を `localStorage` に保存する。
大きなデータには `IndexedDB` への切り替えを検討する。

- ミューテーション後に自動保存
- キャッシュキー: `duckdb-cache`

## エクスポート / インポート

キャッシュはファイルとしてダウンロード・アップロードできる。

```typescript
import { exportDB, importDB } from '@/domain/duckdb';

// エクスポート → ファイル保存
const buffer = await exportDB(db);

// インポート ← ファイル読み込み
await importDB(db, buffer);
```

これにより別の端末・環境へのデータ移行、スナップショット共有が可能。

## アセット（バイナリデータ）

生のバイナリデータ（画像・PDF 等）は `assets` テーブルに格納する。

### 挿入（ファイルアップロード）

```typescript
import { storeAsset } from '@/domain/assets';

async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;
  const hash = await storeAsset(db, file);
  await upsert('post#1', { title: 'My post', imageHash: hash });
}
```

### 表示（Blob API — CORS 不要）

DB から取り出したバイトを Blob API で object URL に変換する。
リモートへのリクエストが発生しないため **CORS 制約を受けない**。

```typescript
import { getAssetURL } from '@/domain/assets';

const url = await getAssetURL(db, hash, 'image/png');
imgElement.src = url ?? '';
// 不要になったら解放: URL.revokeObjectURL(url)
```

## 現在の実装: DuckDB-WASM

- ブラウザ内で SQL が使える（集計・JSON パスクエリ等）
- BLOB は `registerFileBuffer` + `read_blob()` で挿入、Apache Arrow の
  Binary カラム（`.getChild().get()`）で `Uint8Array` として読み出す
- スキーマ変更は `ALTER TABLE` で段階的に行える
- データ構造の試行錯誤に向いている

将来的に別のストレージに移行する場合は `src/domain/duckdb.ts` を差し替える。
