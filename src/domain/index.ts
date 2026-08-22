// Generic record stored in the browser database.
export interface RecordEntry<T = Record<string, unknown>> {
  key: string;
  data: T;
}

// Asset (Content-Addressable Storage) entry
export interface Asset {
  hash: string;
  content: Uint8Array; // Raw bytes — stored as BLOB, read via Arrow Binary column
  size: number;
}

// Generic JSON payload stored in records.data
export type KVSData = Record<string, unknown>;
