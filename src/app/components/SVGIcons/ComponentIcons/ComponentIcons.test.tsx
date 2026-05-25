import AccordionIcon from "./Accordion";
import { render } from "@testing-library/react";
import ButtonIcon from "./Button";
import CheckboxIcon from "./Checkbox";
import ConditionBuilderIcon from "./ConditionBuilder";
import DataPanelIcon from "./DataPanel";
import TableIcon from "./Table";
import DateIcon from "./Date";
import DividerIcon from "./Divider";
import DomainIcon from "./Domain";
import FileUploadIcon from "./FileUpload";
import FormIcon from "./Form";
import FormGridIcon from "./FormGrid";
import HeadingIcon from "./Heading";
import HiddenFieldIcon from "./HiddenField";
import ImageIcon from "./Image";
import ImageCaptureIcon from "./ImageCapture";
import InputFieldIcon from "./InputField";
import MapIcon from "./Map";
import MultiSelectIcon from "./MultiSelect";
import PlaceholderIcon from "./Placeholder";
import RadioButtonsIcon from "./RadioButtons";
import RepeatableSectionIcon from "./RepeatableSection";
import RoutePlanIcon from "./RoutePlan";
import SectionIcon from "./Section";
import SelectIcon from "./Select";
import SliderIcon from "./Slider";
import SpacerIcon from "./Spacer";
import StackIcon from "./Stack";
import StepperIcon from "./Stepper";
import TabsIcon from "./Tabs";
import TextAreaIcon from "./TextArea";
import ToggleIcon from "./Toggle";
import TransferListIcon from "./TransferList";
import TreeStructureIcon from "./TreeStructure";
import TypographyIcon from "./Typography";

const iconComponents = [
  { name: "AccordionIcon", Component: AccordionIcon },
  { name: "ButtonIcon", Component: ButtonIcon },
  { name: "CheckboxIcon", Component: CheckboxIcon },
  { name: "ConditionBuilderIcon", Component: ConditionBuilderIcon },
  { name: "DataPanelIcon", Component: DataPanelIcon },
  { name: "TableIcon", Component: TableIcon },
  { name: "DateIcon", Component: DateIcon },
  { name: "DividerIcon", Component: DividerIcon },
  { name: "DomainIcon", Component: DomainIcon },
  { name: "FileUploadIcon", Component: FileUploadIcon },
  { name: "FormIcon", Component: FormIcon },
  { name: "FormGridIcon", Component: FormGridIcon },
  { name: "HeadingIcon", Component: HeadingIcon },
  { name: "HiddenFieldIcon", Component: HiddenFieldIcon },
  { name: "ImageIcon", Component: ImageIcon },
  { name: "ImageCaptureIcon", Component: ImageCaptureIcon },
  { name: "InputFieldIcon", Component: InputFieldIcon },
  { name: "MapIcon", Component: MapIcon },
  { name: "MultiSelectIcon", Component: MultiSelectIcon },
  { name: "PlaceholderIcon", Component: PlaceholderIcon },
  { name: "RadioButtonsIcon", Component: RadioButtonsIcon },
  { name: "RepeatableSectionIcon", Component: RepeatableSectionIcon },
  { name: "RoutePlanIcon", Component: RoutePlanIcon },
  { name: "SectionIcon", Component: SectionIcon },
  { name: "SelectIcon", Component: SelectIcon },
  { name: "SliderIcon", Component: SliderIcon },
  { name: "SpacerIcon", Component: SpacerIcon },
  { name: "StackIcon", Component: StackIcon },
  { name: "StepperIcon", Component: StepperIcon },
  { name: "TabsIcon", Component: TabsIcon },
  { name: "TextAreaIcon", Component: TextAreaIcon },
  { name: "ToggleIcon", Component: ToggleIcon },
  { name: "TransferListIcon", Component: TransferListIcon },
  { name: "TreeStructureIcon", Component: TreeStructureIcon },
  { name: "TypographyIcon", Component: TypographyIcon },
];

describe("ComponentIcons", () => {
  describe.each(iconComponents)("$name", ({ Component }) => {
    it("renders without crashing", () => {
      const { container } = render(<Component />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });
});
