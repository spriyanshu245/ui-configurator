"use client";
import { usePropertyPane } from "../../context/PropertiesContext";
import { componentPropertiesMap } from "../../data/componentPropertiesMap";
import { useComponentProperties } from "../../hooks/useComponentProperties";
import React, { useState, useEffect, Fragment, RefObject } from "react";
import sharedPropertiesStyles from "../../styles/properties-pane.module.scss";
import sharedStyles from "../../styles/shared.module.scss";
import { propertyPanelsMap } from "../../data/propertiesPanelMap";
import { useUserTask } from "../../context/UserTaskContext";
import { convertHyphenSeparatedToPascalCase } from "../../utils/utils";
import { ComponentProperty } from "../../data/componentProperties";
import ChevronDownIcon from "../../components/SVGIcons/ChevronDown";
import DeleteIcon from "../../components/SVGIcons/Delete";
import { useMicrosite } from "../../context/MicrositeContext";
import { useMicrositePageProperties } from "../../hooks/useMicrositePageProperties";
import ExportIcon from "../SVGIcons/Export";
import ImportIcon from "../SVGIcons/Import";
import { useImportExport } from "../../hooks/useImportExport";
import { useHeaderV2 } from "../../context/HeaderContextV2";
import { BaseComponent, UIComponent } from "../../types/types";
import Modal from "../InternalComponents/Modal/Modal";

