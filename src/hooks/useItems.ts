import { useState, useEffect, useCallback } from 'react';
import type { RecordEntry, KVSData } from '../domain/index';
import { useDbContext } from './useDb';
import { persistDB } from '../storage/duckdb';

/**
 * Hook to read and write records for a component namespace.
 */
export function useRecords<T extends KVSData = KVSData>(namespace: string | null) {
  const { db, ready, refresh, revision } = useDbContext();
  const [records, setRecords] = useState<RecordEntry<T>[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!db || !ready) return;
    setLoading(true);
    const conn = await db.connect();
    const query = namespace
      ? `SELECT key, data::TEXT AS data
         FROM records WHERE key LIKE '${namespace.replace(/'/g, "''")}:%'`
      : 'SELECT key, data::TEXT AS data FROM records';
    const result = await conn.query(query);
    await conn.close();
    const rows = result.toArray().map((r) => {
      const row = r.toJSON() as Record<string, unknown>;
      return {
        key: row['key'] as string,
        data: JSON.parse(row['data'] as string) as T,
      } satisfies RecordEntry<T>;
    });
    setRecords(rows);
    setLoading(false);
  }, [db, ready, namespace]);

  useEffect(() => {
    void fetch();
  }, [fetch, revision]);

  const upsert = useCallback(
    async (key: string, data: T) => {
      if (!db) return;
      const fullKey = namespace ? `${namespace}:${key}` : key;
      const keyEsc = fullKey.replace(/'/g, "''");
      const dataStr = JSON.stringify(data).replace(/'/g, "''");
      const conn = await db.connect();
      await conn.query(`
        INSERT INTO records (key, data)
        VALUES ('${keyEsc}', '${dataStr}')
        ON CONFLICT (key) DO UPDATE SET
          data = excluded.data
      `);
      await conn.close();
      await persistDB(db);
      await fetch();
      refresh();
    },
    [db, namespace, fetch, refresh]
  );

  const remove = useCallback(
    async (key: string) => {
      if (!db) return;
      const fullKey = namespace ? `${namespace}:${key}` : key;
      const keyEsc = fullKey.replace(/'/g, "''");
      const conn = await db.connect();
      await conn.query(
        `DELETE FROM records WHERE key = '${keyEsc}'`
      );
      await conn.close();
      await persistDB(db);
      await fetch();
      refresh();
    },
    [db, namespace, fetch, refresh]
  );

  return { records, loading, fetch, upsert, remove };
}
