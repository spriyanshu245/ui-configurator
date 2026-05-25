import { render, screen, act, fireEvent } from "@testing-library/react";
import { Suspense } from "react";

const mockParams = { portalTaskCode: "test-task" };

const mockUseConfigDetail = jest.fn(() => ({
  config: null,
  loading: false,
  error: null,
  saveConfig: jest.fn(),
}));

jest.mock("@/app/hooks/useConfigDetail", () => ({
  useConfigDetail: (...args: unknown[]) => mockUseConfigDetail(...args),
}));

jest.mock("@/app/services/portalTaskServices", () => ({
  getPortalTaskConfig: jest.fn(),
  updatePortalTaskConfig: jest.fn().mockResolvedValue({}),
}));

jest.mock("@/app/services/microsite.service", () => ({
  fetchMicrositeDSLBySlug: jest.fn(),
}));

jest.mock("@/app/utils/accessControlUtils", () => ({
  convertDSLToBaseConfig: jest.fn().mockResolvedValue({}),
  mapToBaseConfig: jest.fn().mockReturnValue({}),
}));

jest.mock("@/app/components/BaseConfigDetailPage/BaseConfigDetailPage", () => ({
  __esModule: true,
  default: jest.fn((props: Record<string, unknown>) => (
    <div data-testid="base-detail-page">
      <span data-testid="title">{props.title as string}</span>
      <span data-testid="code">{props.code as string}</span>
      <span data-testid="list-route">{props.listRoute as string}</span>
      <button
        data-testid="save-btn"
        onClick={() => (props.onSave as (c: unknown) => void)({})}
      >
        Save
      </button>
    </div>
  )),
}));

jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return {
    ...actual,
    use: jest.fn(() => mockParams),
  };
});

import PortalTaskDetailPage from "./page";
import { updatePortalTaskConfig } from "@/app/services/portalTaskServices";
import {
  convertDSLToBaseConfig,
  mapToBaseConfig,
} from "@/app/utils/accessControlUtils";

const mockedUpdatePortalTaskConfig =
  updatePortalTaskConfig as jest.MockedFunction<typeof updatePortalTaskConfig>;
const mockedConvertDSL = convertDSLToBaseConfig as jest.MockedFunction<
  typeof convertDSLToBaseConfig
>;
const mockedMapToBaseConfig = mapToBaseConfig as jest.MockedFunction<
  typeof mapToBaseConfig
>;

const renderPage = async () => {
  const params = Promise.resolve(mockParams);
  render(
    <Suspense fallback={<div>Loading...</div>}>
      <PortalTaskDetailPage params={params} />
    </Suspense>,
  );
  await act(async () => {
    await Promise.resolve();
  });
};

describe("PortalTaskDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseConfigDetail.mockReturnValue({
      config: null,
      loading: false,
      error: null,
      saveConfig: jest.fn(),
    });
  });

  it("should render with correct title", async () => {
    await renderPage();
    expect(screen.getByTestId("title")).toHaveTextContent(
      "Portal Task Configurations",
    );
  });

  it("should pass listRoute to BaseConfigDetailPage", async () => {
    await renderPage();
    expect(screen.getByTestId("list-route")).toHaveTextContent("/portal-tasks");
  });

  it("should pass decoded code to BaseConfigDetailPage", async () => {
    await renderPage();
    expect(screen.getByTestId("code")).toHaveTextContent("test-task");
  });

  it("should call updatePortalTaskConfig when onSave is triggered", async () => {
    await renderPage();
    fireEvent.click(screen.getByTestId("save-btn"));
    expect(mockedUpdatePortalTaskConfig).toHaveBeenCalledWith("test-task", {});
  });

  it("should pass convertDSL callback that calls convertDSLToBaseConfig", async () => {
    await renderPage();
    const callArgs = mockUseConfigDetail.mock.calls[0][0] as {
      convertDSL: (dsl: unknown) => unknown;
    };
    const mockDsl = { code: "test", version: 1, pages: [] };
    callArgs.convertDSL(mockDsl);
    expect(mockedConvertDSL).toHaveBeenCalledWith(mockDsl, {
      portalTaskConfigCode: "",
    });
  });

  it("should pass mapFromApi callback that calls mapToBaseConfig", async () => {
    await renderPage();
    const callArgs = mockUseConfigDetail.mock.calls[0][0] as {
      mapFromApi: (data: unknown) => unknown;
    };
    const mockData = { portalTaskConfigCode: "task-code-1" };
    callArgs.mapFromApi(mockData);
    expect(mockedMapToBaseConfig).toHaveBeenCalledWith(mockData, {
      portalTaskConfigCode: "task-code-1",
    });
  });

  it("should use useConfigDetail hook with correct initial arguments", async () => {
    await renderPage();
    expect(mockUseConfigDetail).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "test-task",
      }),
    );
  });
});
