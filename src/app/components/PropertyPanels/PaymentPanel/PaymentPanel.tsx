import { usePropertyPane } from "@/app/context/PropertiesContext";
import { ComponentProperty } from "@/app/data/componentProperties";
import { PropertyPanels } from "@/app/utils/constants";
import React from "react";
import ChevronDownIcon from "../../SVGIcons/ChevronDown";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import PropertyInput from "../../PropertyInputs/PropertyInput";

interface PaymentPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any) => void;
}

const PaymentPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: PaymentPanelProps) => {
  const { properties } = propertyComponent;
  const { togglePanel, isPanelOpen } = usePropertyPane();

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.OrderIdPathKey:
        return (
          <PropertyInput
            type="text"
            label="Order ID Path Key"
            placeholder="Enter the path key"
            id="orderIdPathKey"
            value={properties?.orderIdPathKey}
            handleChange={(e) =>
              setProperty(ComponentProperty.OrderIdPathKey, e.target.value)
            }
          />
        );
      case ComponentProperty.PaymentModePathKey:
        return (
          <PropertyInput
            type="text"
            label="Payment Mode Path key"
            placeholder="Enter the path key"
            id="paymentModePathKey"
            value={properties?.paymentModePathKey}
            handleChange={(e) =>
              setProperty(ComponentProperty.PaymentModePathKey, e.target.value)
            }
          />
        );
      case ComponentProperty.PollingTime:
        return (
          <PropertyInput
            id="pollingTime"
            type="number"
            value={properties.pollingTime ?? ""}
            handleChange={(e) =>
              setProperty(ComponentProperty.PollingTime, e.target.value)
            }
            label="Polling Time(s)"
            placeholder="Enter time in seconds"
          />
        );

      case ComponentProperty.QRTimer:
        return (
          <PropertyInput
            id="qrTimer"
            type="number"
            value={properties.qrTimer ?? ""}
            handleChange={(e) =>
              setProperty(ComponentProperty.QRTimer, e.target.value)
            }
            label="QR Timer(min)"
            placeholder="Enter time in minutes"
          />
        );
    }
    return null;
  };

  return (
    <div id="paymentPanel">
      <button
        id="toggleButton"
        onClick={() => togglePanel && togglePanel(PropertyPanels.PaymentPanel)}
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.PaymentPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Payment</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.PaymentPanel) && (
        <>
          {propertyKeys.map((propKey) => (
            <div key={`${propKey}-${propertyComponent.id}`}>
              {renderProperty(propKey)}
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default PaymentPanel;
