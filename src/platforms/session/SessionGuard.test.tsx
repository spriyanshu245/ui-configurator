import { render, screen } from "@testing-library/react";
import SessionGuard from "./SessionGuard";
import { SessionState } from "./enums";

const mockRouterReplace = jest.fn();
let mockPathname = "/dashboard";
let mockState = SessionState.ACTIVE;

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
  usePathname: () => mockPathname,
}));

jest.mock("./useSession", () => ({
  useSession: () => ({ state: mockState }),
}));

jest.mock("@/app/components/SVGIcons/SpinningLoader", () => () => (
  <span data-testid="spinning-loader">loading</span>
));

describe("SessionGuard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/dashboard";
    mockState = SessionState.ACTIVE;
  });

  it("renders children when session is active", () => {
    render(
      <SessionGuard>
        <div>Protected content</div>
      </SessionGuard>,
    );
    expect(screen.getByText("Protected content")).toBeInTheDocument();
    expect(screen.queryByTestId("spinning-loader")).not.toBeInTheDocument();
  });

  it("renders spinner when session state is CHECKING", () => {
    mockState = SessionState.CHECKING;
    render(
      <SessionGuard>
        <div>Protected content</div>
      </SessionGuard>,
    );
    expect(screen.getByTestId("spinning-loader")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("redirects to /login when session is LOGGED_OUT and path is not /customers", () => {
    mockState = SessionState.LOGGED_OUT;
    mockPathname = "/dashboard";
    render(
      <SessionGuard>
        <div>Protected content</div>
      </SessionGuard>,
    );
    expect(mockRouterReplace).toHaveBeenCalledWith("/login");
  });

  it("does not redirect when session is LOGGED_OUT but path includes /customers", () => {
    mockState = SessionState.LOGGED_OUT;
    mockPathname = "/customers/123";
    render(
      <SessionGuard>
        <div>Protected content</div>
      </SessionGuard>,
    );
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });
});
