export interface FormLocaleMessages {
  collapse: string;
  expand: string;
  invalid: string;
  querySubmit: string;
  rangeInvalid: string;
  reset: string;
  required: string;
  selectRequired: string;
  submit: string;
}

export interface SubmitPageLocaleMessages {
  cancel: string;
  close: string;
  next: string;
  previous: string;
  submit: string;
}

export interface AdminFormLocaleMessages {
  form: FormLocaleMessages;
  submitPage: SubmitPageLocaleMessages;
}

export interface LocaleMessageInput {
  form?: Partial<FormLocaleMessages>;
  submitPage?: Partial<SubmitPageLocaleMessages>;
}
