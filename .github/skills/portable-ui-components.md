# portable-ui-components

## Role

Use this skill when creating or reviewing a component. A component owns its
presentation and domain payload, but not the database implementation or host
integration.

## Decisions

1. Put reusable UI in `src/components/<Name>/`.
2. Put payload types in `src/domain/` and persist them through the generic
   `records` contract.
3. Use hooks for lifecycle and mutations; keep SQL out of render code.
4. Expose a thin host binding only when a non-React consumer needs it.

## Naming

Use `PascalCase` for components and payload types, `use<Name>` for hooks, and
camelCase for functions. Name a feature by its capability (for example,
`portable-ui-note-list`), not by storage mechanics.

## Evaluation

The component passes when it can render with a typed payload, survives reload,
has no host-specific data logic, and can be built through the intended target.
Review accessibility and empty/loading/error states before adding visual
polish.
