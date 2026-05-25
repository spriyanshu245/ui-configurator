import {
  formatDateInputWithPlaceHolder,
  isDayValid,
  isYearValid,
  isMonthValid,
  validateDateInput,
  formatDateInput,
  validateMinMaxDates,
  compareMinMaxDates,
} from "./date";
import { ComponentProperty } from "../data/componentProperties";
import { DATE_ERROR_MESSAGE } from "./constants";

describe("Date Utilities", () => {
  describe("formatDateInputWithPlaceHolder", () => {
    test("should format input with custom placeholder", () => {
      expect(formatDateInputWithPlaceHolder("12", "MM-DD-YYYY")).toBe(
        "12-DD-YYYY"
      );
      expect(formatDateInputWithPlaceHolder("1234", "YYYY/MM/DD")).toBe(
        "1234/MM/DD"
      );
    });

    test("should handle empty inputs", () => {
      expect(formatDateInputWithPlaceHolder("")).toBe("DD/MM/YYYY");
      expect(formatDateInputWithPlaceHolder("", "YYYY-MM-DD")).toBe(
        "YYYY-MM-DD"
      );
    });

    test("should preserve separator characters in placeholder", () => {
      expect(formatDateInputWithPlaceHolder("12", "DD.MM.YYYY")).toBe(
        "12.MM.YYYY"
      );
    });
  });

  describe("Validation Helpers", () => {
    describe("isDayValid", () => {
      test("should validate valid days", () => {
        expect(isDayValid("01")).toBe(true);
        expect(isDayValid("15")).toBe(true);
        expect(isDayValid("31")).toBe(true);
      });

      test("should invalidate days out of range", () => {
        expect(isDayValid("00")).toBe(false);
        expect(isDayValid("32")).toBe(false);
        expect(isDayValid("99")).toBe(false);
      });
    });

    describe("isYearValid", () => {
      test("should validate years within range", () => {
        expect(isYearValid("0001")).toBe(true);
        expect(isYearValid("2000")).toBe(true);
        expect(isYearValid("9999")).toBe(true);
      });

      test("should invalidate years out of range", () => {
        expect(isYearValid("0000")).toBe(false);
        expect(isYearValid("10000")).toBe(false);
      });
    });

    describe("isMonthValid", () => {
      test("should validate valid months with no day", () => {
        expect(isMonthValid("01", "")).toBe(true);
        expect(isMonthValid("12", "")).toBe(true);
      });

      test("should validate valid months with valid days", () => {
        expect(isMonthValid("01", "31")).toBe(true);
        expect(isMonthValid("02", "29")).toBe(true);
        expect(isMonthValid("04", "30")).toBe(true);
      });

      test("should invalidate months out of range", () => {
        expect(isMonthValid("00", "15")).toBe(false);
        expect(isMonthValid("13", "15")).toBe(false);
      });

      test("should invalidate valid months with invalid days", () => {
        expect(isMonthValid("04", "31")).toBe(false);
        expect(isMonthValid("06", "31")).toBe(false);
      });

      test("should handle partial day inputs correctly", () => {
        expect(isMonthValid("02", "2")).toBe(true);
      });
    });
  });

  describe("DD/MM/YYYY format", () => {
    test("should validate complete valid dates", () => {
      expect(
        validateDateInput({
          input: "01012000",
          error: "",
          format: "DD/MM/YYYY",
          separator: "/",
        })
      ).toBe("");
      expect(
        validateDateInput({
          input: "31122000",
          error: "",
          format: "DD/MM/YYYY",
          separator: "/",
        })
      ).toBe("");

      expect(
        validateDateInput({
          input: "31",
          error: "",
          format: "DD/MM/YYYY",
          separator: "/",
        })
      ).toBe("");

      expect(
        validateDateInput({
          input: "29022000",
          error: "",
        })
      ).toBe("");

      expect(
        validateDateInput({
          input: "29022000",
          error: "",
          format: "",
          separator: "",
        })
      ).toBe("");
    });

    test("should invalidate invalid dates", () => {
      expect(
        validateDateInput({
          input: "32012000",
          error: "",
          format: "DD/MM/YYYY",
          separator: "/",
        })
      ).toBe(DATE_ERROR_MESSAGE);

      expect(
        validateDateInput({
          input: "31042000",
          error: "",
          format: "DD/MM/YYYY",
          separator: "/",
        })
      ).toBe(DATE_ERROR_MESSAGE);

      expect(
        validateDateInput({
          input: "29022001",
          error: "",
          format: "DD/MM/YYYY",
          separator: "/",
        })
      ).toBe(DATE_ERROR_MESSAGE);
    });

    test("should validate dates as they're being typed", () => {
      expect(
        validateDateInput({
          input: "3",
          error: "",
          format: "DD/MM/YYYY",
          separator: "/",
        })
      ).toBe("");

      expect(
        validateDateInput({
          input: "32",
          error: "",
          format: "DD/MM/YYYY",
          separator: "/",
        })
      ).toBe(DATE_ERROR_MESSAGE);

      expect(
        validateDateInput({
          input: "3101",
          error: "",
          format: "DD/MM/YYYY",
          separator: "/",
        })
      ).toBe("");

      expect(
        validateDateInput({
          input: "3113",
          error: "",
          format: "DD/MM/YYYY",
          separator: "/",
        })
      ).toBe(DATE_ERROR_MESSAGE);

      expect(
        validateDateInput({
          input: "310120",
          error: "",
          format: "DD/MM/YYYY",
          separator: "/",
        })
      ).toBe("");
    });

    test("should handle formatted inputs with separators", () => {
      expect(
        validateDateInput({
          input: "31/01/2000",
          error: "",
          format: "DD/MM/YYYY",
          separator: "/",
        })
      ).toBe("");

      expect(
        validateDateInput({
          input: "29/02/2001",
          error: "",
          format: "DD/MM/YYYY",
          separator: "/",
        })
      ).toBe(DATE_ERROR_MESSAGE);
    });
  });

  describe("MM/DD/YYYY format", () => {
    test("should validate complete valid dates", () => {
      expect(
        validateDateInput({
          input: "01312000",
          error: "",
          format: "MM/DD/YYYY",
          separator: "/",
        })
      ).toBe("");

      expect(
        validateDateInput({
          input: "12312000",
          error: "",
          format: "MM/DD/YYYY",
          separator: "/",
        })
      ).toBe("");

      expect(
        validateDateInput({
          input: "02292000",
          error: "",
          format: "MM/DD/YYYY",
          separator: "/",
        })
      ).toBe("");

      expect(
        validateDateInput({
          input: "022",
          error: "",
          format: "MM/DD/YYYY",
          separator: "/",
        })
      ).toBe("");
    });

    test("should invalidate invalid dates", () => {
      expect(
        validateDateInput({
          input: "00312000",
          error: "",
          format: "MM/DD/YYYY",
          separator: "/",
        })
      ).toBe(DATE_ERROR_MESSAGE);

      expect(
        validateDateInput({
          input: "04312000",
          error: "",
          format: "MM/DD/YYYY",
          separator: "/",
        })
      ).toBe(DATE_ERROR_MESSAGE);

      expect(
        validateDateInput({
          input: "02292001",
          error: "",
          format: "MM/DD/YYYY",
          separator: "/",
        })
      ).toBe(DATE_ERROR_MESSAGE);
    });

    test("should validate dates as they're being typed", () => {
      expect(
        validateDateInput({
          input: "1",
          error: "",
          format: "MM/DD/YYYY",
          separator: "/",
        })
      ).toBe("");

      expect(
        validateDateInput({
          input: "13",
          error: "",
          format: "MM/DD/YYYY",
          separator: "/",
        })
      ).toBe(DATE_ERROR_MESSAGE);

      expect(
        validateDateInput({
          input: "0131",
          error: "",
          format: "MM/DD/YYYY",
          separator: "/",
        })
      ).toBe("");

      expect(
        validateDateInput({
          input: "0132",
          error: "",
          format: "MM/DD/YYYY",
          separator: "/",
        })
      ).toBe(DATE_ERROR_MESSAGE);
    });

    test("should handle formatted inputs with separators", () => {
      expect(
        validateDateInput({
          input: "01/31/2000",
          error: "",
          format: "MM/DD/YYYY",
          separator: "/",
        })
      ).toBe("");

      expect(
        validateDateInput({
          input: "02/29/2001",
          error: "",
          format: "MM/DD/YYYY",
          separator: "/",
        })
      ).toBe(DATE_ERROR_MESSAGE);
    });
  });

  describe("YYYY/MM/DD format", () => {
    test("should validate complete valid dates", () => {
      expect(
        validateDateInput({
          input: "20000131",
          error: "",
          format: "YYYY/MM/DD",
          separator: "/",
        })
      ).toBe("");

      expect(
        validateDateInput({
          input: "20001231",
          error: "",
          format: "YYYY/MM/DD",
          separator: "/",
        })
      ).toBe("");

      expect(
        validateDateInput({
          input: "20000229",
          error: "",
          format: "YYYY/MM/DD",
          separator: "/",
        })
      ).toBe("");
    });

    test("should invalidate invalid dates", () => {
      expect(
        validateDateInput({
          input: "20000001",
          error: "",
          format: "YYYY/MM/DD",
          separator: "/",
        })
      ).toBe(DATE_ERROR_MESSAGE);

      expect(
        validateDateInput({
          input: "20000431",
          error: "",
          format: "YYYY/MM/DD",
          separator: "/",
        })
      ).toBe(DATE_ERROR_MESSAGE);

      expect(
        validateDateInput({
          input: "20010229",
          error: "",
          format: "YYYY/MM/DD",
          separator: "/",
        })
      ).toBe(DATE_ERROR_MESSAGE);
    });

    test("should validate dates as they're being typed", () => {
      expect(
        validateDateInput({
          input: "2000",
          error: "",
          format: "YYYY/MM/DD",
          separator: "/",
        })
      ).toBe("");

      expect(
        validateDateInput({
          input: "0000",
          error: "",
          format: "YYYY/MM/DD",
          separator: "/",
        })
      ).toBe(DATE_ERROR_MESSAGE);

      expect(
        validateDateInput({
          input: "200001",
          error: "",
          format: "YYYY/MM/DD",
          separator: "/",
        })
      ).toBe("");

      expect(
        validateDateInput({
          input: "200013",
          error: "",
          format: "YYYY/MM/DD",
          separator: "/",
        })
      ).toBe(DATE_ERROR_MESSAGE);
    });

    test("should handle formatted inputs with separators", () => {
      expect(
        validateDateInput({
          input: "2000/01/31",
          error: "",
          format: "YYYY/MM/DD",
          separator: "/",
        })
      ).toBe("");

      expect(
        validateDateInput({
          input: "2001/02/29",
          error: "",
          format: "YYYY/MM/DD",
          separator: "/",
        })
      ).toBe(DATE_ERROR_MESSAGE);
    });

    test("should handle unknown formats gracefully", () => {
      expect(
        validateDateInput({
          input: "01012000",
          error: "test error",
          format: "UNKNOWN",
          separator: "/",
        })
      ).toBe("test error");

      expect(
        validateDateInput({
          input: "202",
          format: "YYYY/MM/DD",
          separator: "/",
          error: "",
        })
      ).toBe("");
    });
  });
  describe("formatDateInput", () => {
    describe("DD/MM/YYYY and MM/DD/YYYY format", () => {
      test("should format inputs correctly for DD/MM/YYYY", () => {
        expect(
          formatDateInput({ input: "1", format: "DD/MM/YYYY", separator: "/" })
        ).toBe("1");
        expect(
          formatDateInput({ input: "12", format: "DD/MM/YYYY", separator: "/" })
        ).toBe("12/");
        expect(
          formatDateInput({
            input: "123",
            format: "DD/MM/YYYY",
            separator: "/",
          })
        ).toBe("12/3");
        expect(
          formatDateInput({
            input: "1234",
            format: "DD/MM/YYYY",
            separator: "/",
          })
        ).toBe("12/34/");
        expect(
          formatDateInput({
            input: "12345",
            format: "DD/MM/YYYY",
            separator: "/",
          })
        ).toBe("12/34/5");
        expect(
          formatDateInput({
            input: "12345678",
          })
        ).toBe("12/34/5678");
      });

      test("should format inputs correctly for MM/DD/YYYY", () => {
        expect(
          formatDateInput({ input: "1", format: "MM/DD/YYYY", separator: "/" })
        ).toBe("1");
        expect(
          formatDateInput({ input: "12", format: "MM/DD/YYYY", separator: "/" })
        ).toBe("12/");
        expect(
          formatDateInput({
            input: "123",
            format: "MM/DD/YYYY",
            separator: "/",
          })
        ).toBe("12/3");
        expect(
          formatDateInput({
            input: "1234",
            format: "MM/DD/YYYY",
            separator: "/",
          })
        ).toBe("12/34/");
        expect(
          formatDateInput({
            input: "12345",
            format: "MM/DD/YYYY",
            separator: "/",
          })
        ).toBe("12/34/5");
        expect(
          formatDateInput({
            input: "12345678",
            format: "MM/DD/YYYY",
            separator: "/",
          })
        ).toBe("12/34/5678");
      });

      test("should handle auto-prefixing zero for single digit inputs when separator is already present", () => {
        expect(
          formatDateInput({ input: "1/", format: "DD/MM/YYYY", separator: "/" })
        ).toBe("01/");
        expect(
          formatDateInput({
            input: "12/3/",
            format: "DD/MM/YYYY",
            separator: "/",
          })
        ).toBe("12/03/");
      });

      test("should ignore non-digit characters in input", () => {
        expect(
          formatDateInput({
            input: "1a2/3b4/",
            format: "DD/MM/YYYY",
            separator: "/",
          })
        ).toBe("12/34/");
      });
    });

    describe("YYYY/MM/DD format", () => {
      test("should format inputs correctly", () => {
        expect(
          formatDateInput({ input: "1", format: "YYYY/MM/DD", separator: "/" })
        ).toBe("1");
        expect(
          formatDateInput({
            input: "1234",
            format: "YYYY/MM/DD",
            separator: "/",
          })
        ).toBe("1234/");
        expect(
          formatDateInput({
            input: "12345",
            format: "YYYY/MM/DD",
            separator: "/",
          })
        ).toBe("1234/5");
        expect(
          formatDateInput({
            input: "123456",
            format: "YYYY/MM/DD",
            separator: "/",
          })
        ).toBe("1234/56/");
        expect(
          formatDateInput({
            input: "12345678",
            format: "YYYY/MM/DD",
            separator: "/",
          })
        ).toBe("1234/56/78");
      });

      test("should handle auto-prefixing zero for single digit inputs when separator is already present", () => {
        expect(
          formatDateInput({
            input: "1234/5/",
            format: "YYYY/MM/DD",
            separator: "/",
          })
        ).toBe("1234/05/");
      });

      test("should handle unknown formats gracefully", () => {
        expect(
          formatDateInput({
            input: "12345678",
            format: "UNKNOWN",
            separator: "/",
          })
        ).toBe("");
      });
    });

    describe("validateMinMaxDates", () => {
      test("should validate when min date is less than max date", () => {
        expect(
          validateMinMaxDates({
            inputDate: "01/01/2000",
            comparisonDate: "02/01/2000",
            isMinDate: true,
          })
        ).toBe("");
      });

      test("should validate when min date equals max date", () => {
        expect(
          validateMinMaxDates({
            inputDate: "01/01/2000",
            comparisonDate: "01/01/2000",
            isMinDate: true,
          })
        ).toBe("");
      });

      test("should invalidate when min date is greater than max date", () => {
        expect(
          validateMinMaxDates({
            inputDate: "02/01/2000",
            comparisonDate: "01/01/2000",
            isMinDate: true,
          })
        ).toBe("Minimum Date must be less than or equal to Maximum Date");
      });

      test("should validate when max date is greater than min date", () => {
        expect(
          validateMinMaxDates({
            inputDate: "02/01/2000",
            comparisonDate: "01/01/2000",
            isMinDate: false,
          })
        ).toBe("");
      });

      test("should validate when max date equals min date", () => {
        expect(
          validateMinMaxDates({
            inputDate: "01/01/2000",
            comparisonDate: "01/01/2000",
            isMinDate: false,
          })
        ).toBe("");
      });

      test("should invalidate when max date is less than min date", () => {
        expect(
          validateMinMaxDates({
            inputDate: "01/01/2000",
            comparisonDate: "02/01/2000",
            isMinDate: false,
          })
        ).toBe("Maximum Date must be greater than or equal to Minimum Date");
      });
    });

    describe("compareMinMaxDates", () => {
      test("should validate minDate when maxDate is set", () => {
        expect(
          compareMinMaxDates({
            field: ComponentProperty.MinDate,
            input: "01/01/2000",
            properties: { maxDate: "02/01/2000" },
          })
        ).toBe("");

        expect(
          compareMinMaxDates({
            field: ComponentProperty.MinDate,
            input: "03/01/2000",
            properties: { maxDate: "02/01/2000" },
          })
        ).toBe("Minimum Date must be less than or equal to Maximum Date");
      });

      test("should validate maxDate when minDate is set", () => {
        expect(
          compareMinMaxDates({
            field: ComponentProperty.MaxDate,
            input: "02/01/2000",
            properties: { minDate: "01/01/2000" },
          })
        ).toBe("");

        expect(
          compareMinMaxDates({
            field: ComponentProperty.MaxDate,
            input: "01/01/1999",
            properties: { minDate: "01/01/2000" },
          })
        ).toBe("Maximum Date must be greater than or equal to Minimum Date");
      });

      test("should not validate when comparison date is not set", () => {
        expect(
          compareMinMaxDates({
            field: ComponentProperty.MinDate,
            input: "01/01/2000",
            properties: {},
          })
        ).toBe("");

        expect(
          compareMinMaxDates({
            field: ComponentProperty.MaxDate,
            input: "01/01/2000",
            properties: {},
          })
        ).toBe("");
      });

      test("should not validate when comparison date is incomplete", () => {
        expect(
          compareMinMaxDates({
            field: ComponentProperty.MinDate,
            input: "01/01/2000",
            properties: { maxDate: "02/01" },
          })
        ).toBe("");

        expect(
          compareMinMaxDates({
            field: ComponentProperty.MaxDate,
            input: "01/01/2000",
            properties: { minDate: "01/01" },
          })
        ).toBe("");
      });

      test("should ignore other fields", () => {
        expect(
          compareMinMaxDates({
            field: "OtherField",
            input: "01/01/2000",
            properties: { minDate: "01/01/2000", maxDate: "02/01/2000" },
          })
        ).toBe("");
      });
    });
  });
});
