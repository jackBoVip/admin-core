export type BuiltInSupportedLocale = 'en-US' | 'zh-CN';
export type SupportedLocale = BuiltInSupportedLocale | (string & {});

export interface PageLocaleMessages {
  page: {
    empty: string;
    noMatchRoute: string;
    untitled: string;
  };
}

export interface PageLocaleMessageInput {
  page?: Partial<PageLocaleMessages['page']>;
}
