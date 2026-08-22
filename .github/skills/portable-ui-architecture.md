# portable-ui-architecture

## Role

Use this skill for every portable UI feature or structural change. The goal is
one browser-first implementation that can be handed to several hosts without
changing its domain behavior.

## Technology baseline

This template uses React for rendering and Vite for development, entry-point
selection, and production packaging. New features should remain compatible
with the React + Vite baseline unless a deliberate architecture decision
replaces it. Vite configuration may choose different entries and output
directories, but must not duplicate React components or domain behavior.

## Directory structure

```text
src/
  components/                          # all React presentation components
    <Component>/
      <Component>.tsx                  # markup and local interaction state
      <Component>.css
      types.ts                          # serializable props and callback models
  domain/
    <feature>/                         # host-neutral domain contracts
  hooks/                               # default application React hooks
  storage/                             # default application persistence
  adapters/                            # non-default host integrations
    <other-host>/
      <Component>/                     # other-host integration for a component
      <hostBridge>.ts
  App.tsx                              # default app and integration example
  main.tsx                             # provider setup and default Vite entry
  entries/
    <other-host>-<component>/          # thin non-default host mount
  assets/
```

Name every layer after the same user-visible capability. The shared component
and each host implementation use the same `<Component>` directory name, so
their correspondence is visible from the path:

```text
components/<Component>/                # presentation UI
App.tsx                                # default integration example
adapters/<other-host>/<Component>/          # other-host integration
```

`App.tsx` shows application state and persistence through `storage`; it supplies
values and callbacks to components. Production applications may extract this
example into their own feature structure without changing the component contract.
`adapters/<other-host>`
are specifically host integration code. `domain` must not depend on React. The default application is
mounted by `main.tsx`; its normal development and production builds use Vite's
default entry. `entries` mount only non-default hosts and must not contain
feature behavior. Build configuration selects a non-default entry only when a
host requires one; it must not fork domain behavior.

Remove obsolete feature directories rather than leaving empty or superseded
components beside the shared implementation. A structural migration is complete
only when each old component has either been removed or has a distinct,
documented consumer.

Avoid parallel names for one capability. Pick one capability name and retain it
in shared, Browser, and other-host implementations. A host's public API may
append a host convention such as `Widget`, but must retain the same capability
stem.

## Design principles

1. Keep rendering, domain types, storage, default-app orchestration, and host bindings separate.
2. Components, storage, and host integration use independently reviewable
   boundaries.
3. Treat every output as a packaging of the same source, not a second
   implementation.
4. Keep infrastructure terminology out of domain types and component APIs.

Use hooks for lifecycle and mutations; keep SQL out of render code. Add a thin
host binding only when a non-React consumer needs it.

## Template conventions learned from implementation

- Treat the default React/Vite application as the Browser implementation:
  `main.tsx` mounts providers and `App.tsx` contains the copyable integration
  example. Do not add a `browser/` source root, a Browser entry override, or a
  one-sample `features/`/`bindings/` layer merely to name the default.
- Keep a sample's data exchange in one readable integration file. For the
  default app, show component props, callbacks, persistence calls, and
  inspector inputs together in `App.tsx`; do not distribute the example across
  feature, binding, or sample files. Extract only when the code becomes a real
  product feature with its own independently reusable boundary.
- Use `adapter` for a non-default host such as Streamlit because it translates
  that host's render events and value protocol. Do not call persistence or
  default-app orchestration a `binding`.

## Skill selection

Apply this skill first. Add `portable-ui-component-design` when the change
creates or changes visual UI, component contracts, local editing state, or a
host adapter. Add `portable-ui-storage` when the change persists, queries,
caches, imports, or exports data. Add `portable-ui-delivery` when the change
alters build targets or output placement.

## Change and commit workflow

1. Identify the affected directory boundary and record the design decision.
2. Apply the relevant detail skill(s).
3. Run the required targeted verification and relevant builds.
4. Commit one coherent user-visible change; do not create a commit merely
   because a skill was consulted.

Use conventional prefixes such as `feat:`, `fix:`, `refactor:`, or `build:`.
Mention the affected boundary in the commit subject when useful.

## Evaluation

Accept a design only when a reviewer can identify the stable domain API,
storage contract, and host-specific adapter independently. Reject designs that
make a component depend on a concrete table name, host runtime, or duplicated
business rule.

## Verification

- Run `pnpm lint` and every relevant build target.
- Serve `docs/` and exercise startup, create, update, delete, reload, export,
  import, and asset flows in a browser.
- Check that each distribution resolves its Worker and `.wasm` assets as
  specified by `portable-ui-delivery`.

See the storage and delivery skills for boundary-specific decisions.
