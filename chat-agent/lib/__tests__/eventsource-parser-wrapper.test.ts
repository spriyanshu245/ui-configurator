/**
 * @jest-environment node
 */
import { createParser } from "../eventsource-parser-wrapper";

describe("eventsource-parser-wrapper createParser", () => {
  it("emits normalized event objects for complete SSE messages", () => {
    const onParse = jest.fn();
    const parser = createParser(onParse);
    parser.feed("id: 7\ndata: hello\n\n");
    expect(onParse).toHaveBeenCalledWith({ type: "event", id: "7", data: "hello" });
  });

  it("buffers partial chunks until the message is terminated", () => {
    const onParse = jest.fn();
    const parser = createParser(onParse);
    parser.feed("data: par");
    expect(onParse).not.toHaveBeenCalled();
    parser.feed("tial\n\n");
    expect(onParse).toHaveBeenCalledTimes(1);
    expect(onParse.mock.calls[0][0]).toMatchObject({ type: "event", data: "partial" });
  });

  it("emits comment events", () => {
    const onParse = jest.fn();
    createParser(onParse).feed(": keep-alive\n\n");
    expect(onParse).toHaveBeenCalledTimes(1);
    expect(onParse.mock.calls[0][0]).toMatchObject({ type: "comment" });
    expect(onParse.mock.calls[0][0].data).toContain("keep-alive");
  });

  it("emits reconnect-interval for retry fields", () => {
    const onParse = jest.fn();
    createParser(onParse).feed("retry: 1500\n\n");
    expect(onParse).toHaveBeenCalledWith({ type: "reconnect-interval", value: 1500 });
  });
});
