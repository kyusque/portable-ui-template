import { useState } from 'react';
import type { SampleData } from '../../domain/sample';
import { useItems } from '../../hooks/useItems';
import './SampleComponent.css';

export interface SampleComponentProps {
  initialData?: SampleData;
}

export function SampleComponent({ initialData }: SampleComponentProps) {
  const { items, loading, upsert, remove } = useItems<SampleData>('Sample');
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [count, setCount] = useState(initialData?.count ?? 0);

  const handleAdd = async () => {
    if (!title.trim()) return;
    const sk = `sample#${Date.now()}`;
    await upsert(sk, { title, count });
    setTitle('');
    setCount(0);
  };

  return (
    <div className="sample-component">
      <h2>Sample Component</h2>

      <div className="sample-form">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="number"
          placeholder="Count"
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        />
        <button onClick={handleAdd}>Add</button>
      </div>

      {loading && <p>Loading…</p>}

      <ul className="sample-list">
        {items.map((item) => (
          <li key={item.sk}>
            <strong>{item.data.title}</strong> — {item.data.count}
            {item.data.tags && (
              <span className="tags">
                {item.data.tags.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </span>
            )}
            <button onClick={() => remove(item.sk)}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
