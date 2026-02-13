import type { AdminFormCommonConfig, AdminFormSchema } from '../types';

export interface CompiledFieldSchema extends AdminFormSchema {
  compiledFormItemClass: string;
  hashId: string;
}

export interface CompiledSchema {
  commonConfig: AdminFormCommonConfig;
  dependencyGraph: Map<string, string[]>;
  fieldMap: Map<string, CompiledFieldSchema>;
  fields: CompiledFieldSchema[];
  hash: string;
}
