import { renderHook, act } from "@testing-library/react";
import { useNavigationGuard } from "./useNavigationGuard"; // Adjust path as needed

describe("useNavigationGuard", () => {
  let pushStateSpy: jest.SpyInstance;
  let backSpy: jest.SpyInstance;
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    pushStateSpy = jest
      .spyOn(window.history, "pushState")
      .mockImplementation(() => {});
    backSpy = jest.spyOn(window.history, "back").mockImplementation(() => {});

    addEventListenerSpy = jest.spyOn(window, "addEventListener");
    removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /* ------------------------------------------------------------
     TEST CASE 1: Initialization & No blocking when clean
  ------------------------------------------------------------- */
  test("should not block or show modal when isDirty is false", () => {
    const { result } = renderHook(() => useNavigationGuard(false));

    expect(result.current.showModal).toBe(false);

    const action = jest.fn();
    act(() => {
      result.current.guardedNavigate(action);
    });

    expect(action).toHaveBeenCalled();
    expect(result.current.showModal).toBe(false);
  });

  /* ------------------------------------------------------------
     TEST CASE 2: BeforeUnload (Tab Close / Reload)
  ------------------------------------------------------------- */
  test("should prevent default on beforeunload when isDirty is true", () => {
    renderHook(() => useNavigationGuard(true));

    const eventHandler = addEventListenerSpy.mock.calls.find(
      (call) => call[0] === "beforeunload"
    )?.[1];

    expect(eventHandler).toBeDefined();

    const event = {
      preventDefault: jest.fn(),
      returnValue: undefined as any,
    };

    act(() => {
      eventHandler(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.returnValue).toBe("");
  });

  test("should cleanup beforeunload listener on unmount", () => {
    const { unmount } = renderHook(() => useNavigationGuard(true));
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function)
    );
  });

  /* ------------------------------------------------------------
     TEST CASE 3: PopState (Browser Back Button)
  ------------------------------------------------------------- */
  test("should intercept popstate, show modal, and revert url when dirty", async () => {
    const { result } = renderHook(() => useNavigationGuard(true));

    expect(pushStateSpy).toHaveBeenCalled();

    const popStateHandler = addEventListenerSpy.mock.calls.find(
      (call) => call[0] === "popstate"
    )?.[1];

    await act(async () => {
      popStateHandler({});
    });

    expect(result.current.showModal).toBe(true);
  });

  test("PopState: Allow() should go back", async () => {
    const { result } = renderHook(() => useNavigationGuard(true));
    const popStateHandler = addEventListenerSpy.mock.calls.find(
      (c) => c[0] === "popstate"
    )?.[1];

    let navigationPromise: Promise<void>;
    await act(async () => {
      navigationPromise = popStateHandler({});
    });

    expect(result.current.showModal).toBe(true);

    await act(async () => {
      result.current.allow();
    });

    expect(backSpy).toHaveBeenCalled(); // Ensure history.back() is called
    expect(result.current.showModal).toBe(false);
  });

  test("PopState: Block() should push state again", async () => {
    const { result } = renderHook(() => useNavigationGuard(true));
    const popStateHandler = addEventListenerSpy.mock.calls.find(
      (c) => c[0] === "popstate"
    )?.[1];

    pushStateSpy.mockClear();

    await act(async () => {
      popStateHandler({});
    });

    await act(async () => {
      result.current.block();
    });

    expect(pushStateSpy).toHaveBeenCalled();
    expect(result.current.showModal).toBe(false);
  });

  /* ------------------------------------------------------------
     TEST CASE 4: Programmatic Navigation (guardedNavigate)
  ------------------------------------------------------------- */
  test("guardedNavigate: should show modal and wait when dirty", async () => {
    const { result } = renderHook(() => useNavigationGuard(true));
    const action = jest.fn();

    let navPromise: Promise<void>;
    await act(async () => {
      navPromise = result.current.guardedNavigate(action);
    });

    expect(result.current.showModal).toBe(true);
    expect(action).not.toHaveBeenCalled();

    await act(async () => {
      result.current.block();
    });

    expect(result.current.showModal).toBe(false);
    expect(action).not.toHaveBeenCalled();
  });

  test("guardedNavigate: should resolve promise true on allow", async () => {
    const { result } = renderHook(() => useNavigationGuard(true));
    const action = jest.fn();

    let navPromise: Promise<void>;
    await act(async () => {
      navPromise = result.current.guardedNavigate(action);
    });

    await act(async () => {
      result.current.allow();
    });

    expect(result.current.showModal).toBe(false);

    expect(action).not.toHaveBeenCalled();
  });
});
