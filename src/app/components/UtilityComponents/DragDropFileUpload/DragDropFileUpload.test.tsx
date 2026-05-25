import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DragDropFileUpload from "./DragDropFileUpload";

// --- Updated DataTransfer Polyfill ---
class DataTransferMock {
  public _files: File[] = [];
  public items = {
    add: (file: File) => {
      this._files.push(file);
    },
    remove: jest.fn(),
    clear: jest.fn(),
  };
  get files(): FileList {
    const filesArray = this._files;
    const fileList: Partial<FileList> = {
      length: filesArray.length,
      item: (index: number) => filesArray[index] || null,
      [Symbol.iterator](): ArrayIterator<File> {
        return Array.from(filesArray).values();
      },
    };
    filesArray.forEach((file, index) => {
      (fileList as any)[index] = file;
    });
    return fileList as FileList;
  }

  setDragImage = jest.fn();
}
(global as any).DataTransfer = DataTransferMock;

// --- Mocks --- //

// Mock Next.js Image to render an <img> element.
jest.mock("next/image", () => (props: any) => (
  <img {...props} alt={props.alt} />
));

// Mock custom hooks for component and section properties.
const setComponentPropertyMock = jest.fn();
jest.mock("@/app/hooks/useComponentProperties", () => ({
  useComponentProperties: (componentId: string) => ({
    setProperty: setComponentPropertyMock,
  }),
}));

// Mock FileReader so that it immediately sets a dummy data URL.
class MockFileReader {
  result: string | ArrayBuffer | null = null;
  onloadend: (() => void) | null = null;
  readAsDataURL(file: File) {
    this.result = `data:${file.type};base64,dummyData`;
    if (this.onloadend) {
      this.onloadend();
    }
  }
}
(global as any).FileReader = MockFileReader;

// --- Helper to create dummy File objects ---
const createFile = (
  name: string,
  size: number,
  type: string,
  content?: BlobPart,
) => {
  const fileContent = content || new ArrayBuffer(size);
  return new File([fileContent], name, { type });
};

// --- Default Props ---
const defaultProps = {
  id: "fileInput1",
  componentId: "comp1",
  sectionId: "sec1",
  propertyKey: "imageUrl",
  fileTypes: ["jpg", "png"],
  maxSize: 2 * 1024 * 1024, // 2 MB
};

// Props without componentId to test sectionId flow
const sectionOnlyProps = {
  id: "fileInput2",
  componentId: "r5fgrt4",
  propertyKey: "imageUrl",
  fileTypes: ["jpg", "png"],
  maxSize: 2 * 1024 * 1024, // 2 MB
};

