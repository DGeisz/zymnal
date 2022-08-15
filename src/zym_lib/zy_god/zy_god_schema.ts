import {
  createZentinelMethodList,
  ZentinelMethodSchema,
} from "../hermes/hermes";
import type { Zym, ZymPersist } from "../zym/zym";
import { ZyOption } from "../utils/zy_option";
import { Cursor } from "./cursor/cursor";
import { ZymKeyPress } from "./event_handler/key_press";

export const ZY_GOD_ID = "zy-god";

export interface ZyGodSchema extends ZentinelMethodSchema {
  getZymRoot: {
    args: undefined;
    return: Zym;
  };
  hydratePersistedZym: {
    args: ZymPersist<any>;
    return: ZyOption<Zym>;
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
}

export const ZyGodMethod = createZentinelMethodList<ZyGodSchema>(ZY_GOD_ID, {
  getZymRoot: 0,
  hydratePersistedZym: 0,
  queueSimulatedKeyPress: 0,
  takeCursor: 0,
  getFullCursor: 0,
});
