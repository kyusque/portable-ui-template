import { useState } from 'react';
import type { SampleData } from '../../domain/sample';
import { useRecords } from '../../hooks/useItems';
import './SampleComponent.css';

export interface SampleComponentProps {
  initialData?: SampleData;
}

export function SampleComponent({ initialData }: SampleComponentProps) {
  const { records, loading, upsert, remove } = useRecords<SampleData>('Sample');
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [count, setCount] = useState(initialData?.count ?? 0);

  const handleAdd = async () => {
    if (!title.trim()) return;
    const key = `sample#${Date.now()}`;
    await upsert(key, { title, count });
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
        {records.map((record) => (
          <li key={record.key}>
            <strong>{record.data.title}</strong> — {record.data.count}
            {record.data.tags && (
              <span className="tags">
                {record.data.tags.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </span>
            )}
            <button onClick={() => remove(record.key.split(':').slice(1).join(':'))}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
