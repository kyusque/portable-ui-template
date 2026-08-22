# portable-ui-architecture

## Role

Use this skill when designing or reviewing a portable UI feature. The goal is
one browser-first implementation that can be handed to several hosts without
changing its domain behavior.

## Decisions

1. Keep component rendering, domain types, storage, and host bindings separate.
2. Give storage a generic `records(key, data)` contract. A component namespace
   belongs in the key value; table and column names must not encode a domain.
3. Keep binary payloads in `assets` and reference them from JSON data.
4. Treat every output as a packaging of the same source, not a second
   implementation.

## Evaluation

Accept a design only when a reviewer can identify the stable domain API,
storage contract, and host-specific adapter independently. Reject designs that
make a component depend on a concrete table name, host runtime, or duplicated
business rule.

## Verification

- Run `pnpm lint` and every relevant build target.
- Serve `docs/` and exercise startup, create, update, delete, reload, export,
  import, and asset flows in a browser.
- Check that each distribution contains its own worker and `.wasm` assets.

See the data-model, duckdb, distribution, cache, and components skills for the
decisions that apply to each boundary.
