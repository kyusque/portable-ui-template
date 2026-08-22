// Note domain type — demonstrates a second independent component data shape.
export interface NoteData extends Record<string, unknown> {
  body: string;
  pinned?: boolean;
}

export interface NoteItem {
  pk: 'Note';
  sk: string; // e.g. "note#<id>"
  data: NoteData;
}
