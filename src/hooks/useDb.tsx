import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import type * as duckdb from '@duckdb/duckdb-wasm';
import { initDB } from '../storage/duckdb'

interface DbContextValue {
  db: duckdb.AsyncDuckDB | null;
  ready: boolean;
  error: Error | null;
  revision: number;
  refresh: () => void;
}

const DbContext = createContext<DbContextValue>({
  db: null,
  ready: false,
  error: null,
  revision: 0,
  refresh: () => undefined,
});

export function DbProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [revision, setRevision] = useState(0);

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
    <DbContext.Provider
      value={{ db, ready, error, revision, refresh: () => setRevision((value) => value + 1) }}
    >
      {error && <p role="alert">Database initialization failed: {error.message}</p>}
      {children}
    </DbContext.Provider>
  );
}

export function useDbContext(): DbContextValue {
  return useContext(DbContext);
}
