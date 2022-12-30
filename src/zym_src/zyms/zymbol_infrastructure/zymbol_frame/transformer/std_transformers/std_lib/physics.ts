import { backslash } from "../../../../../../../global_utils/latex_utils";
import { FunctionTransformerMap } from "../equation_transformers/function_transformer/function_transformer_schema";
import { InPlaceSymbolMap } from "../equation_transformers/in_place_symbols/in_place_symbols";

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

export const physicsFunctionMap: FunctionTransformerMap = {
  id: {
    group: "physics",
    item: "fnMap",
  },
  cost: 100,
  map: {
    bkt: "braket",
    Bkt: "Braket",
  },
};
