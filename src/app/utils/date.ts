import { ComponentProperty } from "../data/componentProperties";
import {
  CompareMinMaxDatesParams,
  DateValidationParams,
  InputFormatSeparatorParams,
  ValidateDateFormatParams,
  ValidateDateParams,
  ValidateMinMaxDatesParams,
} from "../types/date";
import { DATE_ERROR_MESSAGE } from "./constants";

export const formatDateInputWithPlaceHolder = (
  input: string,
  placeholder = "DD/MM/YYYY"
) => {
  const placeholderArray = placeholder?.split("");
  input?.split("").forEach((char, index) => {
    if (
      placeholderArray[index] === "D" ||
      placeholderArray[index] === "M" ||
      placeholderArray[index] === "Y"
    ) {
      placeholderArray[index] = char;
    }
  });
  return placeholderArray?.join("");
};

const isLeapYear = (year: string) => {
  return (+year % 4 === 0 && +year % 100 !== 0) || +year % 400 === 0;
};

export const isDayValid = (day: string) => +day >= 1 && +day <= 31;
export const isYearValid = (year: string) => +year >= 1 && +year <= 9999;
export const isMonthValid = (month: string, day: string) => {
  const daysInMonths = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (+month < 1 || +month > 12) {
    return false;
  }
  if (day && day.length === 2) {
    const daysInMonth = daysInMonths[+month - 1];
    return +day >= 1 && +day <= daysInMonth;
  }
  return true;
};

const isDateValid = ({ year, month, day }: DateValidationParams) => {
  if (!isDayValid(day) || !isMonthValid(month, day) || !isYearValid(year)) {
    return false;
  }
  if (month === "02" && +day > (isLeapYear(year) ? 29 : 28)) {
    return false;
  }
  return true;
};

const getDayMonthYear = ({
  input,
  format = "DD/MM/YYYY",
  separator = "/",
}: InputFormatSeparatorParams) => {
  if (format === `DD${separator}MM${separator}YYYY`)
    return [input.slice(0, 2), input.slice(2, 4), input.slice(4, 8)];
  if (format === `MM${separator}DD${separator}YYYY`)
    return [input.slice(2, 4), input.slice(0, 2), input.slice(4, 8)];
  if (format === `YYYY${separator}MM${separator}DD`)
    return [input.slice(6, 8), input.slice(4, 6), input.slice(0, 4)];
  return ["", "", ""];
};

const validate_DD_MM_YYYY = ({
  input,
  day,
  month,
  year,
  error,
}: ValidateDateFormatParams) => {
  if (input.length === 1) {
    error = "";
  }
  if (input.length === 2 || input.length === 3) {
    error = !isDayValid(day) ? DATE_ERROR_MESSAGE : "";
  }
  if (input.length === 4 || input.length === 7) {
    error =
      !isDayValid(day) || !isMonthValid(month, day) ? DATE_ERROR_MESSAGE : "";
  }
  if (input.length === 8) {
    error = !isDateValid({ year, month, day }) ? DATE_ERROR_MESSAGE : "";
  }
  return error;
};

const validate_MM_DD_YYYY = ({
  input,
  day,
  month,
  year,
  error,
}: ValidateDateFormatParams) => {
  if (input.length === 1) {
    error = "";
  }
  if (input.length === 2 || input.length === 3) {
    error = !isMonthValid(month, day) ? DATE_ERROR_MESSAGE : "";
  }
  if (input.length === 4 || input.length === 7) {
    error =
      !isDayValid(day) || !isMonthValid(month, day) ? DATE_ERROR_MESSAGE : "";
  }
  if (input.length === 8) {
    error = !isDateValid({ year, month, day }) ? DATE_ERROR_MESSAGE : "";
  }
  return error;
};

const validate_YYYY_MM_DD = ({
  input,
  day,
  month,
  year,
  error,
}: ValidateDateFormatParams) => {
  if (input.length === 3) {
    error = "";
  }
  if (input.length === 4 || input.length === 5) {
    error = !isYearValid(year) ? DATE_ERROR_MESSAGE : "";
  }
  if (input.length === 6 || input.length === 7) {
    error =
      !isYearValid(year) || !isMonthValid(month, day) ? DATE_ERROR_MESSAGE : "";
  }
  if (input.length === 8) {
    error = !isDateValid({ year, month, day }) ? DATE_ERROR_MESSAGE : "";
  }

  return error;
};

