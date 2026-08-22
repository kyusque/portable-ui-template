# portable-ui-distribution

## Role

Use this skill when deciding where a build should be placed. Multiple outputs
exist because consumers receive different units, not because each target needs
different application logic.

## Placement decisions

- `docs/`: browser-reviewable GitHub Pages artifact; this is the acceptance
  surface for interaction and runtime assets.
- `static_site/`: portable static bundle for non-GitHub hosting or an archive.
- `dist/`: package/library artifact for embedding components.
- `streamlit_portable_ui_sample/frontend/<Component>/`: one iframe asset set
  per Python custom component.

Keep the source and data contract shared. Add a target only when its consumer,
entry point, and verification method are distinct; otherwise extend an
existing target.

## Evaluation

For each target, answer: who consumes it, what is the smallest handoff, and how
will it be tested? Reject a target that only duplicates an existing directory
or changes domain behavior to satisfy packaging.

## Verification

Run the matching `pnpm build:*` command, inspect the output in isolation, and
execute the target's real entry point. The Pages artifact must be tested in a
browser; Streamlit output must be loaded by its Python wrapper.
