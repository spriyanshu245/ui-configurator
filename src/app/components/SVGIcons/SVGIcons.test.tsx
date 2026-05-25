import { render } from "@testing-library/react";
import Add from "./Add";
import All from "./All";
import ArrowFancyRight from "./ArrowFancyRight";
import ArrowUp from "./ArrowUp";
import Bin from "./Bin";
import Camera from "./Camera";
import ChevronDown from "./ChevronDown";
import ChevronDownSolid from "./ChevronDownSolid";
import ChevronRight from "./ChevronRight";
import ChevronUpSolid from "./ChevronUpSolid";
import Close from "./Close";
import ConfigurePage from "./ConfigurePage";
import Copy from "./Copy";
import Delete from "./Delete";
import Desktop from "./Desktop";
import DragHandle from "./DragHandle";
import Edit from "./Edit";
import EditIcon from "./EditIcon";
import Exclamation from "./Exclamation";
import Exit from "./Exit";
import Export from "./Export";
import FileUploadIcon from "./FileUploadIcon";
import Globe from "./Globe";
import GridViewIcon from "./GridView";
import Import from "./Import";
import Layers from "./Layers";
import ListViewIcon from "./ListView";
import Lock from "./Lock";
import Menu from "./Menu";
import Microsite from "./Microsite";
import Mobile from "./Mobile";
import Plus from "./Plus";
import Preview from "./Preview";
import Rahi from "./Rahi";
import Redo from "./Redo";
import Refresh from "./Refresh";
import Rules from "./Rules";
import Save from "./Save";
import Search from "./Search";
import Settings from "./Settings";
import Success from "./Success";
import Template from "./Template";
import ThreeDotMenu from "./ThreeDotMenu";
import ThreeDotMenuHorizontal from "./ThreeDotMenuHorizontal";
import Undo from "./Undo";
import Workflow from "./Workflow";
import NewIcon from "./New";
import RuleIcon from "./RuleIcon";
import LockFilledIcon from "./LockFilled";
import UnlockIcon from "./Unlock";
import UnlockFilledIcon from "./UnlockFilled";

import {
  DigioKYCIcon,
  PANVerificationIcon,
  AadhaarVerificationIcon,
  AccountAggregatorIcon,
  MandateRegistrationIcon,
  DefaultExternalIntegrationIcon,
  OfflineKYCIcon,
} from "./ExternalIntegrationIcons";

const iconComponents = [
  { name: "Add", Component: Add },
  { name: "All", Component: All },
  { name: "ArrowFancyRight", Component: ArrowFancyRight },
  { name: "ArrowUp", Component: ArrowUp },
  { name: "Bin", Component: Bin },
  { name: "Camera", Component: Camera },
  { name: "ChevronDown", Component: ChevronDown },
  { name: "ChevronDownSolid", Component: ChevronDownSolid },
  { name: "ChevronRight", Component: ChevronRight },
  { name: "ChevronUpSolid", Component: ChevronUpSolid },
  { name: "Close", Component: Close },
  { name: "ConfigurePage", Component: ConfigurePage },
  { name: "Copy", Component: Copy },
  { name: "Delete", Component: Delete },
  { name: "Desktop", Component: Desktop },
  { name: "DragHandle", Component: DragHandle },
  { name: "Edit", Component: Edit },
  { name: "EditIcon", Component: EditIcon },
  { name: "Exclamation", Component: Exclamation },
  { name: "Exit", Component: Exit },
  { name: "Export", Component: Export },
  { name: "FileUploadIcon", Component: FileUploadIcon },
  { name: "Globe", Component: Globe },
  { name: "GridViewIcon", Component: GridViewIcon },
  { name: "Import", Component: Import },
  { name: "Layers", Component: Layers },
  { name: "ListViewIcon", Component: ListViewIcon },
  { name: "Lock", Component: Lock },
  { name: "Menu", Component: Menu },
  { name: "Microsite", Component: Microsite },
  { name: "Mobile", Component: Mobile },
  { name: "Plus", Component: Plus },
  { name: "Preview", Component: Preview },
  { name: "Rahi", Component: Rahi },
  { name: "Redo", Component: Redo },
  { name: "Refresh", Component: Refresh },
  { name: "Rules", Component: Rules },
  { name: "Save", Component: Save },
  { name: "Search", Component: Search },
  { name: "Settings", Component: Settings },
  { name: "Success", Component: Success },
  { name: "Template", Component: Template },
  { name: "ThreeDotMenu", Component: ThreeDotMenu },
  { name: "ThreeDotMenuHorizontal", Component: ThreeDotMenuHorizontal },
  { name: "Undo", Component: Undo },
  { name: "Workflow", Component: Workflow },
  { name: "RuleIcon", Component: RuleIcon },
  { name: "DigioKYCIcon", Component: DigioKYCIcon },
  { name: "PANVerificationIcon", Component: PANVerificationIcon },
  { name: "AadhaarVerificationIcon", Component: AadhaarVerificationIcon },
  { name: "AccountAggregatorIcon", Component: AccountAggregatorIcon },
  { name: "MandateRegistrationIcon", Component: MandateRegistrationIcon },
  { name: "NewIcon", Component: NewIcon },
  { name: "LockFilledIcon", Component: LockFilledIcon },
  { name: "UnlockIcon", Component: UnlockIcon },
  { name: "UnlockFilledIcon", Component: UnlockFilledIcon },
  {
    name: "DefaultExternalIntegrationIcon",
    Component: DefaultExternalIntegrationIcon,
  },
  { name: "OfflineKYCIcon", Component: OfflineKYCIcon },
];

describe("SVGIcons", () => {
  describe.each(iconComponents)("$name", ({ Component }) => {
    it("renders without crashing", () => {
      const { container } = render(<Component />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });
});
