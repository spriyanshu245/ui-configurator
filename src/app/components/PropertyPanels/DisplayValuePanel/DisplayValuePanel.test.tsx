import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  PropertyPaneContextType,
  usePropertyPane,
} from "../../../context/PropertiesContext";
import { ComponentProperty } from "../../../data/componentProperties";
import { PropertyPanels } from "../../../utils/constants";
import DisplayValuePanel from "./DisplayValuePanel";

// Mock dependencies
jest.mock("@/app/context/PropertiesContext");
jest.mock("../../JsonTextArea/JsonTextArea", () => {
  return function MockJsonTextarea({
    value,
    onChange,
    onValidJson,
    ...props
  }: any) {
    return (
      <textarea
        {...props}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={() => {
          try {
            const parsed = JSON.parse(value);
            onValidJson?.(parsed);
          } catch (e) {
            console.error("Invalid JSON in MockJsonTextarea:", e);
          }
        }}
      />
    );
  };
});

jest.mock("../../PropertyInputs/PropertyInput", () => {
  return function MockPropertyInput({
    value,
    handleChange,
    type,
    ...props
  }: any) {
    if (type === "checkbox") {
      return (
        <input
          {...props}
          type="checkbox"
          checked={value}
          onChange={handleChange}
          data-testid={props.id}
        />
      );
    }
    return (
      <input
        {...props}
        type={type}
        value={value}
        onChange={handleChange}
        data-testid={props.id}
      />
    );
  };
});

jest.mock("@/app/components/SVGIcons/ChevronDown", () => {
  return function MockChevronDownIcon() {
    return <span data-testid="chevron-down">▼</span>;
  };
});

const mockUsePropertyPane = usePropertyPane as jest.MockedFunction<
  typeof usePropertyPane
>;

