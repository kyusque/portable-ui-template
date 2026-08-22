import { useState, useEffect, useCallback } from 'react';
import type { Item, KVSData } from '../domain/index';
import { useDbContext } from './useDb';
import { persistDB } from '../db/duckdb';

/**
 * Hook to read and write items for a given partition key.
 */
export function useItems<T extends KVSData = KVSData>(pk: string) {
  const { db, ready } = useDbContext();
  const [items, setItems] = useState<Item<T>[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!db || !ready) return;
    setLoading(true);
    const conn = await db.connect();
    const result = await conn.query(
      `SELECT pk, sk, data::TEXT AS data
       FROM items WHERE pk = '${pk.replace(/'/g, "''")}'`
    );
    await conn.close();
    const rows = result.toArray().map((r) => {
      const row = r.toJSON() as Record<string, unknown>;
      return {
        pk: row['pk'] as string,
        sk: row['sk'] as string,
        data: JSON.parse(row['data'] as string) as T,
      } satisfies Item<T>;
    });
    setItems(rows);
    setLoading(false);
  }, [db, ready, pk]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const upsert = useCallback(
    async (sk: string, data: T) => {
      if (!db) return;
      const pkEsc = pk.replace(/'/g, "''");
      const skEsc = sk.replace(/'/g, "''");
      const dataStr = JSON.stringify(data).replace(/'/g, "''");
      const conn = await db.connect();
      await conn.query(`
        INSERT INTO items (pk, sk, data)
        VALUES ('${pkEsc}', '${skEsc}', '${dataStr}')
        ON CONFLICT (pk, sk) DO UPDATE SET
          data = excluded.data
      `);
      await conn.close();
      await persistDB(db);
      await fetch();
    },
    [db, pk, fetch]
  );

  const remove = useCallback(
    async (sk: string) => {
      if (!db) return;
      const pkEsc = pk.replace(/'/g, "''");
      const skEsc = sk.replace(/'/g, "''");
      const conn = await db.connect();
      await conn.query(
        `DELETE FROM items WHERE pk = '${pkEsc}' AND sk = '${skEsc}'`
      );
      await conn.close();
      await persistDB(db);
      await fetch();
    },
    [db, pk, fetch]
  );

  return { items, loading, fetch, upsert, remove };
}
