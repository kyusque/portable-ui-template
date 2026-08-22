# portable-ui-component-design

## Role

Use this skill when creating, changing, or reviewing a React component, its
props, local state, callbacks, or a host adapter. Apply
`portable-ui-architecture` first when the change also introduces a new source
boundary.

The shared component is the single implementation of a user-visible
capability. Browser and non-default hosts may supply data transformations and
persistence callbacks, but must not recreate its editing behavior or markup.

## Component boundary

- Put every visual React component in `src/components/<Component>/`, including
  a component currently used by only one host.
- A component imports React, its CSS, and serializable UI contracts only. It
  must not import DuckDB, OPFS, Streamlit, SQL, or host message protocols.
- Name the component and every corresponding adapter after the same
  user-visible capability. In this sample repository, use the `Sample` prefix
  and precise capability names such as `SampleRecordGrid`, not product labels
  such as `Spreadsheet`.
- Props must describe UI data and callback boundaries. A shared component may
  preserve opaque application fields in a record payload, but must not
  interpret storage keys, hashes, table names, or host-specific values.
- A visual asset is `{ id?, name, href? }`: `id` is an opaque identity for
  reconciling the same asset, `href` is only for rendering or downloading, and
  binary content never enters the shared model.
- Inspectors are components too. They receive serializable rows or BLOB-free
  metadata; `App.tsx` or a host adapter obtains the data.

## State ownership

1. The shared component owns transient interaction state: drafts, dirty status,
   ordering, selected files, local previews, save-in-progress state, and
   presentation errors.
2. Hosts own only boundary state: initial data, an explicit reset `revision`,
   and load/save integration. They must not mirror active drafts in Browser
   persistence, Python, or `st.session_state`.
3. Initial values are applied when `revision` changes. An unrelated host
   rerender, including a late Blob URL resolving for an existing asset, must
   not discard an active draft.
4. The component converts selected files into its serializable preview model.
   A host callback may persist or translate the file and return updated opaque
   record data, but it does not manage rows, dirty state, ordering, or controls.
5. Save is the explicit boundary. The component emits a complete serializable
   result; the Browser integration persists it and the Streamlit adapter sends
   it through the host protocol.

For editable tables, provide one table-level Save with explicit dirty state.
Place the editor before its inspector, and include image and attachment controls
in the shared UI rather than adding host-specific controls later.

## Host adapters

- `App.tsx` is the default Browser integration. It translates CAS/OPFS values
  to and from the component contract and persists only at the defined boundary.
- `adapters/<host>/<Component>/` translates a host render/value protocol. It
  may request a reset by changing `revision`, and may react to content-size
  changes, but it must not hold a second editable table state.
- `entries/<host>-<component>/` mounts an adapter only. It contains no feature
  behavior.
- Share the actual component markup and CSS. Similar-looking host-specific
  layouts are a defect unless the host has a documented incompatible capability.

## Evaluation

Accept a component only when one implementation owns every editing operation,
the host boundary can be understood independently, and no component behavior
depends on a concrete database or host runtime. Reject controlled display-only
components that force each host to duplicate draft, row-operation, asset, or
dirty-state logic.

## Verification

Build every affected host target. Exercise initial load, edits, reorder,
file/image attachment changes, Save, host-requested reset, and a late asset URL
resolution without losing unsaved edits.
