import _ from "underscore";
import { backslash } from "../../../../../../global_utils/latex_utils";
import { DirectMap, InPlaceSymbolMap, SlashMap } from "../in_place_symbols";

/* +++ Basic binary operations +++ */
const basicBinaryOperations: DirectMap = {
  "+": "+",
  "=": "=",
  "-": "-",
};

const binDirectMap: DirectMap = {
  dot: "cdot",
  "*": "cdot",
};

/* +++ Sets! +++ */
const setSlashMap: SlashMap = {
  R: "R",
  C: "mathbb{C}",
  Z: "mathbb{Z}",
};

/* +++ Calculus! +++ */
const calcDirectMap: DirectMap = {
  ptl: "partial",
  nab: "nabla",
  dlmb: "square",
};

/* +++ Math +++ */
const basicMathDirectMap: DirectMap = {
  nft: "infty",
  ift: "infty",
  dff: "text{d}",
};

export const mathDirectMap: InPlaceSymbolMap = {
  symMap: {
    ..._.mapObject(
      {
        ...calcDirectMap,
        ...basicMathDirectMap,
        ...binDirectMap,
      },
      backslash
    ),
    ...basicBinaryOperations,
  },
  id: {
    group: "math",
    item: "direct",
  },
  cost: 100,
};

export const mathSlashMap: InPlaceSymbolMap = {
  symMap: _.mapObject({ ...setSlashMap }, backslash),
  id: {
    group: "math",
    item: "direct",
  },
  cost: 100,
};
