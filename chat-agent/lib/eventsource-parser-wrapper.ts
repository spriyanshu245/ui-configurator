import { createParser as createParserImpl } from "eventsource-parser";

export type ParsedEventLocal =
  | { type: "event"; id?: string; data: string }
  | { type: "comment"; data: string };

export type ReconnectIntervalLocal = { type: "reconnect-interval"; value: number };

export type Parser = { feed: (chunk: string) => void };

export function createParser(
  onParse: (event: ParsedEventLocal | ReconnectIntervalLocal) => void,
): Parser {
  return createParserImpl({
    onEvent: (event) => {
      onParse({
        type: "event",
        id: event.id,
        data: event.data,
      });
    },
    onComment: (comment) => {
      onParse({
        type: "comment",
        data: comment,
      });
    },
    onRetry: (interval) => {
      onParse({
        type: "reconnect-interval",
        value: interval,
      });
    },
  }) as unknown as Parser;
}
