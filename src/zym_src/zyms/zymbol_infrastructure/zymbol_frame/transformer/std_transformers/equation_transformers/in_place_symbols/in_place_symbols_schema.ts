import {
  createZentinelMethodList,
  CreateZentinelMethodSchema,
} from "../../../../../../../../zym_lib/hermes/hermes";
import { InPlaceSymbolMap } from "./in_place_symbols";

export const IN_PLACE_SYMBOLS_ID = "in-place-afj3";

export type InPlaceSymbolsMethodSchema = CreateZentinelMethodSchema<{
  addSlashMap: {
    args: InPlaceSymbolMap;
    return: void;
  };
  addDirectMap: {
    args: InPlaceSymbolMap;
    return: void;
  };
}>;

export const InPlaceMethod =
  createZentinelMethodList<InPlaceSymbolsMethodSchema>(IN_PLACE_SYMBOLS_ID, {
    addSlashMap: 0,
    addDirectMap: 0,
  });
