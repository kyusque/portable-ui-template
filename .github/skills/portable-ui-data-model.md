# Data Model

## Philosophy

Each UI component owns its data in an isolated single-table structure inspired by DynamoDB's single-table design pattern. This approach:

- Keeps component data self-contained and portable.
- Enables efficient access patterns without JOINs for single-component views.
- Allows cross-component linkage via `pk`/`sk` references in `data`.

## `items` Table

```sql
CREATE TABLE IF NOT EXISTS items (
  pk   TEXT NOT NULL,
  sk   TEXT NOT NULL,
  data JSON,
  PRIMARY KEY (pk, sk)
);
```

Additional metadata such as timestamps can be stored inside the `data` JSON.
Keep the schema minimal and extend with `ALTER TABLE` only when necessary.

### Usage Patterns

| Pattern | pk | sk | data |
|---------|----|----|------|
| Entity  | `"User"` | `"user#123"` | `{"name": "Alice", "email": "..."}` |
| Setting | `"Config"` | `"theme"` | `{"mode": "dark"}` |
| Relation| `"User#123"` | `"Post#456"` | `{"role": "author"}` |

## `assets` Table

```sql
CREATE TABLE IF NOT EXISTS assets (
  hash    TEXT    NOT NULL PRIMARY KEY,
  content BLOB    NOT NULL,
  size    INTEGER NOT NULL
);
```

### Usage

- Store images, files, or any binary content.
- Content is stored as a DuckDB `BLOB`. Insert via `registerFileBuffer` + `read_blob()`; read back as `Uint8Array` through Apache Arrow's Binary column.
- Reference from `items.data` as `{"imageHash": "<hash>"}`.
- Hash is SHA-256 of raw content — identical content is stored once.
- Use `getAssetURL()` to generate a Blob API object URL — no CORS required for in-browser display.

## Cross-Component References

To link data across components, store the foreign `pk`/`sk` in the `data` JSON:

```json
{
  "user_pk": "User",
  "user_sk": "user#123"
}
```

Query example:
```sql
SELECT i2.*
FROM items i1
JOIN items i2
  ON i2.pk = json_extract_string(i1.data, '$.user_pk')
 AND i2.sk = json_extract_string(i1.data, '$.user_sk')
WHERE i1.pk = 'Post' AND i1.sk = 'post#456';
```
