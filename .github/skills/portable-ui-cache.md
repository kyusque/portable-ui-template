# portable-ui-cache

## Role

Use this skill when changing persistence, cache invalidation, or import/export.
The cache is an optimization for a browser-local database, never the source
of truth for a distributable artifact.

## Decisions

- Persist a versioned export, not implementation-specific object state.
- Restore only after the schema exists and discard invalid data safely.
- Persist after successful mutations; clear cache must be explicit and
  harmless when storage is unavailable.
- Keep export/import independent from `localStorage` so users can back up or
  move data.

## Evaluation

Test first load, mutation, reload, clear cache, valid import, malformed import,
and storage quota/unavailability. The UI must remain usable when caching fails.
