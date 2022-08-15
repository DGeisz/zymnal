import {
  createZentinelMethodList,
  ZentinelMethodSchema,
} from "../../../../../../zym_lib/hermes/hermes";
import { InPlaceSymbolMap } from "./in_place_symbols";

export const IN_PLACE_SYMBOLS_ID = "in-place-afj3";

export interface InPlaceSymbolsMethodSchema extends ZentinelMethodSchema {
  addSlashMap: {
    args: InPlaceSymbolMap;
    return: void;
  };
  addDirectMap: {
    args: InPlaceSymbolMap;
    return: void;
  };
}

export const InPlaceMethod =
  createZentinelMethodList<InPlaceSymbolsMethodSchema>(IN_PLACE_SYMBOLS_ID, {
    addSlashMap: 0,
    addDirectMap: 0,
  });
