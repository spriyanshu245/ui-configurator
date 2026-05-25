"use client";

import {
  CheckboxGroupComponent,
  ComponentGroup,
  CustomFormInputComponent,
  FormComponent,
  FormInputComponent,
  FormRowComponent,
  HeadingComponent,
  ImageComponent,
  InputComponent,
  InputTableComponent,
  TypographComponent,
  RadioGroupComponent,
  SelectComponent,
  SpacerComponent,
  SubSectionComponent,
  TableComponent,
  UIComponent,
  DataGridComponent,
  TabsComponent,
  ToggleButtonComponent,
  InputGridComponent,
  HiddenFieldComponent,
  ButtonV2Component,
  FileUploadComponent,
  ContactComponent,
  StackComponent,
  MultiSelectComponent,
  FinancialDetailsComponent,
  TransferListComponent,
  DividerComponent,
  TextAreaComponent,
  TreeStructureComponent,
  ImageCaptureComponent,
  ConditionBuilderComponent,
  MapsComponent,
  RoutePlanComponent,
  AccordionGroupComponent,
  StepperComponent,
  TimeInputComponent,
  CollectionDashboardTableComponent,
} from "../../types/types";
import styles from "./ComponentRenderer.module.scss";
import sharedStyles from "./../../styles/shared.module.scss";
import { useDragContext } from "@/app/context/DragContext";
import Form from "../UIComponents/NewForm/Form";
import { getComponentTitle } from "@/app/data/availableComponents";
import { getComponentRendererIcon } from "@/app/data/componentRendererIconResolver";
import {
  resetGhostImage,
  convertHyphenSeparatedToPascalCase,
} from "@/app/utils/utils";
import { applyCustomDragPreview } from "@/app/utils/dragPreview";
import Input from "../UIComponents/Input/Input";
import CheckboxGroup from "../UIComponents/CheckboxGroup/CheckboxGroup";
import Select from "../UIComponents/Select/Select";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import Heading from "../UIComponents/Heading/Heading";
import CustomImage from "../UIComponents/CustomImage/CustomImage";
import { useAutoScroll } from "@/app/hooks/useAutoScroll";
import Typograph from "../UIComponents/Typograph/Typograph";
import RadioGroup from "../UIComponents/RadioGroup/RadioGroup";
import SubSection from "../UIComponents/SubSection/SubSection";
import FormRow from "../UIComponents/FormRow/FormRow";
import DatePicker from "../UIComponents/DatePicker/DatePicker";
import Spacer from "../UIComponents/Spacer/Spacer";
import Table from "../UIComponents/Table/Table";
import InputTable from "../UIComponents/InputTable/InputTable";
import DataGrid from "../UIComponents/DataGrid/DataGrid";
import Tabs from "../UIComponents/Tabs/Tabs";
import ToggleSwitch from "../ToggleSwitch/ToggleSwitch";
import InputGrid from "../UIComponents/InputGrid/InputGrid";
import HiddenField from "../UIComponents/HiddenField/HiddenField";
import ButtonV2 from "../UIComponents/ButtonV2/ButtonV2";
import FileUpload from "../UIComponents/FileUpload/FileUpload";
import Questionnaire from "../UIComponents/Questionnaire/Questionnaire";
import Contact from "../UIComponents/Contact/Contact";
import Stack from "../UIComponents/Stack/Stack";
import WorkflowStage from "../UIComponents/WorkflowStage/WorkflowStage";
import MultiSelect from "../UIComponents/MultiSelect/MultiSelect";
import FinancialDetails from "../UIComponents/FinancialDetails/FinancialDetails";
import TransferList from "../UIComponents/TransferList/TransferList";
import Divider from "../UIComponents/Divider/Divider";
import TextArea from "../UIComponents/TextArea/TextArea";
import ExternalIntegration from "../UIComponents/ExternalIntegration/ExternalIntegration";
import TreeStructure from "../UIComponents/TreeComponent/TreeCompoent";
import ImageCapture from "../UIComponents/ImageCapture/ImageCapture";
import PaymentCheckout from "../UIComponents/PaymentCheckout/PaymentCheckout";
import ConditionBuilder from "../UIComponents/ConditionBuilder/ConditionBuilder";
import Maps from "../UIComponents/Maps/Maps";
import RoutePlan from "../UIComponents/RoutePlan/RoutePlan";
import AccordionGroup from "../UIComponents/AccordionGroup/AccordionGroup";
import Stepper from "../UIComponents/Stepper/Stepper";
import NumericSlider from "../UIComponents/NumericSlider/NumericSlider";
import TimeInput from "../UIComponents/TimeInput/TimeInput";
import CollectionDashboardTable from "../UIComponents/CollectionDashboardTable/CollectionDashboardTable";

