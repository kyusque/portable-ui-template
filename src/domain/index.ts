// Core single-table item structure (DynamoDB-style)
export interface Item<T = Record<string, unknown>> {
  pk: string;
  sk: string;
  data: T;
}

// Asset (Content-Addressable Storage) entry
export interface Asset {
  hash: string;
  content: Uint8Array; // Raw bytes — stored as BLOB, read via Arrow Binary column
  size: number;
}

// Generic KVS entry stored in items.data
export type KVSData = Record<string, unknown>;
