export interface TableRenderContext<
  TRow extends Record<string, any> = Record<string, any>,
> {
  attrs?: Record<string, any>;
  column: Record<string, any>;
  options?: any[];
  props?: Record<string, any>;
  row: TRow;
  value: any;
}

export type TableRenderer<TNode = unknown> = (
  context: TableRenderContext
) => TNode;

export interface TableRendererRegistry<TNode = unknown> {
  get(name: string): TableRenderer<TNode> | undefined;
  list(): string[];
  register(name: string, renderer: TableRenderer<TNode>): void;
  remove(name: string): void;
  resolve(name: string): TableRenderer<TNode> | null;
}

export type TableFormatter = (
  value: any,
  context?: {
    column?: Record<string, any>;
    row?: Record<string, any>;
  }
) => any;

export interface TableFormatterRegistry {
  get(name: string): TableFormatter | undefined;
  list(): string[];
  register(name: string, formatter: TableFormatter): void;
  remove(name: string): void;
}
