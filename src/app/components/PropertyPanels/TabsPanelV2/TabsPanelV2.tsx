"use client";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { ComponentProperty } from "@/app/data/componentProperties";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import { PropertyPanels } from "@/app/utils/constants";
import ChevronDownIcon from "../../SVGIcons/ChevronDown";
import { useMemo, useState } from "react";
import { TabComponent } from "@/app/types/types";
import styles from "./TabsPanel.module.scss";
import sharedStyle from "../../ExpandableColumn/ExpandableColumn.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { generateRandomId } from "@/app/utils/utils";
import ExpandableColumn, {
  AddExpandableColumn,
} from "../../ExpandableColumn/ExpandableColumn";
import TabsRow from "./TabsRow";
import FormPane from "../../InternalComponents/Pane/FormPane/FormPane";
import Pane from "../../InternalComponents/Pane/Pane";
import SelectDropdown, {
  DropdownOption,
} from "../../InternalComponents/SelectDropdown/SelectDropdown";
import { useMicrosite } from "@/app/context/MicrositeContext";
import useDurableMicrositePageCreation from "@/app/hooks/useDurableMicrositePageCreation";

interface TabsPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any, isProperty?: boolean) => void;
}

const TabsPanelV2 = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: TabsPanelProps) => {
  const { togglePanel, isPanelOpen } = usePropertyPane();
  const { microsite } = useMicrosite();
  const { persistCreatedPage } = useDurableMicrositePageCreation();
  const tabData = propertyComponent.components || [];
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAddingExistingPage, setIsAddingExistingPage] = useState(false);
  const [pageCode, setPageCode] = useState("");
  const handleCreateSuccess = async (code: string) => {
    if (!isAddingExistingPage) {
      await persistCreatedPage(code);
    }

    const newColumn: TabComponent = {
      id: generateRandomId(),
      properties: {
        title: `Tab ${tabData.length + 1}`,
      },
      type: "tab",
      category: "component",
      pageCode: code,
    };
    const updatedData = [...tabData, newColumn];
    setProperty("components", updatedData, true);
    setIsFormOpen(false);
  };
  const pages = microsite?.pages ?? [];
  const pageOptions: DropdownOption[] = useMemo(
    () =>
      pages
        .filter((page) => !!page.pageCode)
        .map((page) => ({
          value: page.pageCode,
          label: page.pageCode,
        })),
    [pages],
  );

  const openCreatePane = () => {
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
  };

  const openExistingPagePane = () => {
    setIsAddingExistingPage(true);
  };
  const handleCancel = () => {
    setPageCode("");
    setIsAddingExistingPage(false);
  };
  const handleSubmit = () => {
    handleCreateSuccess(pageCode);
    setIsAddingExistingPage(false);
    setPageCode("");
  };

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.TabLayout:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              Tab Layout Type
            </p>
            <select
              id="fieldLayout"
              data-testid="fieldLayout"
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5} ${styles.selectCursor}`}
              value={propertyComponent?.properties?.tabLayout || "horizontal"}
              onChange={(e) =>
                setProperty(ComponentProperty.TabLayout, e.target.value)
              }
            >
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </div>
        );
      case ComponentProperty.TabLevel:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Tabs Level</p>
            <div
              className={`${sharedPropertiesStyles.optionGrid} ${sharedStyles.mt5}`}
            >
              {["L1", "L2"].map((level) => (
                <button
                  id={`Level-${level}`}
                  key={level}
                  className={`${sharedPropertiesStyles.option} ${
                    propertyComponent?.properties?.tabLevel === level
                      ? sharedPropertiesStyles.active
                      : ""
                  }`}
                  onClick={() => setProperty(ComponentProperty.TabLevel, level)}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        );
      case ComponentProperty.RowTabCount:
        return (
          <>
            {propertyComponent?.properties?.tabLayout === "horizontal" && (
              <div
                className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
              >
                <p className={sharedPropertiesStyles.propertyLabel}>
                  Row Tab Count
                </p>
                <input
                  id="tabCount"
                  className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                  type="number"
                  min={1}
                  value={propertyComponent?.properties?.rowTabCount || ""}
                  placeholder="Enter row tab count"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const value = Number(e.target.value);
                    if (value >= 0) {
                      setProperty(
                        ComponentProperty.RowTabCount,
                        e.target.value
                      );
                    }
                  }}
                />
              </div>
            )}
          </>
        );
      case ComponentProperty.TabOrderV2:
        return (
          <>
            <div
              className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
            >
              <p className={sharedPropertiesStyles.propertyLabel}>Tabs</p>
            </div>
            <div className={styles.columns}>
              <div className={sharedStyle.draggableRows}>
                {tabData.map((col: TabComponent, index: number) => (
                  <ExpandableColumn
                    id={index}
                    key={col.id}
                    colData={tabData}
                    column={col}
                    draggedItemId={draggedItemId}
                    setDraggedItemId={setDraggedItemId}
                    setProperty={setProperty}
                    property="components"
                    isTab={true}
                    label={col.properties.title}
                  >
                    <TabsRow
                      id={index}
                      setProperty={setProperty}
                      propertyComponent={propertyComponent}
                      column={col}
                    />
                  </ExpandableColumn>
                ))}
                <div className={sharedStyles.dFlex}>
                  <AddExpandableColumn
                    handleAddCol={openExistingPagePane}
                    label="existing page"
                  />
                  <AddExpandableColumn
                    handleAddCol={openCreatePane}
                    label="tab"
                  />
                </div>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const footer = (
    <div className={sharedStyles.dFlex}>
      <button
        data-testid={`cancel`}
        className={`${sharedStyles.button} ${sharedStyles.secondaryButton}`}
        onClick={handleCancel}
      >
        Cancel
      </button>
      <button
        data-testid={`save-button`}
        className={`${sharedStyles.button} ${sharedStyles.primaryButton}`}
        onClick={handleSubmit}
      >
        Save
      </button>
    </div>
  );

  return (
    <div id="tabsPanel" data-testid="tabsPanel">
      <button
        id="toggleButton"
        onClick={() => togglePanel && togglePanel(PropertyPanels.TabsPanelV2)}
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.TabsPanelV2)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Tabs</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.TabsPanelV2) && (
        <>
          {propertyKeys.map((propKey) => (
            <div key={`${propKey}-${propertyComponent.id}`}>
              {renderProperty(propKey)}
            </div>
          ))}
        </>
      )}
      {isFormOpen && (
        <FormPane
          dataType="pages"
          isOpen={isFormOpen}
          mode="create"
          dataToEdit={undefined}
          sourceDsl={null}
          onClose={handleFormClose}
          onCreated={handleCreateSuccess}
          micrositeCode={microsite.code}
        />
      )}
      {isAddingExistingPage && (
        <Pane
          isOpen={isAddingExistingPage}
          onClose={handleCancel}
          title={"Create a Tab With Existing page"}
          paneFooter={footer}
          position="center"
          width={500}
        >
          <div className={styles.existingPageContainer}>
            <div className={styles.dropdownlabel}>Select a Page</div>
            <SelectDropdown
              id={"selectPage"}
              placeholder="select a page"
              options={pageOptions}
              value={pageCode}
              onChange={setPageCode}
              showSearch={true}
            ></SelectDropdown>
          </div>
        </Pane>
      )}
    </div>
  );
};

export default TabsPanelV2;
