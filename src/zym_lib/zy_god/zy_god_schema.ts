import {
  createZentinelMethodList,
  CreateZentinelMethodSchema,
} from "../hermes/hermes";
import type { Zym } from "../zym/zym";
import { ZyOption } from "../utils/zy_option";
import { Cursor } from "./cursor/cursor";
import { ZymKeyPress } from "./event_handler/key_press";
import { ZymPersist } from "../zy_schema/zy_schema";
import { BasicContext } from "../utils/basic_context";

export const ZY_GOD_ID = "zy-god";

export type KeyPressHandler = (keyPress: ZymKeyPress | undefined) => void;

export abstract class CustomKeyPressHandler {
  baseKeyPressHandler: KeyPressHandler;

  constructor(baseKeyPressHandler: KeyPressHandler) {
    this.baseKeyPressHandler = baseKeyPressHandler;
  }

  abstract handleKeyPress(keyPress: ZymKeyPress): Promise<void>;

  abstract beforeKeyPress(ctx: BasicContext, keyPress: ZymKeyPress): void;
  abstract afterKeyPress(ctx: BasicContext): void;
  abstract shouldPreventCursorBlink(): boolean;
}

export type ZyGodSchema = CreateZentinelMethodSchema<{
  getZymRoot: {
    args: undefined;
    return: Zym<any, any, any>;
  };
  hydratePersistedZym: {
    args: ZymPersist<any, any>;
    return: ZyOption<Zym<any, any, any>>;
  };
  queueSimulatedKeyPress: {
    args: ZymKeyPress;
    return: void;
  };
  takeCursor: {
    args: Cursor;
    return: void;
  };
  getFullCursor: {
    args: undefined;
    return: Cursor;
  };
  registerCustomKeyPressHandler: {
    args: (baseKeyPressHandler: KeyPressHandler) => CustomKeyPressHandler;
    return: void;
  };
}>;

export const ZyGodMethod = createZentinelMethodList<ZyGodSchema>(ZY_GOD_ID, {
  getZymRoot: 0,
  hydratePersistedZym: 0,
  queueSimulatedKeyPress: 0,
  takeCursor: 0,
  getFullCursor: 0,
  registerCustomKeyPressHandler: 0,
});