export default function PropertiesPaneV2() {
  const {
    isPropertyPaneVisible,
    propertyComponentId,
    resetActiveComponent,
    propertyPageCode,
    resetActivePage,
  } = usePropertyPane();

  const {
    component: propertyComponent,
    setProperty,
    setProperties,
  } = useComponentProperties(propertyComponentId ?? "");
  const {
    page,
    setProperty: setPageProperty,
    setProperties: setPageProperties,
  } = useMicrositePageProperties();

  const { removePage, isEditing } = useMicrosite();
  const { setUserNotification } = useHeaderV2();
  const { removeComponent, importComponent } = useUserTask();
  const selectedComponent = propertyComponent ?? page;
  const {
    importData,
    fileInputRef,
    handleExportDslJson,
    setImportData,
    handleImportDslJson,
  } = useImportExport({
    component: selectedComponent ?? {},
  });

  const [isAnimating, setIsAnimating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"delete" | null>(null);

  useEffect(() => {
    if (isPropertyPaneVisible) {
      setIsAnimating(true);
    }
  }, [isPropertyPaneVisible]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closePropertyPane();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!propertyComponent && !page) {
      setIsAnimating(false);
      resetActiveComponent();
      resetActivePage();
    }
  }, [propertyComponent, page]);

  const handleAnimationEnd = () => {
    if (!isAnimating) {
      resetActiveComponent();
      resetActivePage();
    }
  };

  const closePropertyPane = () => {
    setIsAnimating(false);
  };

  useEffect(() => {
    if (importData) {
      let componentType = "";
      if (
        propertyComponentId &&
        importData.type == (selectedComponent as BaseComponent).type
      ) {
        componentType = importData.type;
        importComponent({
          importData: importData as UIComponent,
          componentId: propertyComponentId,
        });
      } else if (
        page &&
        importData.code &&
        Array.isArray(importData.components)
      ) {
        componentType = "page";
        setPageProperties(
          { ...page, components: importData.components },
          false,
        );
      }
      setUserNotification({
        text: componentType
          ? `${componentType} imported successfully`
          : "Invalid file format",
        time: 3000,
        type: componentType ? "success" : "error",
      });
      setImportData(null);
    }
  }, [importData]);

  const propertiesPaneClassName = `
    ${sharedPropertiesStyles.propertiesPaneContainer}
    ${isAnimating ? sharedPropertiesStyles.open : sharedPropertiesStyles.close}
  `;

  const canDelete =
    isEditing &&
    (propertyComponent?.type !== "button" ||
      propertyComponent.properties?.actionType !== "submit");

  const handleDeleteClick = () => {
    if (propertyPageCode) {
      setModalType("delete");
      setIsModalOpen(true);
    } else if (propertyComponentId && canDelete) {
      removeComponent(propertyComponentId);
      closePropertyPane();
    }
  };

  const handleModalAction = () => {
    if (modalType === "delete" && propertyPageCode) {
      removePage(propertyPageCode);
      closePropertyPane();
      setUserNotification({
        text: "Page deleted successfully",
        time: 2000,
        type: "success",
      });
    }
    setIsModalOpen(false);
    setModalType(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalType(null);
  };

  const getRelevantProperties = () => {
    const panelSet = new Set<React.JSX.Element>();
    let relevantProps: ComponentProperty[] = [];

    if (propertyComponentId && propertyComponent) {
      const { type } = propertyComponent;
      relevantProps = componentPropertiesMap[type] || [];
    }

    if (propertyPageCode && page) {
      relevantProps = componentPropertiesMap["microsite-page"];
    }
    const panelGroups = new Map<
      React.ComponentType<any>,
      ComponentProperty[]
    >();

    relevantProps.forEach((propKey) => {
      const PanelComponent = propertyPanelsMap[propKey];

      if (!PanelComponent) return;
      if (!panelGroups.has(PanelComponent)) {
        panelGroups.set(PanelComponent, []);
      }
      panelGroups.get(PanelComponent)?.push(propKey);
    });

    panelGroups.forEach((propKeys, PanelComponent) => {
      panelSet.add(
        <Fragment key={PanelComponent.name}>
          <hr className={sharedPropertiesStyles.panelSeparator} />
          {(() => {
            let setPropertyFn;
            if (propertyComponent) {
              setPropertyFn = setProperty;
            } else {
              setPropertyFn = setPageProperty;
            }
            return (
              <PanelComponent
                key={PanelComponent.name}
                propertyKeys={propKeys}
                propertyComponent={propertyComponent || page}
                setProperty={setPropertyFn}
                setProperties={setProperties}
                data-testid="panel-section"
              />
            );
          })()}
        </Fragment>,
      );
    });

    return Array.from(panelSet);
  };

  const panelElements = getRelevantProperties();

  let headingLabel = "";
  if (propertyPageCode) {
    const pageCode = page?.code ?? "";
    headingLabel = pageCode.includes("_")
      ? pageCode.substring(pageCode.indexOf("_") + 1)
      : pageCode;
  } else if (propertyComponent?.type) {
    headingLabel = convertHyphenSeparatedToPascalCase(propertyComponent.type);
  }

  if (!isPropertyPaneVisible || (!propertyComponent && !page)) {
    return null;
  }

  return (
    <div
      className={propertiesPaneClassName}
      onTransitionEnd={handleAnimationEnd}
      id="propertiesPane"
    >
      <div className={sharedPropertiesStyles.heading}>
        <div
          className={
            propertyPageCode
              ? sharedPropertiesStyles.pageCode
              : sharedPropertiesStyles.componentType
          }
        >
          {headingLabel}
        </div>
        <div className={sharedPropertiesStyles.actions}>
          <button
            id="export"
            title="Export"
            onClick={handleExportDslJson}
            className={`${sharedStyles.iconButton} ${sharedStyles.small}`}
            data-testid="export"
          >
            <ExportIcon />
          </button>
          <button
            id="import"
            title="Import"
            disabled={!isEditing}
            onClick={() => {
              fileInputRef.current?.click();
            }}
            className={`${sharedStyles.iconButton} ${sharedStyles.small}`}
            data-testid="import"
          >
            <ImportIcon />
          </button>
          {canDelete && (
            <button
              id={propertyPageCode ? `deletePage` : `deleteComponent`}
              className={`${sharedStyles.iconButton} ${sharedStyles.small} `}
              title={propertyPageCode ? "Delete Page" : "Delete Component"}
              onClick={handleDeleteClick}
            >
              <DeleteIcon />
            </button>
          )}

          <button
            id={`closeComponent`}
            className={`${sharedStyles.iconButton} ${sharedStyles.small}`}
            title="Close Properties (esc)"
            onClick={closePropertyPane}
          >
            <ChevronDownIcon />
          </button>
          <input
            type="file"
            ref={fileInputRef as RefObject<HTMLInputElement>}
            onChange={handleImportDslJson}
            accept=".json"
            style={{ display: "none" }}
            data-testid="file-input"
          />
        </div>
      </div>
      <div className={sharedPropertiesStyles.componentProperties}>
        <div className={sharedPropertiesStyles.componentProperty}>
          <p className={sharedPropertiesStyles.propertyLabel}>ID</p>
          <p className={sharedPropertiesStyles.propertyValue}>
            {propertyComponent?.id ?? propertyPageCode}
          </p>
        </div>
        {propertyComponent && !page && (
          <>
            <div className={sharedPropertiesStyles.componentProperty}>
              <p className={sharedPropertiesStyles.propertyLabel}>Type</p>
              <p className={sharedPropertiesStyles.propertyValue}>
                {propertyComponent.type}
              </p>
            </div>
            <div className={sharedPropertiesStyles.componentProperty}>
              <p className={sharedPropertiesStyles.propertyLabel}>Category</p>
              <p className={sharedPropertiesStyles.propertyValue}>
                {propertyComponent.category}
              </p>
            </div>
          </>
        )}

        {isEditing && panelElements}
      </div>

      <Modal
        isOpen={isModalOpen}
        backDrop={handleModalClose}
        onClose={handleModalClose}
        data-testid="delete-modal"
        onSubmit={handleModalAction}
        title="Confirm Delete"
        description={`Are you sure you want to delete this page? This action cannot be undone.`}
        submitText="Delete"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
}
