import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import type * as duckdb from '@duckdb/duckdb-wasm';
import { initDB } from '../db/duckdb';

interface DbContextValue {
  db: duckdb.AsyncDuckDB | null;
  ready: boolean;
  error: Error | null;
}

const DbContext = createContext<DbContextValue>({
  db: null,
  ready: false,
  error: null,
});

export function DbProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initDB()
      .then((instance) => {
        setDb(instance);
        setReady(true);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err : new Error(String(err)));
      });
  }, []);

  return (
    <DbContext.Provider value={{ db, ready, error }}>
      {children}
    </DbContext.Provider>
  );
}

export function useDbContext(): DbContextValue {
  return useContext(DbContext);
}
