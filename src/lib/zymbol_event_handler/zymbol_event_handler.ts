import { greekify } from "./handlers/greek_handler";

export type ZymbolEvent = string;
export type Handler = (data: any) => void;

export enum BasicZymbolEvent {
  ZOCKET_CONTENT_ADDED = "zocketContentAdded",
}

export class ZymbolEventHandler {
  handlers: Map<ZymbolEvent, Handler[]> = new Map();

  registerHandler = (event: ZymbolEvent, handler: Handler) => {
    const handlers = this.handlers.get(event);

    if (handlers) {
      this.handlers.set(event, [...handlers, handler]);
    } else {
      this.handlers.set(event, [handler]);
    }
  };

  triggerEvent = (event: ZymbolEvent, data: any) => {
    const handlers = this.handlers.get(event);

    if (handlers) {
      for (const handler of handlers) {
        handler(data);
      }
    }
  };
}

export const zymbolEventHandler = new ZymbolEventHandler();

zymbolEventHandler.registerHandler(
  BasicZymbolEvent.ZOCKET_CONTENT_ADDED,
  greekify
);
