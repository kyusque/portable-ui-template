// Sample domain type — demonstrates how a component's data shape is defined.
export interface SampleData extends Record<string, unknown> {
  title: string;
  count: number;
  tags?: string[];
}

export interface SampleItem {
  key: string;
  data: SampleData;
}
