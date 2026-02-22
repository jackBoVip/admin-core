import type { AdminFormLocaleMessages } from './types';

export const enUS: AdminFormLocaleMessages = {
  form: {
    collapse: 'Collapse',
    expand: 'Expand',
    invalid: '{label} is invalid',
    querySubmit: 'Search',
    rangeInvalid: '{label} range is invalid',
    reset: 'Reset',
    required: 'Please input {label}',
    selectRequired: 'Please select {label}',
    submit: 'Submit',
  },
  submitPage: {
    cancel: 'Cancel',
    close: 'Close',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
  },
} as const;
