/**
 * Framework-agnostic binding for SampleComponent.
 * Mounts the React component into any DOM element.
 */

import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { DbProvider } from '../../../src/hooks/useDb';
import { SampleComponent } from '../../../src/components/SampleComponent';
import type { SampleComponentProps } from '../../../src/components/SampleComponent';

const roots = new WeakMap<HTMLElement, Root>();

export function mount(element: HTMLElement, props: SampleComponentProps = {}) {
  let root = roots.get(element);
  if (!root) {
    root = createRoot(element);
    roots.set(element, root);
  }
  root.render(
    createElement(DbProvider, null, createElement(SampleComponent, props))
  );
}

export function unmount(element: HTMLElement) {
  const root = roots.get(element);
  if (root) {
    root.unmount();
    roots.delete(element);
  }
}

export { SampleComponent } from '../../../src/components/SampleComponent';
export type { SampleComponentProps } from '../../../src/components/SampleComponent';