export const validateDateInput = ({
  input: rowInput,
  error,
  format = "DD/MM/YYYY",
  separator = "/",
}: ValidateDateParams) => {
  const input = rowInput.replace(/\D/g, "");
  const [day, month, year] = getDayMonthYear({ input, format, separator });

  const validationLogic = {
    [`DD${separator}MM${separator}YYYY`]: () =>
      validate_DD_MM_YYYY({ input, day, month, year, error }),
    [`MM${separator}DD${separator}YYYY`]: () =>
      validate_MM_DD_YYYY({ input, day, month, year, error }),
    [`YYYY${separator}MM${separator}DD`]: () =>
      validate_YYYY_MM_DD({ input, day, month, year, error }),
  };
  return validationLogic[format] ? validationLogic[format]() : error;
};

const format_YYYY_MM_DD = (rowInput: string, separator: string) => {
  let formattedValue = "";
  const inputValue = rowInput.replace(/\D/g, "");
  if (inputValue.length > 3) {
    formattedValue += inputValue.slice(0, 4) + separator;
  } else {
    formattedValue += inputValue.slice(0, 4);
  }
  if (inputValue.length > 5) {
    formattedValue += inputValue.slice(4, 6) + separator;
  } else if (
    rowInput.length === 7 &&
    rowInput.endsWith(separator) &&
    +rowInput[rowInput.length - 2] > 0
  ) {
    formattedValue += 0 + rowInput.slice(5);
  } else if (inputValue.length > 1) {
    formattedValue += inputValue.slice(4, 6);
  }

  if (inputValue.length > 4) {
    formattedValue += inputValue.slice(6);
  }
  return formattedValue;
};

const format_MM_DD_YYYY_Or_DD_MM_YYYY = (
  rowInput: string,
  separator: string
) => {
  let formattedValue = "";
  const inputValue = rowInput.replace(/\D/g, "");
  if (inputValue.length > 1) {
    formattedValue += inputValue.slice(0, 2) + separator;
  } else if (
    rowInput.length === 2 &&
    rowInput.endsWith(separator) &&
    +rowInput[rowInput.length - 2] > 0
  ) {
    formattedValue += 0 + rowInput.slice(0);
  } else {
    formattedValue += inputValue.slice(0, 2);
  }

  if (inputValue.length > 3) {
    formattedValue += inputValue.slice(2, 4) + separator;
  } else if (
    rowInput.length === 5 &&
    rowInput.endsWith(separator) &&
    +rowInput[rowInput.length - 2] > 0
  ) {
    formattedValue += 0 + rowInput.slice(3);
  } else if (inputValue.length > 1) {
    formattedValue += inputValue.slice(2, 4);
  }

  if (inputValue.length > 3) {
    formattedValue += inputValue.slice(4);
  }
  return formattedValue;
};

export const formatDateInput = ({
  input,
  format = "DD/MM/YYYY",
  separator = "/",
}: InputFormatSeparatorParams) => {
  const formatInput = {
    [`DD${separator}MM${separator}YYYY`]: () =>
      format_MM_DD_YYYY_Or_DD_MM_YYYY(input, separator),
    [`MM${separator}DD${separator}YYYY`]: () =>
      format_MM_DD_YYYY_Or_DD_MM_YYYY(input, separator),
    [`YYYY${separator}MM${separator}DD`]: () =>
      format_YYYY_MM_DD(input, separator),
  };
  return formatInput[format] ? formatInput[format]() : "";
};

const parseStringIntoDate = (date: string): Date => {
  const [day, month, year] = date.split("/");
  return new Date(+year, +month - 1, +day);
};

export const validateMinMaxDates = ({
  inputDate,
  comparisonDate,
  isMinDate,
}: ValidateMinMaxDatesParams): string => {
  const date1 = parseStringIntoDate(inputDate);
  const date2 = parseStringIntoDate(comparisonDate);
  if (
    isMinDate
      ? date1.getTime() > date2.getTime()
      : date1.getTime() < date2.getTime()
  ) {
    return isMinDate
      ? "Minimum Date must be less than or equal to Maximum Date"
      : "Maximum Date must be greater than or equal to Minimum Date";
  }
  return "";
};

export const compareMinMaxDates = ({
  field,
  input,
  properties,
}: CompareMinMaxDatesParams) => {
  if (
    field === ComponentProperty.MinDate &&
    properties?.maxDate?.length === 10
  ) {
    return validateMinMaxDates({
      inputDate: input,
      comparisonDate: properties.maxDate,
      isMinDate: true,
    });
  }

  if (
    field === ComponentProperty.MaxDate &&
    properties?.minDate?.length === 10
  ) {
    return validateMinMaxDates({
      inputDate: input,
      comparisonDate: properties.minDate,
      isMinDate: false,
    });
  }
  return "";
};
