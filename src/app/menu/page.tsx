"use client";

import { apiRequest } from "@/app/services/APIService";
import { IRequestData } from "@/app/types/types";
import { useEffect, useState } from "react";
import styles from "./Menu.module.scss";
import headerStyles from "../components/HeaderV2/HeaderV2.module.scss";
import RahiLogo from "@/app/components/SVGIcons/Rahi";
import TreeItem from "@/app/components/TreeItem/TreeItem";
import SelectedLeafList from "@/app/components/SelectedLeafList/SelectedLeafList";

type MenuItem = {
  menuName: string;
  menuTitle: "string";
  micrositeSlug: "string";
  url: "string";
  icon: "string";
  subMenus?: MenuItem[];
};

const MenuConfigurator = () => {
  const [mode, setMode] = useState<"edit" | "select">("edit");
  const [menu, setMenu] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [pendingParent, setPendingParent] = useState<string | null>(null);
  const [isAddingRoot, setIsAddingRoot] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [draggedItem, setDraggedItem] = useState<Record<string, any> | null>(
    null,
  );
  const [selectedItems, setSelectedItems] = useState<Record<string, any>[]>([]);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [deleteConfirmFor, setDeleteConfirmFor] = useState<string | null>(null);
  const emptyItem = {
    menuName: "",
    menuTitle: "",
    micrositeSlug: "",
    url: "",
    icon: "",
  };
  const [newItem, setNewItem] = useState(emptyItem);

  const getSelectedLeafNodes = (
    tree: MenuItem[],
    selectedName: string,
  ): MenuItem[] => {
    const findNode = (nodes: MenuItem[], name: string): MenuItem | null => {
      for (const node of nodes) {
        if (node.menuName === name) return node;

        if (node.subMenus?.length) {
          const found = findNode(node.subMenus, name);
          if (found) return found;
        }
      }
      return null;
    };

    const collectLeafNodes = (node: MenuItem): MenuItem[] => {
      if (!node.subMenus || node.subMenus.length === 0) {
        return [node];
      }

      let leafs: MenuItem[] = [];
      for (const child of node.subMenus) {
        leafs = leafs.concat(collectLeafNodes(child));
      }
      return leafs;
    };

    const target = findNode(tree, selectedName);
    if (!target) return [];

    return collectLeafNodes(target);
  };

  const handleSelect = (menuName: string, checked: boolean) => {
    const leafNodes = getSelectedLeafNodes(menu, menuName);

    if (checked) {
      addLeafNodes(leafNodes);
    } else {
      removeLeafNodes(leafNodes);
    }
  };

  const addLeafNodes = (leafNodes: any[]) => {
    setSelectedItems((prev) => {
      const existingNames = getExistingNames(prev);
      const newNodes = filterNewLeafNodes(leafNodes, existingNames);
      return [...prev, ...newNodes];
    });
  };

  const removeLeafNodes = (leafNodes: any[]) => {
    setSelectedItems((prev) => filterRemainingNodes(prev, leafNodes));
  };

  const getExistingNames = (items: any[]) =>
    new Set(items.map((x) => x.menuName));

  const filterNewLeafNodes = (leafNodes: any[], existingNames: Set<string>) =>
    leafNodes.filter((node) => !existingNames.has(node.menuName));

  const filterRemainingNodes = (items: any[], leafNodes: any[]) =>
    items.filter(
      (n) => !leafNodes.some((leaf) => leaf.menuName === n.menuName),
    );

  const removeSelectedItem = (menuName: string) => {
    setSelectedItems((prev) => prev.filter((x) => x.menuName !== menuName));
  };

  const clearAllSelected = () => setSelectedItems([]);

  const onDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    item: Record<string, any>,
  ) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (
    e: React.DragEvent<HTMLButtonElement>,
    item: Record<string, any>,
  ) => {
    e.preventDefault();
    setDropTarget(item.menuName);
  };

  const isDescendant = (
    parent: Record<string, any>,
    child: Record<string, any>,
  ): boolean => {
    if (!parent.subMenus) return false;
    for (const sub of parent.subMenus) {
      if (sub.menuName === child.menuName) return true;
      if (isDescendant(sub, child)) return true;
    }
    return false;
  };

  const onDrop = (
    e: React.DragEvent<HTMLButtonElement>,
    dropTargetItem: Record<string, any>,
  ) => {
    e.preventDefault();
    if (!draggedItem) return;

    if (
      draggedItem.menuName === dropTargetItem.menuName ||
      isDescendant(draggedItem, dropTargetItem)
    ) {
      console.log("Invalid drop! Cannot drop into itself or its own subMenu.");
      setDraggedItem(null);
      setDropTarget(null);
      return;
    }

    const updated = moveNode(menu, draggedItem, dropTargetItem);
    setMenu(updated);

    setDraggedItem(null);
    setDropTarget(null);
  };

  const removeNode = (
    tree: Record<string, any>[],
    targetName: string,
  ): any[] => {
    return tree
      .filter((n) => n.menuName !== targetName)
      .map((n) => ({
        ...n,
        subMenus: n.subMenus ? removeNode(n.subMenus, targetName) : [],
      }));
  };

  const insertNode = (
    tree: Record<string, any>[],
    parentName: string,
    node: Record<string, any>,
  ) => {
    return tree.map((item: Record<string, any>): Record<string, any> => {
      if (item.menuName === parentName) {
        return {
          ...item,
          subMenus: [...(item.subMenus || []), node],
        };
      }
      return {
        ...item,
        subMenus: item.subMenus
          ? insertNode(item.subMenus, parentName, node)
          : [],
      };
    });
  };

  const moveNode = (
    tree: Record<string, any>[],
    draggedItem: Record<string, any>,
    dropTargetItem: Record<string, any>,
  ) => {
    if (!dropTargetItem) return tree;

    let newTree = removeNode(tree, draggedItem.menuName);

    newTree = insertNode(newTree, dropTargetItem.menuName, draggedItem);

    return newTree;
  };

  const getMenus = async () => {
    const requestData: IRequestData = {
      endpoint: `/api/v1/menus`,
      method: "GET",
    };

    const menus = await apiRequest(requestData);
    setMenu(menus);
  };

  useEffect(() => {
    getMenus();
  }, []);

  const toggleExpand = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const onAdd = (parentName: string) => {
    setPendingParent(parentName);
    setEditingItem(null);
    setIsAddingRoot(false);
    setNewItem(emptyItem);
    setShowPanel(true);
  };

  const onEdit = (item: Record<string, any>) => {
    setEditingItem(item);
    setPendingParent(null);
    setIsAddingRoot(false);

    setNewItem({
      menuName: item.menuName,
      menuTitle: item.menuTitle,
      micrositeSlug: item.micrositeSlug ?? "",
      url: item.url ?? "",
      icon: item.icon ?? "",
    });

    setShowPanel(true);
  };

  const addNode = (tree: any[], parent: string, node: any): any[] => {
    return tree.map((item) => {
      if (item.menuName === parent) {
        return {
          ...item,
          subMenus: [...(item.subMenus ?? []), node],
        };
      }
      if (item.subMenus) {
        return {
          ...item,
          subMenus: addNode(item.subMenus, parent, node),
        };
      }
      return item;
    });
  };

  const deleteNode = (tree: any[], name: string): any[] => {
    return tree
      .filter((node) => node.menuName !== name)
      .map((node) => ({
        ...node,
        subMenus: node.subMenus ? deleteNode(node.subMenus, name) : [],
      }));
  };

  const updateNode = (tree: any[], name: string, updatedFields: any): any[] =>
    tree.map((node) => {
      if (node.menuName === name) {
        return { ...node, ...updatedFields };
      }
      if (node.subMenus) {
        return {
          ...node,
          subMenus: updateNode(node.subMenus, name, updatedFields),
        };
      }
      return node;
    });

  const handleSubmit = async () => {
    if (editingItem) {
      const updated = updateNode(menu, editingItem.menuName, {
        menuName: newItem.menuName,
        menuTitle: newItem.menuTitle,
        micrositeSlug: newItem.micrositeSlug || null,
        url: newItem.url || null,
        icon: newItem.icon || null,
      });

      setMenu(updated);
      setEditingItem(null);
      setNewItem(emptyItem);
      setShowPanel(false);

      await postUpdatedMenu(updated);
      return;
    }

    if (isAddingRoot) {
      const node = {
        menuName: newItem.menuName,
        menuTitle: newItem.menuTitle,
        micrositeSlug: newItem.micrositeSlug || null,
        url: newItem.url || null,
        icon: newItem.icon || null,
        subMenus: [],
      };

      const updated = [...menu, node];
      setMenu(updated);
      setIsAddingRoot(false);
      setNewItem(emptyItem);
      setShowPanel(false);

      await postUpdatedMenu(updated);
      return;
    }

    if (!pendingParent) return;

    const node = {
      menuName: newItem.menuName,
      menuTitle: newItem.menuTitle,
      micrositeSlug: newItem.micrositeSlug || null,
      url: newItem.url || null,
      icon: newItem.icon || null,
      subMenus: [],
    };

    const updated = addNode(menu, pendingParent, node);
    setMenu(updated);

    setPendingParent(null);
    setNewItem(emptyItem);
    setShowPanel(false);

    await postUpdatedMenu(updated);
  };

  const handleRootDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedItem) return;

    const updated = removeNode(menu, draggedItem.menuName);

    setMenu([...updated, draggedItem]);

    setDraggedItem(null);
    setDropTarget(null);
  };

  const postUpdatedMenu = async (updatedMenu: any[]) => {
    const requestData: IRequestData = {
      endpoint: `/api/v1/menus`,
      method: "POST",
      body: updatedMenu,
    };

    try {
      await apiRequest(requestData);
    } catch (error) {
      console.log("Error: ", error);
    }
  };

  const onDelete = async (name: string) => {
    const updated = deleteNode(menu, name);
    setMenu(updated);
    await postUpdatedMenu(updated);
  };

  const titleText = editingItem
    ? `Edit: ${editingItem.menuName}`
    : isAddingRoot
      ? "Add to Root"
      : pendingParent
        ? `Add item under: ${pendingParent}`
        : "Select an item or add a root menu";

  const renderTree = (items: Record<string, any>[], level = 0) => {
    return items.map((item) => (
      <TreeItem
        mode={mode}
        key={item.menuName}
        item={item}
        level={level}
        expanded={expanded}
        toggleExpand={toggleExpand}
        onAdd={onAdd}
        onDelete={onDelete}
        onEdit={onEdit}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onSelect={handleSelect}
        selectedItems={selectedItems}
        dropTarget={dropTarget}
        draggedItem={draggedItem}
        isDescendant={isDescendant}
        deleteConfirmFor={deleteConfirmFor}
        setDeleteConfirmFor={setDeleteConfirmFor}
      />
    ));
  };

  return (
    <>
      <header className={headerStyles.header}>
        <div className={headerStyles.leftSection}>
          <button className={headerStyles.logo}>
            <RahiLogo />
          </button>
          <h3 className={headerStyles.title}>Menu Configurator</h3>
        </div>
      </header>
      <div
        style={{
          marginBottom: 20,
          paddingTop: 50,
          display: "flex",
          justifyContent: "flex-end",
          marginRight: "20px",
        }}
      >
        <button className={styles.btn} onClick={() => setMode("edit")}>
          Edit Mode
        </button>
        <button className={styles.btn} onClick={() => setMode("select")}>
          Select Mode
        </button>
      </div>
      {/* Selected Items Panel */}
      {mode === "select" && (
        <SelectedLeafList
          clearAllSelected={clearAllSelected}
          removeSelectedItem={removeSelectedItem}
          selectedItems={selectedItems}
        />
      )}

      <div style={{ display: "flex" }}>
        <div style={{ width: "100%" }}>
          <button
            onClick={() => {
              setIsAddingRoot(true);
              setPendingParent(null);
              setNewItem(emptyItem);
              setEditingItem(null);
              setShowPanel(true);
            }}
            className={styles.btn}
          >
            Add Root Menu
          </button>
          {draggedItem && (
            <div
              className={`${styles.rootDropZone} ${
                dropTarget === "ROOT" ? styles.dropTarget : ""
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDropTarget("ROOT");
              }}
              onDrop={(e) => handleRootDrop(e)}
            >
              Drop here to move to Root Level
            </div>
          )}
          <div className={styles.treeContainer}>{renderTree(menu)}</div>
          {draggedItem && (
            <div
              className={`${styles.rootDropZone} ${
                dropTarget === "ROOT" ? styles.dropTarget : ""
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDropTarget("ROOT");
              }}
              onDrop={(e) => handleRootDrop(e)}
            >
              Drop here to move to Root Level
            </div>
          )}
        </div>

        <div
          className={`${styles.addItemContainer} ${
            showPanel ? styles.visible : ""
          }`}
        >
          <p className={styles.title}>{titleText}</p>

          <div className={styles.inputBox}>
            <label htmlFor="menuName">Menu Name</label>
            <input
              id="menuName"
              disabled={!pendingParent && !isAddingRoot && !editingItem}
              placeholder="Enter Menu Name"
              value={newItem.menuName}
              onChange={(e) =>
                setNewItem({ ...newItem, menuName: e.target.value })
              }
            />
          </div>

          <div className={styles.inputBox}>
            <label htmlFor="menuTitle">Menu Title</label>
            <input
              id="menuTitle"
              disabled={!pendingParent && !isAddingRoot && !editingItem}
              placeholder="Enter Menu Title"
              value={newItem.menuTitle}
              onChange={(e) =>
                setNewItem({ ...newItem, menuTitle: e.target.value })
              }
            />
          </div>

          <div className={styles.inputBox}>
            <label htmlFor="micrositeSlug">Microsite Slug</label>
            <input
              id="micrositeSlug"
              disabled={!pendingParent && !isAddingRoot && !editingItem}
              placeholder="Enter Microsite Slug"
              value={newItem.micrositeSlug}
              onChange={(e) =>
                setNewItem({ ...newItem, micrositeSlug: e.target.value })
              }
            />
          </div>

          <div className={styles.inputBox}>
            <label htmlFor="url">URL</label>
            <input
              id="url"
              disabled={!pendingParent && !isAddingRoot && !editingItem}
              placeholder="Enter URL"
              value={newItem.url}
              onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
            />
          </div>

          <div className={styles.inputBox}>
            <label htmlFor="icon">Icon</label>
            <input
              id="icon"
              disabled={!pendingParent && !isAddingRoot && !editingItem}
              placeholder="Enter Icon Name"
              value={newItem.icon}
              onChange={(e) => setNewItem({ ...newItem, icon: e.target.value })}
            />
          </div>

          <div className={styles.btnBox}>
            <button
              disabled={!pendingParent && !isAddingRoot && !editingItem}
              onClick={handleSubmit}
            >
              Save
            </button>
            <button
              disabled={!pendingParent && !isAddingRoot && !editingItem}
              onClick={() => {
                setPendingParent(null);
                setIsAddingRoot(false);
                setEditingItem(null);
                setNewItem(emptyItem);
                setShowPanel(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MenuConfigurator;
