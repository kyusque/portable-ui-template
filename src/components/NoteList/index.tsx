import { useState } from 'react';
import type { NoteData } from '../../domain/note';
import { useRecords } from '../../hooks/useItems';
import './NoteList.css';

export interface NoteListProps {
  initialBody?: string;
}

export function NoteList({ initialBody = '' }: NoteListProps) {
  const { records, loading, upsert, remove } = useRecords<NoteData>('Note');
  const [body, setBody] = useState(initialBody);

  const handleAdd = async () => {
    if (!body.trim()) return;
    const key = `note#${Date.now()}`;
    await upsert(key, { body, pinned: false });
    setBody('');
  };

  const togglePin = async (key: string, current: NoteData) => {
    await upsert(key, { ...current, pinned: !current.pinned });
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
        {records.map((record) => (
          <li key={record.key} className={record.data.pinned ? 'pinned' : ''}>
            <span>{record.data.body}</span>
            <button onClick={() => togglePin(record.key.split(':').slice(1).join(':'), record.data)}>
              {record.data.pinned ? '📌' : '📍'}
            </button>
            <button onClick={() => remove(record.key.split(':').slice(1).join(':'))}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
