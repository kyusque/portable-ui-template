// Note domain type — demonstrates a second independent component data shape.
export interface NoteData extends Record<string, unknown> {
  body: string;
  pinned?: boolean;
}

export interface NoteItem {
  key: string;
  data: NoteData;
}
