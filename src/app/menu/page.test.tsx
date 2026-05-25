import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import MenuConfigurator from "./page";
import { apiRequest } from "../services/APIService";

jest.mock("../services/APIService", () => ({
  apiRequest: jest.fn(),
}));

jest.mock("../components/SVGIcons/Rahi", () => () => (
  <svg data-testid="rahi-logo" />
));

jest.mock("../components/TreeItem/TreeItem", () => {
  return (props: any) => {
    const {
      item,
      level,
      toggleExpand,
      onAdd,
      onEdit,
      onDelete,
      onSelect,
      mode,
      onDragStart,
      onDragOver,
      onDrop,
      selectedItems,
      deleteConfirmFor,
      setDeleteConfirmFor,
    } = props;
    const isSelected = selectedItems?.some(
      (s: any) => s.menuName === item.menuName,
    );

    const renderSubMenus = (subMenus: any[] = []) =>
      subMenus.map((sub: any) => (
        <div key={sub.menuName}>
          <button
            data-testid={`submenu-drop-${sub.menuName}`}
            onDragOver={(e) => onDragOver(e, sub)}
            onDrop={(e) => onDrop(e, sub)}
          >
            {sub.menuTitle || sub.menuName}
          </button>
          {renderSubMenus(sub.subMenus)}
        </div>
      ));

    return (
      <div
        data-testid={`tree-item-${item.menuName}`}
        style={{ marginLeft: level * 20 }}
      >
        <span>{item.menuTitle || item.menuName}</span>
        {mode === "edit" && (
          <>
            <button
              data-testid={`toggle-btn-${item.menuName}`}
              onClick={() => toggleExpand(item.menuName)}
            >
              Toggle
            </button>
            <button
              data-testid={`add-btn-${item.menuName}`}
              onClick={() => onAdd(item.menuName)}
            >
              Add
            </button>
            <button
              data-testid={`edit-btn-${item.menuName}`}
              onClick={() => onEdit(item)}
            >
              Edit
            </button>
            {deleteConfirmFor === item.menuName ? (
              <>
                <button
                  data-testid={`confirm-delete-${item.menuName}`}
                  onClick={() => {
                    onDelete(item.menuName);
                    setDeleteConfirmFor(null);
                  }}
                >
                  Confirm
                </button>
                <button
                  data-testid={`cancel-delete-${item.menuName}`}
                  onClick={() => setDeleteConfirmFor(null)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                data-testid={`delete-btn-${item.menuName}`}
                onClick={() => setDeleteConfirmFor(item.menuName)}
              >
                Delete
              </button>
            )}
            <button
              data-testid={`drag-btn-${item.menuName}`}
              draggable
              onDragStart={(e) => onDragStart(e, item)}
              onDragOver={(e) => onDragOver(e, item)}
              onDrop={(e) => onDrop(e, item)}
            >
              Drag
            </button>
          </>
        )}
        {mode === "select" && (
          <input
            type="checkbox"
            data-testid={`select-checkbox-${item.menuName}`}
            checked={isSelected}
            onChange={(e) => onSelect(item.menuName, e.target.checked)}
          />
        )}
        {renderSubMenus(item.subMenus)}
      </div>
    );
  };
});

jest.mock("../components/SelectedLeafList/SelectedLeafList", () => {
  return (props: any) => (
    <div data-testid="selected-leaf-list">
      <button data-testid="clear-all-btn" onClick={props.clearAllSelected}>
        Clear All
      </button>
      {props.selectedItems.map((item: any) => (
        <div key={item.menuName} data-testid={`selected-item-${item.menuName}`}>
          {item.menuName}
          <button
            data-testid={`remove-btn-${item.menuName}`}
            onClick={() => props.removeSelectedItem(item.menuName)}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
});

describe("MenuConfigurator", () => {
  const mockMenuData = [
    {
      menuName: "menu1",
      menuTitle: "Menu 1",
      micrositeSlug: "slug1",
      url: "/url1",
      icon: "icon1",
      subMenus: [
        {
          menuName: "submenu1",
          menuTitle: "Sub Menu 1",
          micrositeSlug: "subslug1",
          url: "/suburl1",
          icon: "subicon1",
          subMenus: [],
        },
      ],
    },
    {
      menuName: "menu2",
      menuTitle: "Menu 2",
      micrositeSlug: "slug2",
      url: "/url2",
      icon: "icon2",
      subMenus: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (apiRequest as jest.Mock).mockResolvedValue(mockMenuData);
  });

  const renderComponent = () => render(<MenuConfigurator />);

  test("renders header with logo and title", async () => {
    renderComponent();

    expect(screen.getByTestId("rahi-logo")).toBeInTheDocument();
    expect(screen.getByText("Menu Configurator")).toBeInTheDocument();
  });

  test("renders Edit Mode and Select Mode buttons", async () => {
    renderComponent();

    expect(screen.getByText("Edit Mode")).toBeInTheDocument();
    expect(screen.getByText("Select Mode")).toBeInTheDocument();
  });

  test("fetches menus on mount when config is available", async () => {
    renderComponent();

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "/api/v1/menus",
          method: "GET",
        }),
      );
    });
  });

  test("renders tree items after fetching menus", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu1")).toBeInTheDocument();
      expect(screen.getByTestId("tree-item-menu2")).toBeInTheDocument();
    });
  });

  test("switches to select mode when Select Mode button is clicked", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Select Mode"));

    expect(screen.getByTestId("selected-leaf-list")).toBeInTheDocument();
  });

  test("switches back to edit mode when Edit Mode button is clicked", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Select Mode"));
    expect(screen.getByTestId("selected-leaf-list")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Edit Mode"));
    expect(screen.queryByTestId("selected-leaf-list")).not.toBeInTheDocument();
  });

  test("opens add panel when Add Root Menu button is clicked", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Add Root Menu"));

    expect(screen.getByText("Add to Root")).toBeInTheDocument();
    expect(screen.getByLabelText("Menu Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Menu Title")).toBeInTheDocument();
  });

  test("opens add panel when Add button on tree item is clicked", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("add-btn-menu1"));

    expect(screen.getByText("Add item under: menu1")).toBeInTheDocument();
  });

  test("opens edit panel with item data when Edit button is clicked", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("edit-btn-menu1"));

    expect(screen.getByText("Edit: menu1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("menu1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Menu 1")).toBeInTheDocument();
  });

  test("saves new root menu item", async () => {
    (apiRequest as jest.Mock)
      .mockResolvedValueOnce(mockMenuData)
      .mockResolvedValueOnce({});

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Add Root Menu"));

    fireEvent.change(screen.getByLabelText("Menu Name"), {
      target: { value: "newMenu" },
    });
    fireEvent.change(screen.getByLabelText("Menu Title"), {
      target: { value: "New Menu Title" },
    });

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "/api/v1/menus",
          method: "POST",
        }),
      );
    });
  });

  test("saves new child menu item under parent", async () => {
    (apiRequest as jest.Mock)
      .mockResolvedValueOnce(mockMenuData)
      .mockResolvedValueOnce({});

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("add-btn-menu1"));

    fireEvent.change(screen.getByLabelText("Menu Name"), {
      target: { value: "childMenu" },
    });
    fireEvent.change(screen.getByLabelText("Menu Title"), {
      target: { value: "Child Menu Title" },
    });

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "/api/v1/menus",
          method: "POST",
        }),
      );
    });
  });

  test("updates existing menu item on edit save", async () => {
    (apiRequest as jest.Mock)
      .mockResolvedValueOnce(mockMenuData)
      .mockResolvedValueOnce({});

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("edit-btn-menu1"));

    fireEvent.change(screen.getByLabelText("Menu Title"), {
      target: { value: "Updated Menu Title" },
    });

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "/api/v1/menus",
          method: "POST",
        }),
      );
    });
  });

  test("closes panel when Cancel button is clicked", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Add Root Menu"));
    expect(screen.getByText("Add to Root")).toBeInTheDocument();

    const cancelButtons = screen.getAllByText("Cancel");
    fireEvent.click(cancelButtons[cancelButtons.length - 1]);

    await waitFor(() => {
      expect(
        screen.getByText("Select an item or add a root menu"),
      ).toBeInTheDocument();
    });
  });

  test("deletes menu item when delete is confirmed", async () => {
    (apiRequest as jest.Mock)
      .mockResolvedValueOnce(mockMenuData)
      .mockResolvedValueOnce({});

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu2")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("delete-btn-menu2"));
    fireEvent.click(screen.getByTestId("confirm-delete-menu2"));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "/api/v1/menus",
          method: "POST",
        }),
      );
    });
  });

  test("cancels delete when cancel button is clicked", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu2")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("delete-btn-menu2"));
    expect(screen.getByTestId("confirm-delete-menu2")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("cancel-delete-menu2"));
    expect(
      screen.queryByTestId("confirm-delete-menu2"),
    ).not.toBeInTheDocument();
  });

  test("selects item in select mode", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Select Mode"));

    const checkbox = screen.getByTestId("select-checkbox-menu2");
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(screen.getByTestId("selected-item-menu2")).toBeInTheDocument();
    });
  });

  test("removes selected item when remove button is clicked", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu2")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Select Mode"));

    const checkbox = screen.getByTestId("select-checkbox-menu2");
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(screen.getByTestId("selected-item-menu2")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("remove-btn-menu2"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("selected-item-menu2"),
      ).not.toBeInTheDocument();
    });
  });

  test("clears all selected items when Clear All is clicked", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu2")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Select Mode"));

    fireEvent.click(screen.getByTestId("select-checkbox-menu2"));

    await waitFor(() => {
      expect(screen.getByTestId("selected-item-menu2")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("clear-all-btn"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("selected-item-menu2"),
      ).not.toBeInTheDocument();
    });
  });

  test("deselects item when checkbox is unchecked", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu2")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Select Mode"));

    const checkbox = screen.getByTestId(
      "select-checkbox-menu2",
    ) as HTMLInputElement;
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(screen.getByTestId("selected-item-menu2")).toBeInTheDocument();
    });

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(
        screen.queryByTestId("selected-item-menu2"),
      ).not.toBeInTheDocument();
    });
  });

  test("handles drag and drop to reorder items", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu1")).toBeInTheDocument();
      expect(screen.getByTestId("tree-item-menu2")).toBeInTheDocument();
    });

    const dragBtn1 = screen.getByTestId("drag-btn-menu1");
    const dragBtn2 = screen.getByTestId("drag-btn-menu2");

    fireEvent.dragStart(dragBtn2, { dataTransfer: { effectAllowed: "move" } });
    fireEvent.dragOver(dragBtn1, { preventDefault: jest.fn() });
    fireEvent.drop(dragBtn1, { preventDefault: jest.fn() });
  });

  test("handles API error during menu post gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu1")).toBeInTheDocument();
    });

    (apiRequest as jest.Mock).mockRejectedValueOnce(new Error("API Error"));

    fireEvent.click(screen.getByText("Add Root Menu"));
    fireEvent.change(screen.getByLabelText("Menu Name"), {
      target: { value: "errorMenu" },
    });
    fireEvent.change(screen.getByLabelText("Menu Title"), {
      target: { value: "Error Menu" },
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    consoleSpy.mockRestore();
  });

  test("handles form inputs for all fields", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Add Root Menu"));

    fireEvent.change(screen.getByLabelText("Menu Name"), {
      target: { value: "testName" },
    });
    fireEvent.change(screen.getByLabelText("Menu Title"), {
      target: { value: "testTitle" },
    });
    fireEvent.change(screen.getByLabelText("Microsite Slug"), {
      target: { value: "testSlug" },
    });
    fireEvent.change(screen.getByLabelText("URL"), {
      target: { value: "/test-url" },
    });
    fireEvent.change(screen.getByLabelText("Icon"), {
      target: { value: "test-icon" },
    });

    expect(screen.getByDisplayValue("testName")).toBeInTheDocument();
    expect(screen.getByDisplayValue("testTitle")).toBeInTheDocument();
    expect(screen.getByDisplayValue("testSlug")).toBeInTheDocument();
    expect(screen.getByDisplayValue("/test-url")).toBeInTheDocument();
    expect(screen.getByDisplayValue("test-icon")).toBeInTheDocument();
  });

  test("handleSubmit does nothing when conditions are not met", async () => {
    (apiRequest as jest.Mock).mockResolvedValue(mockMenuData);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu1")).toBeInTheDocument();
    });

    const saveButton = screen.getByText("Save");
    expect(saveButton).toBeDisabled();
  });

  test("handles root drop zone drag and drop", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu1")).toBeInTheDocument();
    });

    const dragBtn = screen.getByTestId("drag-btn-menu1");

    await act(async () => {
      fireEvent.dragStart(dragBtn, {
        dataTransfer: { effectAllowed: "move" },
      });
    });

    const dropZones = screen.getAllByText("Drop here to move to Root Level");
    expect(dropZones.length).toBeGreaterThan(0);

    fireEvent.dragOver(dropZones[0], { preventDefault: jest.fn() });
    fireEvent.drop(dropZones[0], { preventDefault: jest.fn() });
  });

  test("prevents drop when dragging into itself", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu1")).toBeInTheDocument();
    });

    const dragBtn = screen.getByTestId("drag-btn-menu1");

    fireEvent.dragStart(dragBtn, { dataTransfer: { effectAllowed: "move" } });
    fireEvent.dragOver(dragBtn, { preventDefault: jest.fn() });
    fireEvent.drop(dragBtn, { preventDefault: jest.fn() });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Invalid drop! Cannot drop into itself or its own subMenu.",
    );

    consoleSpy.mockRestore();
  });

  test("selects parent node and gets all leaf children", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Select Mode"));

    const checkbox = screen.getByTestId("select-checkbox-menu1");
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(screen.getByTestId("selected-item-submenu1")).toBeInTheDocument();
    });
  });

  test("toggles expanded state through tree item callback", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu1")).toBeInTheDocument();
    });

    expect(() =>
      fireEvent.click(screen.getByTestId("toggle-btn-menu1")),
    ).not.toThrow();
  });

  test("prevents drop when dragging a parent into its nested submenu", async () => {
    const consoleSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu1")).toBeInTheDocument();
      expect(screen.getByTestId("submenu-drop-submenu1")).toBeInTheDocument();
    });

    fireEvent.dragStart(screen.getByTestId("drag-btn-menu1"), {
      dataTransfer: { effectAllowed: "", setData: jest.fn() },
    });

    fireEvent.drop(screen.getByTestId("submenu-drop-submenu1"), {
      preventDefault: jest.fn(),
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Invalid drop! Cannot drop into itself or its own subMenu.",
    );

    consoleSpy.mockRestore();
  });

  test("prevents drop when dragging a parent into a deeper nested descendant", async () => {
    const deepMenuData = [
      {
        menuName: "menu1",
        menuTitle: "Menu 1",
        subMenus: [
          {
            menuName: "submenu1",
            menuTitle: "Sub Menu 1",
            subMenus: [
              {
                menuName: "subsubmenu1",
                menuTitle: "Sub Sub Menu 1",
                subMenus: [],
              },
            ],
          },
        ],
      },
    ];
    const consoleSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    (apiRequest as jest.Mock).mockResolvedValueOnce(deepMenuData);

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByTestId("submenu-drop-subsubmenu1"),
      ).toBeInTheDocument();
    });

    fireEvent.dragStart(screen.getByTestId("drag-btn-menu1"), {
      dataTransfer: { effectAllowed: "", setData: jest.fn() },
    });

    fireEvent.drop(screen.getByTestId("submenu-drop-subsubmenu1"), {
      preventDefault: jest.fn(),
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Invalid drop! Cannot drop into itself or its own subMenu.",
    );

    consoleSpy.mockRestore();
  });

  test("shows the idle panel title when no add or edit action is active", async () => {
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText("Select an item or add a root menu"),
      ).toBeInTheDocument();
    });
  });

  test("handles drag over on the lower root drop zone", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu2")).toBeInTheDocument();
    });

    fireEvent.dragStart(screen.getByTestId("drag-btn-menu2"), {
      dataTransfer: { effectAllowed: "", setData: jest.fn() },
    });

    const rootDropZones = screen.getAllByText(
      "Drop here to move to Root Level",
    );
    fireEvent.dragOver(rootDropZones[1], { preventDefault: jest.fn() });

    expect(rootDropZones[1]).toBeInTheDocument();
  });

  test("handles drop on the lower root drop zone", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu2")).toBeInTheDocument();
    });

    fireEvent.dragStart(screen.getByTestId("drag-btn-menu2"), {
      dataTransfer: { effectAllowed: "", setData: jest.fn() },
    });

    const rootDropZones = screen.getAllByText(
      "Drop here to move to Root Level",
    );
    fireEvent.drop(rootDropZones[1], { preventDefault: jest.fn() });

    expect(screen.getByTestId("tree-item-menu2")).toBeInTheDocument();
  });

  test("moves a node into a nested submenu", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu2")).toBeInTheDocument();
      expect(screen.getByTestId("submenu-drop-submenu1")).toBeInTheDocument();
    });

    fireEvent.dragStart(screen.getByTestId("drag-btn-menu2"), {
      dataTransfer: { effectAllowed: "", setData: jest.fn() },
    });

    fireEvent.drop(screen.getByTestId("submenu-drop-submenu1"), {
      preventDefault: jest.fn(),
    });

    await waitFor(() => {
      expect(screen.queryByTestId("tree-item-menu2")).not.toBeInTheDocument();
    });
  });

  test("preserves nodes without subMenus when adding under a different branch", async () => {
    const menuWithoutSubMenus = [
      {
        menuName: "menu1",
        menuTitle: "Menu 1",
        subMenus: [],
      },
      {
        menuName: "menu3",
        menuTitle: "Menu 3",
      },
    ];

    (apiRequest as jest.Mock)
      .mockResolvedValueOnce(menuWithoutSubMenus)
      .mockResolvedValueOnce({});

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("add-btn-menu1"));
    fireEvent.change(screen.getByLabelText("Menu Name"), {
      target: { value: "childMenu" },
    });
    fireEvent.change(screen.getByLabelText("Menu Title"), {
      target: { value: "Child Menu" },
    });
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenLastCalledWith(
        expect.objectContaining({
          body: expect.arrayContaining([
            expect.objectContaining({ menuName: "menu3" }),
          ]),
        }),
      );
    });
  });

  test("preserves nodes without subMenus when updating a different node", async () => {
    const menuWithoutSubMenus = [
      {
        menuName: "menu1",
        menuTitle: "Menu 1",
        subMenus: [],
      },
      {
        menuName: "menu3",
        menuTitle: "Menu 3",
      },
    ];

    (apiRequest as jest.Mock)
      .mockResolvedValueOnce(menuWithoutSubMenus)
      .mockResolvedValueOnce({});

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("tree-item-menu1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("edit-btn-menu1"));
    fireEvent.change(screen.getByLabelText("Menu Title"), {
      target: { value: "Updated Menu 1" },
    });
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenLastCalledWith(
        expect.objectContaining({
          body: expect.arrayContaining([
            expect.objectContaining({ menuName: "menu3" }),
          ]),
        }),
      );
    });
  });
});