interface ComponentRendererProps {
  readonly component:
    | UIComponent
    | CustomFormInputComponent
    | FormInputComponent
    | ComponentGroup;
}

export default function ComponentRenderer({
  component,
}: Readonly<ComponentRendererProps>) {
  const {
    isDragging,
    setIsDragging,
    setIsDraggingComponent,
    setIsDraggingFormElement,
    draggingComponentId,
    setDraggingComponentId,
    setIsFormRowValidation,
  } = useDragContext();

  useAutoScroll(isDragging);
  const { propertyComponentId, setActiveComponent } = usePropertyPane();
  const ComponentIcon = getComponentRendererIcon(component.type);
  const componentTitle =
    getComponentTitle(component.type) ??
    convertHyphenSeparatedToPascalCase(component.type);

  const createRendererDragPreview = (sourceEl: HTMLElement) => {
    const previewEl = document.createElement("div");
    previewEl.classList.add(sharedStyles.ghost);

    const previewAnchor = sourceEl.querySelector(
      "[data-renderer-preview-anchor='true']",
    );
    if (previewAnchor instanceof HTMLElement) {
      const { top, left } = previewAnchor.getBoundingClientRect();
      previewEl.style.top = `${top}px`;
      previewEl.style.left = `${left}px`;
    }

    const ghostIcon = document.createElement("div");
    ghostIcon.classList.add(sharedStyles.ghostIcon);
    const rendererIcon = sourceEl.querySelector("[data-renderer-icon='true']");
    if (rendererIcon instanceof HTMLElement) {
      ghostIcon.appendChild(rendererIcon.cloneNode(true));
    }

    const ghostLabel = document.createElement("div");
    ghostLabel.classList.add(sharedStyles.ghostLabel);
    ghostLabel.textContent = componentTitle;

    previewEl.appendChild(ghostIcon);
    previewEl.appendChild(ghostLabel);

    return previewEl;
  };

  const handleDragStart = (e: React.DragEvent<HTMLElement>) => {
    e.stopPropagation();
    applyCustomDragPreview({
      event: e,
      sourceEl: e.currentTarget,
      createPreview: createRendererDragPreview,
    });

    if (component.category === "component") {
      setIsDraggingComponent(true);
      setDraggingComponentId(component.id);
    } else if (component.category === "form") {
      setIsDraggingFormElement(true);
      component.type === "form-row"
        ? setIsFormRowValidation(true)
        : setIsFormRowValidation(false);
      setDraggingComponentId(component.id);
    }
    e?.dataTransfer?.setData(
      "application/json",
      JSON.stringify({
        ...component,
        isComponent: component.category === "component",
        isFormElement: component.category === "form",
      }),
    );
    setIsDragging(true);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLElement>) => {
    e.stopPropagation();
    setIsDraggingComponent(false);
    setIsDraggingFormElement(false);
    setIsFormRowValidation(false);
    setDraggingComponentId(null);
    setIsDragging(false);
    resetGhostImage();
  };

  const renderComponent = () => {
    switch (component.type) {
      case "external-integration":
        return (
          <ExternalIntegration
            component={component as any}
            key={component.id}
          />
        );
      case "heading":
        return (
          <Heading
            component={component as HeadingComponent}
            key={component.id}
          />
        );

      case "typograph":
      case "form-typograph":
        return (
          <Typograph
            component={component as TypographComponent}
            key={component.id}
          />
        );

      case "form":
        return (
          <Form component={component as FormComponent} key={component.id} />
        );

      case "form-row":
        return (
          <FormRow
            component={component as FormRowComponent}
            key={component.id}
          />
        );

      case "select":
        return (
          <Select component={component as SelectComponent} key={component.id} />
        );

      case "image":
        return (
          <CustomImage
            component={component as ImageComponent}
            key={component.id}
          />
        );

      case "input":
        return (
          <Input component={component as InputComponent} key={component.id} />
        );
      case "text-area":
        return (
          <TextArea
            component={component as TextAreaComponent}
            key={component.id}
          />
        );

      case "checkbox-group":
        return (
          <CheckboxGroup
            component={component as CheckboxGroupComponent}
            key={component.id}
          />
        );

      case "toggle-button":
        return (
          <ToggleSwitch
            component={component as ToggleButtonComponent}
            key={component.id}
          ></ToggleSwitch>
        );

      case "radio-group":
        return (
          <RadioGroup
            component={component as RadioGroupComponent}
            key={component.id}
          />
        );

      case "sub-section":
      case "form-sub-section":
      case "repeatable-sub-section":
        return (
          <SubSection
            component={component as SubSectionComponent}
            key={component.id}
          />
        );

      case "date":
        return (
          <DatePicker
            component={component as InputComponent}
            key={component.id}
          />
        );

      case "table":
        return (
          <Table component={component as TableComponent} key={component.id} />
        );

      case "spacer":
        return (
          <Spacer component={component as SpacerComponent} key={component.id} />
        );

      case "divider":
        return (
          <Divider
            component={component as DividerComponent}
            key={component.id}
          />
        );

      case "input-table":
        return (
          <InputTable
            component={component as InputTableComponent}
            key={component.id}
          />
        );

      case "data-grid":
        return (
          <DataGrid
            component={component as DataGridComponent}
            key={component.id}
          />
        );

      case "tabs":
        return (
          <Tabs component={component as TabsComponent} key={component.id} />
        );

      case "input-grid":
        return (
          <InputGrid
            component={component as InputGridComponent}
            key={component.id}
          />
        );

      case "hidden-field":
        return (
          <HiddenField
            component={component as HiddenFieldComponent}
            key={component.id}
          />
        );
      case "button-v2":
        return (
          <ButtonV2
            component={component as ButtonV2Component}
            key={component.id}
          />
        );

      case "multi-action-cta":
        return (
          <ButtonV2
            component={component as unknown as ButtonV2Component}
            key={component.id}
          />
        );

      case "file-upload":
        return (
          <FileUpload
            component={component as FileUploadComponent}
            key={component.id}
          />
        );

      case "questionnaire":
        return <Questionnaire key={component.id} />;

      case "contact":
        return (
          <Contact
            key={component.id}
            component={component as ContactComponent}
          />
        );

      case "stack":
        return (
          <Stack component={component as StackComponent} key={component.id} />
        );

      case "workflow-stage":
        return <WorkflowStage key={component.id} />;

      case "multi-select":
        return (
          <MultiSelect
            component={component as MultiSelectComponent}
            key={component.id}
          />
        );

      case "financial-details":
        return (
          <FinancialDetails
            component={component as FinancialDetailsComponent}
            key={component.id}
          />
        );

      case "transfer-list":
        return <TransferList component={component as TransferListComponent} />;

      case "tree-structure":
        return (
          <TreeStructure component={component as TreeStructureComponent} />
        );

      case "image-capture":
        return <ImageCapture component={component as ImageCaptureComponent} />;

      case "payment-checkout":
        return <PaymentCheckout key={component.id} />;

      case "condition-builder":
        return (
          <ConditionBuilder
            key={component.id}
            component={component as ConditionBuilderComponent}
          />
        );
      case "maps":
        return (
          <Maps key={component.id} component={component as MapsComponent} />
        );

      case "route-plan":
        return (
          <RoutePlan
            key={component.id}
            component={component as RoutePlanComponent}
          />
        );

      case "numeric-slider":
        return (
          <NumericSlider
            key={component.id}
            component={component as FormInputComponent}
          />
        );

      case "accordion-group":
        return (
          <AccordionGroup
            key={component.id}
            component={component as AccordionGroupComponent}
          />
        );

      case "stepper":
        return (
          <Stepper
            key={component.id}
            component={component as StepperComponent}
          />
        );
      case "time":
        return (
          <TimeInput component={component as TimeInputComponent}/>
        );

      case "collection-dashboard-table":
        return (
          <CollectionDashboardTable
            component={component as CollectionDashboardTableComponent}
            key={component.id}
          />
        );

      default:
        return (
          <div key={component.id} className={styles.unknownComponent}>
            {`Custom component type "${component.type}" is not recognized.`}
          </div>
        );
    }
  };

  const componentWrapperClassName = `${styles.componentWrapper}
  ${
    ((component as ComponentGroup).components?.length ?? 0) > 0 &&
    styles.componentGroup
  }
  ${component.category === "form" && styles.formComponentWrapper}
  ${draggingComponentId === component.id && styles.dragging}
  ${propertyComponentId === component.id && styles.active}`;

  return (
    <div
      role="presentation"
      className={componentWrapperClassName}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        setActiveComponent(component.id);
      }}
      data-testid="component-renderer"
    >
      <div
        className={styles.componentTypeContainer}
        data-renderer-preview-anchor="true"
      >
        <div className={styles.componentIcon}>
          <div className={styles.iconSvgContainer} data-renderer-icon="true">
            <ComponentIcon />
          </div>
        </div>
        <span className={styles.componentType}>{componentTitle}</span>
      </div>
      {renderComponent()}
    </div>
  );
}
