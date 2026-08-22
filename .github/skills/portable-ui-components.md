# Component Authoring Guidelines

## File Structure

Each component lives in `src/components/<ComponentName>/`:

```
src/components/SampleComponent/
  index.tsx         # Main React component
  types.ts          # Props and domain types (re-exports from src/domain/)
  hooks.ts          # Component-specific hooks (data fetching, mutations)
  SampleComponent.css  # Scoped styles (optional)
```

## Domain Types

Domain types (data shapes used in `items.data`) live in `src/domain/<entity>.ts`:

```typescript
// src/domain/sample.ts
export interface SampleItem {
  pk: string;
  sk: string;
  data: SampleData;
}

export interface SampleData {
  title: string;
  value: number;
  // ...
}
```

## Bindings

A binding is a thin framework-agnostic wrapper over a component:

```typescript
// dist/components/SampleComponent/binding.ts
export function mountSampleComponent(element: HTMLElement, props: SampleProps) {
  // Use ReactDOM.render / createRoot to mount
}
export function unmountSampleComponent(element: HTMLElement) {
  // Cleanup
}
```

## Data Flow

```
DuckDB (items/assets)
    ↓  useItems() hook
React Component (render)
    ↓  user interaction
DuckDB mutation + cache persist
```

## Naming Conventions

- Component: `PascalCase` (`SampleComponent`)
- Hook: `use<Name>` (`useSampleItems`)
- Domain type: `PascalCase` (`SampleData`)
- DB query helpers: `camelCase` (`queryItems`, `upsertItem`)