describe("DisplayValuePanel", () => {
  const defaultProps = {
    propertyKeys: [
      ComponentProperty.FetchDisplayValueFromApi,
      ComponentProperty.FetchDisplayValueApiUrl,
      ComponentProperty.FetchDisplayValueApiKey,
      ComponentProperty.FetchDisplayValueApiHeaders,
    ],
    propertyComponent: {
      id: "test-component",
      type: "typograph",
      properties: {
        fetchDisplayValueFromApi: true,
        fetchDisplayValueApiUrl: "",
        fetchDisplayValueApiKey: "",
        fetchDisplayValueApiHeaders: "",
      },
    },
    setProperty: jest.fn(),
  };

  const mockTogglePanel = jest.fn();
  const mockIsPanelOpen = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePropertyPane.mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: mockIsPanelOpen,
    } as Partial<PropertyPaneContextType> as PropertyPaneContextType);
  });

  describe("Panel Toggle Button", () => {
    it("renders the toggle button with correct attributes", () => {
      mockIsPanelOpen.mockReturnValue(false);
      render(<DisplayValuePanel {...defaultProps} />);

      const toggleButton = screen.getByTestId("displayValueToggleButton");
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveAttribute("id", "displayValueToggleButton");
      expect(screen.getByText("Display Value")).toBeInTheDocument();
      expect(screen.getByTestId("chevron-down")).toBeInTheDocument();
    });

    it("applies open class when panel is open", () => {
      mockIsPanelOpen.mockReturnValue(true);
      render(<DisplayValuePanel {...defaultProps} />);

      const toggleButton = screen.getByTestId("displayValueToggleButton");
      expect(toggleButton.className).toContain("isOpen");
    });

    it("does not apply open class when panel is closed", () => {
      mockIsPanelOpen.mockReturnValue(false);
      render(<DisplayValuePanel {...defaultProps} />);

      const toggleButton = screen.getByTestId("displayValueToggleButton");
      expect(toggleButton.className).not.toContain("isOpen");
    });

    it("calls togglePanel when clicked", () => {
      mockIsPanelOpen.mockReturnValue(false);
      render(<DisplayValuePanel {...defaultProps} />);

      const toggleButton = screen.getByTestId("displayValueToggleButton");
      fireEvent.click(toggleButton);

      expect(mockTogglePanel).toHaveBeenCalledWith(
        PropertyPanels.DisplayValuePanel
      );
    });

    it("handles togglePanel being undefined", () => {
      mockUsePropertyPane.mockReturnValue({
        togglePanel: undefined,
        isPanelOpen: mockIsPanelOpen,
      } as Partial<PropertyPaneContextType> as PropertyPaneContextType);
      mockIsPanelOpen.mockReturnValue(false);

      render(<DisplayValuePanel {...defaultProps} />);

      const toggleButton = screen.getByTestId("displayValueToggleButton");
      expect(() => fireEvent.click(toggleButton)).not.toThrow();
    });
  });

  describe("FetchDisplayValueFromApi Checkbox", () => {
    beforeEach(() => {
      mockIsPanelOpen.mockReturnValue(true);
    });

    it("renders the checkbox when FetchDisplayValueFromApi is in propertyKeys", () => {
      render(<DisplayValuePanel {...defaultProps} />);

      const checkbox = screen.getByTestId("fetchDisplayValueFromApi");
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute("type", "checkbox");
    });

    it("displays checked state when fetchDisplayValueFromApi is true", () => {
      render(<DisplayValuePanel {...defaultProps} />);

      const checkbox = screen.getByTestId(
        "fetchDisplayValueFromApi"
      ) as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it("displays unchecked state when fetchDisplayValueFromApi is false", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            fetchDisplayValueFromApi: false,
          },
        },
      };

      render(<DisplayValuePanel {...props} />);

      const checkbox = screen.getByTestId(
        "fetchDisplayValueFromApi"
      ) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it("displays unchecked state when fetchDisplayValueFromApi is undefined", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            fetchDisplayValueFromApi: undefined,
          },
        },
      };

      render(<DisplayValuePanel {...props} />);

      const checkbox = screen.getByTestId(
        "fetchDisplayValueFromApi"
      ) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it("calls setProperty with true when checkbox is checked", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            fetchDisplayValueFromApi: false,
          },
        },
      };

      render(<DisplayValuePanel {...props} />);

      const checkbox = screen.getByTestId("fetchDisplayValueFromApi");
      fireEvent.click(checkbox);

      expect(props.setProperty).toHaveBeenCalledWith(
        ComponentProperty.FetchDisplayValueFromApi,
        true
      );
    });

    it("calls setProperty with false when checkbox is unchecked", () => {
      render(<DisplayValuePanel {...defaultProps} />);

      const checkbox = screen.getByTestId("fetchDisplayValueFromApi");
      fireEvent.click(checkbox);

      expect(defaultProps.setProperty).toHaveBeenCalledWith(
        ComponentProperty.FetchDisplayValueFromApi,
        false
      );
    });

    it("does not render checkbox when not in propertyKeys", () => {
      const props = {
        ...defaultProps,
        propertyKeys: [
          ComponentProperty.FetchDisplayValueApiUrl,
          ComponentProperty.FetchDisplayValueApiKey,
        ],
      };

      render(<DisplayValuePanel {...props} />);

      expect(
        screen.queryByTestId("fetchDisplayValueFromApi")
      ).not.toBeInTheDocument();
    });
  });

  describe("Panel Content Rendering", () => {
    it("renders properties when panel is open", () => {
      mockIsPanelOpen.mockReturnValue(true);
      render(<DisplayValuePanel {...defaultProps} />);

      expect(screen.getByTestId("fetchDisplayValueApiUrl")).toBeInTheDocument();
      expect(screen.getByTestId("fetchDisplayValueApiKey")).toBeInTheDocument();
      expect(
        screen.getByTestId("fetchDisplayValueApiHeaders")
      ).toBeInTheDocument();
    });

    it("does not render properties when panel is closed", () => {
      mockIsPanelOpen.mockReturnValue(false);
      render(<DisplayValuePanel {...defaultProps} />);

      expect(
        screen.queryByTestId("fetchDisplayValueApiUrl")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("fetchDisplayValueApiKey")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("fetchDisplayValueApiHeaders")
      ).not.toBeInTheDocument();
    });

    it("handles isPanelOpen being undefined", () => {
      mockUsePropertyPane.mockReturnValue({
        togglePanel: mockTogglePanel,
        isPanelOpen: undefined,
      } as Partial<PropertyPaneContextType> as PropertyPaneContextType);

      render(<DisplayValuePanel {...defaultProps} />);
      // Should not render properties when isPanelOpen is undefined
      expect(
        screen.queryByTestId("fetchDisplayValueApiUrl")
      ).not.toBeInTheDocument();
    });
  });

  describe("FetchDisplayValueApiUrl Property", () => {
    beforeEach(() => {
      mockIsPanelOpen.mockReturnValue(true);
    });

    it("renders API URL input when type is typograph and fetchDisplayValueFromApi is true", () => {
      render(<DisplayValuePanel {...defaultProps} />);

      const input = screen.getByTestId("fetchDisplayValueApiUrl");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("placeholder", "Enter API URL here");
    });

    it("does not render API URL input when conditions are not met", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          type: "button",
          properties: {
            ...defaultProps.propertyComponent.properties,
            fetchDisplayValueFromApi: false,
            disabled: false,
            columnInputType: "text",
          },
        },
      };

      render(<DisplayValuePanel {...props} />);
      expect(
        screen.queryByTestId("fetchDisplayValueApiUrl")
      ).not.toBeInTheDocument();
    });

    it("displays current API URL value", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            fetchDisplayValueApiUrl: "https://api.example.com",
          },
        },
      };

      render(<DisplayValuePanel {...props} />);
      const input = screen.getByTestId(
        "fetchDisplayValueApiUrl"
      ) as HTMLInputElement;
      expect(input.value).toBe("https://api.example.com");
    });

    it("handles empty API URL value", () => {
      render(<DisplayValuePanel {...defaultProps} />);
      const input = screen.getByTestId(
        "fetchDisplayValueApiUrl"
      ) as HTMLInputElement;
      expect(input.value).toBe("");
    });

    it("calls setProperty when API URL changes", () => {
      render(<DisplayValuePanel {...defaultProps} />);

      const input = screen.getByTestId("fetchDisplayValueApiUrl");
      fireEvent.change(input, { target: { value: "https://new-api.com" } });

      expect(defaultProps.setProperty).toHaveBeenCalledWith(
        ComponentProperty.FetchDisplayValueApiUrl,
        "https://new-api.com"
      );
    });
  });

  describe("Display Value Fields Rendering Based on shouldShowDisplayValueFields", () => {
    beforeEach(() => {
      mockIsPanelOpen.mockReturnValue(true);
    });

    // Test cases for when fields SHOULD be rendered (condition is true)
    describe("when shouldShowDisplayValueFields returns true", () => {
      it("renders all API fields when type is input and disabled is true", () => {
        const props = {
          ...defaultProps,
          propertyComponent: {
            ...defaultProps.propertyComponent,
            type: "input",
            properties: {
              ...defaultProps.propertyComponent.properties,
              disabled: true,
              fetchDisplayValueFromApi: false,
            },
          },
        };

        render(<DisplayValuePanel {...props} />);

        expect(
          screen.getByTestId("fetchDisplayValueApiUrl")
        ).toBeInTheDocument();
        expect(
          screen.getByTestId("fetchDisplayValueApiKey")
        ).toBeInTheDocument();
        expect(
          screen.getByTestId("fetchDisplayValueApiHeaders")
        ).toBeInTheDocument();
      });

      it("renders all API fields when type is typograph and fetchDisplayValueFromApi is true", () => {
        render(<DisplayValuePanel {...defaultProps} />);

        expect(
          screen.getByTestId("fetchDisplayValueApiUrl")
        ).toBeInTheDocument();
        expect(
          screen.getByTestId("fetchDisplayValueApiKey")
        ).toBeInTheDocument();
        expect(
          screen.getByTestId("fetchDisplayValueApiHeaders")
        ).toBeInTheDocument();
      });

      it("renders all API fields when columnInputType is fetchDisplayValueFromApi", () => {
        const props = {
          ...defaultProps,
          propertyComponent: {
            ...defaultProps.propertyComponent,
            properties: {
              ...defaultProps.propertyComponent.properties,
              columnInputType: "fetchDisplayValueFromApi",
              fetchDisplayValueFromApi: false,
            },
          },
        };

        render(<DisplayValuePanel {...props} />);

        expect(
          screen.getByTestId("fetchDisplayValueApiUrl")
        ).toBeInTheDocument();
        expect(
          screen.getByTestId("fetchDisplayValueApiKey")
        ).toBeInTheDocument();
        expect(
          screen.getByTestId("fetchDisplayValueApiHeaders")
        ).toBeInTheDocument();
      });
    });

    // Test cases for when fields should NOT be rendered (condition is false)
    describe("when shouldShowDisplayValueFields returns false", () => {
      it("does not render any fields when no conditions are met", () => {
        const props = {
          ...defaultProps,
          propertyComponent: {
            ...defaultProps.propertyComponent,
            type: "button",
            properties: {
              ...defaultProps.propertyComponent.properties,
              fetchDisplayValueFromApi: false,
              columnInputType: "text",
              disabled: false,
            },
          },
        };

        render(<DisplayValuePanel {...props} />);
        expect(
          screen.queryByTestId("fetchDisplayValueApiUrl")
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId("fetchDisplayValueApiKey")
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId("fetchDisplayValueApiHeaders")
        ).not.toBeInTheDocument();
      });

      it("does not render fields when type is typograph but fetchDisplayValueFromApi is false and no other conditions met", () => {
        const props = {
          ...defaultProps,
          propertyComponent: {
            ...defaultProps.propertyComponent,
            type: "typograph",
            properties: {
              ...defaultProps.propertyComponent.properties,
              fetchDisplayValueFromApi: false,
              columnInputType: "text",
              disabled: false,
            },
          },
        };

        render(<DisplayValuePanel {...props} />);

        expect(
          screen.queryByTestId("fetchDisplayValueApiUrl")
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId("fetchDisplayValueApiKey")
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId("fetchDisplayValueApiHeaders")
        ).not.toBeInTheDocument();
      });

      it("does not render fields when type is select and no other conditions are met", () => {
        const props = {
          ...defaultProps,
          propertyComponent: {
            ...defaultProps.propertyComponent,
            type: "select",
            properties: {
              ...defaultProps.propertyComponent.properties,
              fetchDisplayValueFromApi: false,
              columnInputType: "dropdown",
              disabled: false,
            },
          },
        };

        render(<DisplayValuePanel {...props} />);
        expect(
          screen.queryByTestId("fetchDisplayValueApiUrl")
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId("fetchDisplayValueApiKey")
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId("fetchDisplayValueApiHeaders")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("FetchDisplayValueApiKey Property", () => {
    beforeEach(() => {
      mockIsPanelOpen.mockReturnValue(true);
    });

    it("renders API Key input when type is typograph and fetchDisplayValueFromApi is true", () => {
      render(<DisplayValuePanel {...defaultProps} />);

      const input = screen.getByTestId("fetchDisplayValueApiKey");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("placeholder", "Enter API Key here");
    });

    it("does not render API Key input when conditions are not met", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          type: "select",
          properties: {
            ...defaultProps.propertyComponent.properties,
            fetchDisplayValueFromApi: false,
            disabled: false,
            columnInputType: "dropdown",
          },
        },
      };

      render(<DisplayValuePanel {...props} />);
      expect(
        screen.queryByTestId("fetchDisplayValueApiKey")
      ).not.toBeInTheDocument();
    });

    it("displays current API Key value", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            fetchDisplayValueApiKey: "secret-key-123",
          },
        },
      };

      render(<DisplayValuePanel {...props} />);
      const input = screen.getByTestId(
        "fetchDisplayValueApiKey"
      ) as HTMLInputElement;
      expect(input.value).toBe("secret-key-123");
    });

    it("handles null API Key value", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            fetchDisplayValueApiKey: null,
          },
        },
      };

      render(<DisplayValuePanel {...props} />);
      const input = screen.getByTestId(
        "fetchDisplayValueApiKey"
      ) as HTMLInputElement;
      expect(input.value).toBe("");
    });

    it("calls setProperty when API Key changes", () => {
      render(<DisplayValuePanel {...defaultProps} />);

      const input = screen.getByTestId("fetchDisplayValueApiKey");
      fireEvent.change(input, { target: { value: "new-api-key" } });

      expect(defaultProps.setProperty).toHaveBeenCalledWith(
        ComponentProperty.FetchDisplayValueApiKey,
        "new-api-key"
      );
    });
  });

  describe("FetchDisplayValueApiHeaders Property", () => {
    beforeEach(() => {
      mockIsPanelOpen.mockReturnValue(true);
    });

    it("renders Headers JsonTextarea when type is typograph and fetchDisplayValueFromApi is true", () => {
      render(<DisplayValuePanel {...defaultProps} />);

      expect(screen.getByText("Headers")).toBeInTheDocument();
      expect(
        screen.getByTestId("fetchDisplayValueApiHeaders")
      ).toBeInTheDocument();
    });

    it("does not render Headers when conditions are not met", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          type: "textarea",
          properties: {
            ...defaultProps.propertyComponent.properties,
            fetchDisplayValueFromApi: false,
            disabled: false,
            columnInputType: "text",
          },
        },
      };

      render(<DisplayValuePanel {...props} />);
      expect(screen.queryByText("Headers")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("fetchDisplayValueApiHeaders")
      ).not.toBeInTheDocument();
    });

    it("displays current headers value", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            fetchDisplayValueApiHeaders: '{"Authorization": "Bearer token"}',
          },
        },
      };

      render(<DisplayValuePanel {...props} />);
      const textarea = screen.getByTestId(
        "fetchDisplayValueApiHeaders"
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe('{"Authorization": "Bearer token"}');
    });

    it("handles null headers value", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            fetchDisplayValueApiHeaders: null,
          },
        },
      };

      render(<DisplayValuePanel {...props} />);
      const textarea = screen.getByTestId(
        "fetchDisplayValueApiHeaders"
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe("");
    });

    it("calls setProperty when headers change", () => {
      render(<DisplayValuePanel {...defaultProps} />);

      const textarea = screen.getByTestId("fetchDisplayValueApiHeaders");
      fireEvent.change(textarea, {
        target: { value: '{"Content-Type": "application/json"}' },
      });

      expect(defaultProps.setProperty).toHaveBeenCalledWith(
        ComponentProperty.FetchDisplayValueApiHeaders,
        '{"Content-Type": "application/json"}'
      );
    });

    it("calls setProperty with stringified object on valid JSON", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            fetchDisplayValueApiHeaders: '{"test": "value"}',
          },
        },
      };

      render(<DisplayValuePanel {...props} />);

      const textarea = screen.getByTestId("fetchDisplayValueApiHeaders");
      fireEvent.blur(textarea);

      expect(defaultProps.setProperty).toHaveBeenCalledWith(
        ComponentProperty.FetchDisplayValueApiHeaders,
        '{"test":"value"}'
      );
    });
  });

  describe("Default Case and Edge Cases", () => {
    it("renders nothing for unknown property keys", () => {
      const props = {
        ...defaultProps,
        propertyKeys: ["unknownProperty" as ComponentProperty],
      };

      mockIsPanelOpen.mockReturnValue(true);
      render(<DisplayValuePanel {...props} />);

      // Should only render the toggle button, no properties
      expect(
        screen.getByTestId("displayValueToggleButton")
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("fetchDisplayValueApiUrl")
      ).not.toBeInTheDocument();
    });

    it("generates correct keys for property divs", () => {
      mockIsPanelOpen.mockReturnValue(true);
      render(<DisplayValuePanel {...defaultProps} />);

      // Check that each property is wrapped in a div with the correct key structure
      // We can't directly test the key, but we can ensure all properties render
      expect(screen.getByTestId("fetchDisplayValueApiUrl")).toBeInTheDocument();
      expect(screen.getByTestId("fetchDisplayValueApiKey")).toBeInTheDocument();
      expect(
        screen.getByTestId("fetchDisplayValueApiHeaders")
      ).toBeInTheDocument();
    });

    it("handles empty propertyKeys array", () => {
      const props = {
        ...defaultProps,
        propertyKeys: [],
      };

      mockIsPanelOpen.mockReturnValue(true);
      render(<DisplayValuePanel {...props} />);

      // Should render toggle button but no properties
      expect(
        screen.getByTestId("displayValueToggleButton")
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("fetchDisplayValueApiUrl")
      ).not.toBeInTheDocument();
    });
  });
});
