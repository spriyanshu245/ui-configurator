import { ComponentType } from "react";
import AccordionIcon from "@/app/components/SVGIcons/ComponentIcons/Accordion";
import ButtonIcon from "@/app/components/SVGIcons/ComponentIcons/Button";
import CheckboxIcon from "@/app/components/SVGIcons/ComponentIcons/Checkbox";
import ConditionBuilderIcon from "@/app/components/SVGIcons/ComponentIcons/ConditionBuilder";
import DataPanelIcon from "@/app/components/SVGIcons/ComponentIcons/DataPanel";
import DateIcon from "@/app/components/SVGIcons/ComponentIcons/Date";
import DividerIcon from "@/app/components/SVGIcons/ComponentIcons/Divider";
import DomainIcon from "@/app/components/SVGIcons/ComponentIcons/Domain";
import FileUploadIcon from "@/app/components/SVGIcons/ComponentIcons/FileUpload";
import FormIcon from "@/app/components/SVGIcons/ComponentIcons/Form";
import FormGridIcon from "@/app/components/SVGIcons/ComponentIcons/FormGrid";
import HeadingIcon from "@/app/components/SVGIcons/ComponentIcons/Heading";
import HiddenFieldIcon from "@/app/components/SVGIcons/ComponentIcons/HiddenField";
import ImageCaptureIcon from "@/app/components/SVGIcons/ComponentIcons/ImageCapture";
import ImageIcon from "@/app/components/SVGIcons/ComponentIcons/Image";
import InputFieldIcon from "@/app/components/SVGIcons/ComponentIcons/InputField";
import MapIcon from "@/app/components/SVGIcons/ComponentIcons/Map";
import MultiSelectIcon from "@/app/components/SVGIcons/ComponentIcons/MultiSelect";
import RadioButtonsIcon from "@/app/components/SVGIcons/ComponentIcons/RadioButtons";
import RepeatableSectionIcon from "@/app/components/SVGIcons/ComponentIcons/RepeatableSection";
import RoutePlanIcon from "@/app/components/SVGIcons/ComponentIcons/RoutePlan";
import SectionIcon from "@/app/components/SVGIcons/ComponentIcons/Section";
import SelectIcon from "@/app/components/SVGIcons/ComponentIcons/Select";
import SliderIcon from "@/app/components/SVGIcons/ComponentIcons/Slider";
import SpacerIcon from "@/app/components/SVGIcons/ComponentIcons/Spacer";
import StackIcon from "@/app/components/SVGIcons/ComponentIcons/Stack";
import StepperIcon from "@/app/components/SVGIcons/ComponentIcons/Stepper";
import TableIcon from "@/app/components/SVGIcons/ComponentIcons/Table";
import TabsIcon from "@/app/components/SVGIcons/ComponentIcons/Tabs";
import TextAreaIcon from "@/app/components/SVGIcons/ComponentIcons/TextArea";
import ToggleIcon from "@/app/components/SVGIcons/ComponentIcons/Toggle";
import TransferListIcon from "@/app/components/SVGIcons/ComponentIcons/TransferList";
import TreeStructureIcon from "@/app/components/SVGIcons/ComponentIcons/TreeStructure";
import TypographyIcon from "@/app/components/SVGIcons/ComponentIcons/Typography";
import TimeIcon from "../components/SVGIcons/ComponentIcons/Time";

export const componentPaneIconMap: Record<string, ComponentType> = {
  typograph: TypographyIcon,
  "sub-section": SectionIcon,
  spacer: SpacerIcon,
  divider: DividerIcon,
  "accordion-group": AccordionIcon,
  stepper: StepperIcon,
  table: TableIcon,
  "data-grid": DataPanelIcon,
  "input-grid": FormGridIcon,
  "button-v2": ButtonIcon,
  "multi-action-cta": ButtonIcon,
  stack: StackIcon,
  image: ImageIcon,
  "tree-structure": TreeStructureIcon,
  "external-integration": DomainIcon,
  heading: HeadingIcon,
  form: FormIcon,
  tabs: TabsIcon,
  "workflow-stage": DomainIcon,
  "payment-checkout": DomainIcon,
  input: InputFieldIcon,
  "text-area": TextAreaIcon,
  select: SelectIcon,
  "multi-select": MultiSelectIcon,
  "checkbox-group": CheckboxIcon,
  "toggle-button": ToggleIcon,
  "radio-group": RadioButtonsIcon,
  contact: DomainIcon,
  "repeatable-sub-section": RepeatableSectionIcon,
  "input-table": TableIcon,
  date: DateIcon,
  "hidden-field": HiddenFieldIcon,
  "file-upload": FileUploadIcon,
  questionnaire: DomainIcon,
  "financial-details": DomainIcon,
  "transfer-list": TransferListIcon,
  "image-capture": ImageCaptureIcon,
  "condition-builder": ConditionBuilderIcon,
  maps: MapIcon,
  "route-plan": RoutePlanIcon,
  "numeric-slider": SliderIcon,
  time: TimeIcon,
  "collection-dashboard-table": DomainIcon,
};
