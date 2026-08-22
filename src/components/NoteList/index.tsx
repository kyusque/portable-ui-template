import { useState } from 'react';
import type { NoteData } from '../../domain/note';
import { useItems } from '../../hooks/useItems';
import './NoteList.css';

export interface NoteListProps {
  initialBody?: string;
}

export function NoteList({ initialBody = '' }: NoteListProps) {
  const { items, loading, upsert, remove } = useItems<NoteData>('Note');
  const [body, setBody] = useState(initialBody);

  const handleAdd = async () => {
    if (!body.trim()) return;
    const sk = `note#${Date.now()}`;
    await upsert(sk, { body, pinned: false });
    setBody('');
  };

  const togglePin = async (sk: string, current: NoteData) => {
    await upsert(sk, { ...current, pinned: !current.pinned });
  };

  return (
    <div className="note-list">
      <h2>Note List</h2>

      <div className="note-form">
        <textarea
          placeholder="Write a note…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
        />
        <button onClick={handleAdd}>Add</button>
      </div>

      {loading && <p>Loading…</p>}

      <ul className="notes">
        {items.map((item) => (
          <li key={item.sk} className={item.data.pinned ? 'pinned' : ''}>
            <span>{item.data.body}</span>
            <button onClick={() => togglePin(item.sk, item.data)}>
              {item.data.pinned ? '📌' : '📍'}
            </button>
            <button onClick={() => remove(item.sk)}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