describe("DragDropFileUpload", () => {
  beforeEach(() => {
    setComponentPropertyMock.mockClear();
  });

  it("renders the drag-drop container with placeholder text", () => {
    render(<DragDropFileUpload {...defaultProps} />);
    const container = screen.getByRole("presentation");
    expect(container).toBeInTheDocument();
    expect(
      screen.getByText(/Drop an image here or Click to select/i),
    ).toBeInTheDocument();
  });

  it("adds and removes dragOver class on drag events", () => {
    render(<DragDropFileUpload {...defaultProps} />);
    const container = screen.getByRole("presentation");
    fireEvent.dragOver(container);
    expect(container.className).toMatch(/dragOver/);
    fireEvent.dragLeave(container);
    expect(container.className).not.toMatch(/dragOver/);
  });

  it("processes a valid file selected via file input", async () => {
    render(<DragDropFileUpload {...defaultProps} />);
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const validFile = createFile(
      "test.jpg",
      100000,
      "image/jpeg",
      "dummy content",
    );
    fireEvent.change(fileInput, { target: { files: [validFile] } });
    await waitFor(() => {
      expect(screen.getByAltText("Preview")).toBeInTheDocument();
    });
    expect(setComponentPropertyMock).toHaveBeenCalledWith(
      defaultProps.propertyKey,
      "data:image/jpeg;base64,dummyData",
    );
  });

  it("shows error for invalid file type", () => {
    render(<DragDropFileUpload {...defaultProps} />);
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const invalidFile = createFile(
      "test.txt",
      1000,
      "text/plain",
      "dummy text",
    );
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    expect(
      screen.getByText(/Invalid file type. Accepted types: jpg, png/i),
    ).toBeInTheDocument();
    expect(setComponentPropertyMock).not.toHaveBeenCalled();
  });

  it("shows error for file size exceeding maxSize", () => {
    render(<DragDropFileUpload {...defaultProps} />);
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const largeFile = createFile("test.jpg", 3 * 1024 * 1024, "image/jpeg");
    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    expect(
      screen.getByText((content) =>
        content.includes("File size exceeds the limit of"),
      ),
    ).toBeInTheDocument();
    expect(setComponentPropertyMock).not.toHaveBeenCalled();
  });

  it("clears image when Clear Image button is clicked", async () => {
    render(<DragDropFileUpload {...defaultProps} />);
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const validFile = createFile(
      "test.jpg",
      100000,
      "image/jpeg",
      "dummy content",
    );
    fireEvent.change(fileInput, { target: { files: [validFile] } });
    await waitFor(() => {
      expect(screen.getByAltText("Preview")).toBeInTheDocument();
    });
    const clearButton = screen.getByRole("button", { name: /Clear Image/i });
    fireEvent.click(clearButton);
    await waitFor(() => {
      expect(screen.queryByAltText("Preview")).toBeNull();
    });
    expect(setComponentPropertyMock).toHaveBeenCalledWith(
      defaultProps.propertyKey,
      "",
    );
  });

  it("triggers file input click when container is clicked", () => {
    render(<DragDropFileUpload {...defaultProps} />);
    const container = screen.getByRole("presentation");
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const clickSpy = jest.spyOn(fileInput, "click");
    fireEvent.click(container);
    expect(clickSpy).toHaveBeenCalled();
  });

  it("calls custom handleChange when provided", async () => {
    const customHandleChange = jest.fn();
    render(
      <DragDropFileUpload
        {...defaultProps}
        handleChange={customHandleChange}
      />,
    );

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const validFile = createFile(
      "test.jpg",
      100000,
      "image/jpeg",
      "dummy content",
    );

    fireEvent.change(fileInput, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(customHandleChange).toHaveBeenCalledWith(
        defaultProps.propertyKey,
        "data:image/jpeg;base64,dummyData",
      );
    });

    expect(setComponentPropertyMock).not.toHaveBeenCalled();
  });

  it("updates section property when uploading a file with sectionId only", async () => {
    render(<DragDropFileUpload {...sectionOnlyProps} />);

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const validFile = createFile(
      "test.jpg",
      100000,
      "image/jpeg",
      "dummy content",
    );

    fireEvent.change(fileInput, { target: { files: [validFile] } });

    expect(setComponentPropertyMock).toHaveBeenCalledWith(
      "imageUrl",
      "data:image/jpeg;base64,dummyData",
    );
  });

  it("updates section property when clearing an image with sectionId only", async () => {
    render(<DragDropFileUpload {...sectionOnlyProps} />);

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const validFile = createFile(
      "test.jpg",
      100000,
      "image/jpeg",
      "dummy content",
    );

    fireEvent.change(fileInput, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(screen.getByAltText("Preview")).toBeInTheDocument();
    });
    const clearButton = screen.getByRole("button", { name: /Clear Image/i });
    fireEvent.click(clearButton);
  });

  it("handles file drag and drop correctly", async () => {
    render(<DragDropFileUpload {...defaultProps} />);
    const container = screen.getByRole("presentation");

    const validFile = createFile(
      "test.jpg",
      100000,
      "image/jpeg",
      "dummy content",
    );

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(validFile);

    fireEvent.drop(container, { dataTransfer });
    await waitFor(() => {
      expect(screen.getByAltText("Preview")).toBeInTheDocument();
    });

    expect(setComponentPropertyMock).toHaveBeenCalledWith(
      defaultProps.propertyKey,
      "data:image/jpeg;base64,dummyData",
    );
  });
});
