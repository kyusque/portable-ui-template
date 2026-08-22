# portable-ui-data-model

## Role

Use this skill when adding persisted state or reviewing a schema. Choose the
smallest generic contract that supports the access pattern; do not name a
table after a current feature.

## Contract

```sql
CREATE TABLE records (
  key  TEXT NOT NULL PRIMARY KEY,
  data JSON
);
```

`key` is an opaque application key. A namespace may be encoded as
`<namespace>:<identifier>`, but consumers must not depend on a partition-key /
sort-key vocabulary. `data` is the feature payload and may evolve with
backwards-compatible defaults.

Binary data uses the separate content-addressed `assets` table. Its hash is
only an implementation detail; JSON records store a reference to it.

## Design process

1. List the reads and writes the UI actually needs.
2. Choose a deterministic key and document its namespace.
3. Keep feature-specific fields inside `data`.
4. Define import/export compatibility before changing the shape.
5. Prefer one query surface over feature-specific tables.

## Evaluation

The design passes when two unrelated components can share the contract,
records remain addressable after a reload, and a schema change does not require
renaming storage tables. Reject designs that leak infrastructure terminology
into domain types or require joins for a component's primary view.
