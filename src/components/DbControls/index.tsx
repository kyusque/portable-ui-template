import { useRef } from 'react';
import { useDbContext } from '../../hooks/useDb';
import { exportDB, importDB, clearCache } from '../../db/duckdb';

export function DbControls() {
  const { db, ready } = useDbContext();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (!db) return;
    const buffer = await exportDB(db);
    const blob = new Blob([buffer], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.duckdb.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!db || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const buffer = await file.arrayBuffer();
    await importDB(db, buffer);
    alert('Import complete. Reload the page to see updated data.');
  };

  const handleClearCache = () => {
    clearCache();
    alert('Cache cleared. Reload the page.');
  };

  if (!ready) return null;

  return (
    <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem', fontSize: '0.85rem' }}>
      <button onClick={handleExport}>Export DB</button>
      <button onClick={() => fileRef.current?.click()}>Import DB</button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImport}
      />
      <button onClick={handleClearCache}>Clear Cache</button>
    </div>
  );
}
