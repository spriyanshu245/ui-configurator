"use client";
import { createContext, useContext, useState, ReactNode } from "react";

interface DragContextType {
  isDragging: boolean;
  setIsDragging: (value: boolean) => void;
  isDraggingComponent: boolean;
  setIsDraggingComponent: (value: boolean) => void;
  isDraggingFormElement: boolean;
  setIsDraggingFormElement: (value: boolean) => void;
  draggingComponentId: string | null;
  setDraggingComponentId: (id: string | null) => void;
  isFormRowValidation: boolean;
  setIsFormRowValidation: (value: boolean) => void;

}

const DragContext = createContext<DragContextType | undefined>(undefined);

interface DragProviderProps {
  children: ReactNode;
}

export const DragProvider = ({ children }: DragProviderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingComponent, setIsDraggingComponent] = useState(false);
  const [isDraggingFormElement, setIsDraggingFormElement] = useState(false);
  const [draggingComponentId, setDraggingComponentId] = useState<string | null>(
    null
  );
  const [isFormRowValidation, setIsFormRowValidation] = useState(false);



  return (
    <DragContext.Provider
      value={{
        isDragging,
        setIsDragging,
        isDraggingComponent,
        setIsDraggingComponent,
        isDraggingFormElement,
        setIsDraggingFormElement,
        draggingComponentId,
        setDraggingComponentId,
        isFormRowValidation,
        setIsFormRowValidation
      }}
    >
      {children}
    </DragContext.Provider>
  );
};

export const useDragContext = (): DragContextType => {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error("useDragContext must be used within a DragProvider");
  }
  return context;
};
