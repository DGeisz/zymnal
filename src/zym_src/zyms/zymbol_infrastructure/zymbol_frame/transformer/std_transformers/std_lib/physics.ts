import { backslash } from "../../../../../../../global_utils/latex_utils";
import { InPlaceSymbolMap } from "../in_place_symbols/in_place_symbols";

export const physicsSlash: InPlaceSymbolMap = {
  symMap: {
    h: backslash("hbar"),
  },
  id: {
    group: "physics",
    item: "slash",
  },
  cost: 100,
};

export const physicsDirect: InPlaceSymbolMap = {
  symMap: {
    hb: backslash("hbar"),
  },
  id: {
    group: "physics",
    item: "direct",
  },
  cost: 100,
};
