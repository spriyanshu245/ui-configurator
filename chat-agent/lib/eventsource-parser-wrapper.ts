import { createParser as createParserImpl } from "eventsource-parser";

export type ParsedEventLocal =
  | { type: "event"; id?: string; data: string }
  | { type: "comment"; data: string };

export type ReconnectIntervalLocal = { type: "reconnect-interval"; value: number };

export type Parser = { feed: (chunk: string) => void };

export function createParser(
  onParse: (event: ParsedEventLocal | ReconnectIntervalLocal) => void,
): Parser {
  // delegate to the real implementation; keep the cast isolated here
  return (createParserImpl as unknown as (cb: (e: any) => void) => Parser)(onParse as any);
}
