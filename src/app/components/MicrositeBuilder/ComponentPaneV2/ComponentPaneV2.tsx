"use client";

import { Fragment, useEffect, useDeferredValue, useRef, useState } from "react";
import {
  availableComponents,
  componentPaneV2CategoryLabels,
  componentPaneV2CategoryOrder,
} from "@/app/data/availableComponents";
import { BehaviorCategory, ComponentCatalogEntry } from "@/app/types/types";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { useFindForm } from "@/app/hooks/useFindForm";
import { useConfiguratorMode } from "@/app/context/ConfiguratorModeContext";
import PropertiesPaneV2 from "@/app/components/PropertiesPaneV2/PropertiesPaneV2";
import ComponentPaneV2Toolbar from "./ComponentPaneV2Toolbar";
import ComponentPaneV2Category from "./ComponentPaneV2Category";
import styles from "./ComponentPaneV2.module.scss";

const defaultExpandedCategories: Record<BehaviorCategory, boolean> = {
  containers: true,
  inputs: true,
  choices: true,
  display: true,
  utilities: true,
  domain: true,
};

const collapsedCategories: Record<BehaviorCategory, boolean> = {
  containers: false,
  inputs: false,
  choices: false,
  display: false,
  utilities: false,
  domain: false,
};

const isViewableComponent = (
  component: ComponentCatalogEntry,
): component is ComponentCatalogEntry & {
  description: string;
  keywords: string[];
  viewCategory: BehaviorCategory;
} =>
  Boolean(
    component.viewCategory &&
      component.description &&
      Array.isArray(component.keywords),
  );

export default function ComponentPaneV2() {
  const { isPropertyPaneVisible, propertyComponentId, propertyPageCode } =
    usePropertyPane();
  const { isFormFound } = useFindForm();
  const { mode } = useConfiguratorMode();
  const [searchValue, setSearchValue] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const prevShowPropertiesPaneRef = useRef(false);
  const [expandedCategories, setExpandedCategories] = useState(
    defaultExpandedCategories,
  );
  const deferredSearchValue = useDeferredValue(searchValue);
  const normalizedSearchValue = deferredSearchValue.trim().toLowerCase();
  const areAllCategoriesExpanded = componentPaneV2CategoryOrder.every(
    (category) => expandedCategories[category],
  );
  const showPropertiesPane =
    isPropertyPaneVisible && Boolean(propertyComponentId ?? propertyPageCode);

  useEffect(() => {
    if (
      prevShowPropertiesPaneRef.current &&
      !showPropertiesPane &&
      searchValue
    ) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      });
    }
    prevShowPropertiesPaneRef.current = showPropertiesPane;
  }, [showPropertiesPane, searchValue]);

  const filteredItems = availableComponents.filter((entry) => {
    if (!isViewableComponent(entry)) {
      return false;
    }

    if (mode === "page" && entry.type === "tabs") {
      return false;
    }

    if (!normalizedSearchValue) {
      return true;
    }

    const resolvedTitle = entry.title ?? entry.displayName;
    const searchFields = [
      resolvedTitle,
      entry.displayName,
      entry.description,
      componentPaneV2CategoryLabels[entry.viewCategory],
      entry.type,
      ...entry.keywords,
    ];

    return searchFields.some((field) =>
      field.toLowerCase().includes(normalizedSearchValue),
    );
  });

  const categories = componentPaneV2CategoryOrder
    .map((category) => {
      const items = filteredItems.filter(
        (entry) => entry.viewCategory === category,
      );
      const isSearchActive = normalizedSearchValue.length > 0;
      return {
        category,
        label: componentPaneV2CategoryLabels[category],
        items,
        isOpen: isSearchActive
          ? items.length > 0
          : expandedCategories[category],
      };
    })
    .filter((category) => category.items.length > 0);

  return (
    <Fragment>
      {!showPropertiesPane ? (
        <div className={styles.componentPaneContainer}>
          <ComponentPaneV2Toolbar
            searchValue={searchValue}
            viewMode={viewMode}
            areAllCategoriesExpanded={areAllCategoriesExpanded}
            searchInputRef={searchInputRef}
            onSearchChange={setSearchValue}
            onViewModeChange={setViewMode}
            onExpandAll={() => setExpandedCategories(defaultExpandedCategories)}
            onCollapseAll={() => setExpandedCategories(collapsedCategories)}
          />
          <div className={styles.categories}>
            {categories.length ? (
              categories.map((category) => (
                <ComponentPaneV2Category
                  key={category.category}
                  category={category.category}
                  label={category.label}
                  isOpen={category.isOpen}
                  items={category.items}
                  viewMode={viewMode}
                  isFormFound={isFormFound}
                  onToggle={(nextCategory) =>
                    setExpandedCategories((current) => ({
                      ...current,
                      [nextCategory]: !current[nextCategory],
                    }))
                  }
                />
              ))
            ) : (
              <div className={styles.emptyState}>
                No components match your search.
              </div>
            )}
          </div>
        </div>
      ) : (
        <PropertiesPaneV2 />
      )}
    </Fragment>
  );
}
