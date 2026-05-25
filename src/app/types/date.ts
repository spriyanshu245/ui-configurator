export interface ValidateDateParams {
  input: string;
  error: string;
  format?: string;
  separator?: string;
}

export interface ValidateDateFormatParams {
  input: string;
  day: string;
  month: string;
  year: string;
  error: string;
}

export interface InputFormatSeparatorParams {
  input: string;
  format?: string;
  separator?: string;
}

export interface DateValidationParams {
  year: string;
  month: string;
  day: string;
}

export interface CompareMinMaxDatesParams {
  field: string;
  input: string;
  properties: { minDate?: string; maxDate?: string };
}

export interface ValidateMinMaxDatesParams {
  inputDate: string;
  comparisonDate: string;
  isMinDate: boolean;
}
