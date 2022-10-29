import _ from "underscore";
import { backslash } from "../../../../../../../../global_utils/latex_utils";
import { NONE, zySome } from "../../../../../../../../zym_lib/utils/zy_option";
import { Zentinel } from "../../../../../../../../zym_lib/zentinel/zentinel";
import { FunctionZymbol } from "../../../../../../zymbol/zymbols/function_zymbol/function_zymbol";
import { FunctionZymbolMethod } from "../../../../../../zymbol/zymbols/function_zymbol/function_zymbol_schema";
import { Zocket } from "../../../../../../zymbol/zymbols/zocket/zocket";
import { FunctionTransformerMap } from "../../equation_transformers/function_transformer/function_transformer_schema";
import {
  DirectMap,
  InPlaceSymbolMap,
  SlashMap,
} from "../../equation_transformers/in_place_symbols/in_place_symbols";

/* +++ Basic binary operations +++ */
const basicBinaryOperations: DirectMap = {
  "+": "+",
  "=": "=",
  "-": "-",
  ">": ">",
  "<": "<",
};

const binDirectMap: DirectMap = {
  dot: "cdot",
  "*": "cdot",
  deq: "equiv",
};

/* +++ Sets! +++ */
const textSymbols: DirectMap = {
  det: "text{det}",
  erf: "text{erf}",
};

/* +++ Sets! +++ */
const logicDirectMap: DirectMap = {
  and: "wedge",
  or: "vee",
  imp: "implies",
  lar: "lArr",
  rar: "rArr",
  ex: "exists",
  fa: "forall",
};

/* +++ Sets! +++ */
const dotsDirectMap: DirectMap = {
  ooo: "dots",
  "...": "dots",
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
        ...logicDirectMap,
        ...dotsDirectMap,
        ...textSymbols,
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

const nSqrtBracketZockets = { 0: true };

export const sqrtFunctionMap: FunctionTransformerMap = {
  id: {
    group: "math",
    item: "sqrt",
  },
  cost: 100,
  map: {
    sr: "sqrt",
    nsr: {
      tex: "sqrt",
      numZockets: 2,
      bracketZockets: nSqrtBracketZockets,
    },
    nsqrt: {
      tex: "sqrt",
      numZockets: 2,
      bracketZockets: nSqrtBracketZockets,
    },
  },
};

export async function addSqrtDotModifier(zentinel: Zentinel<any>) {
  await zentinel.callZentinelMethod(
    FunctionZymbolMethod.addDotModifierTransformer,
    {
      id: {
        group: "math",
        item: "sqrt",
      },
      transform: ({ zymbol, word }) => {
        const sqrt = zymbol as FunctionZymbol;

        if (word === "^" && sqrt.baseTex === "sqrt") {
          if (_.isEmpty(sqrt.bracketZockets)) {
            const newZocket = new Zocket(sqrt.parentFrame, 0, sqrt);

            sqrt.children = [newZocket, sqrt.children[0]];
            sqrt.bracketZockets = nSqrtBracketZockets;
            sqrt.numZockets = 2;
          } else {
            sqrt.children = [sqrt.children[1]];
            sqrt.bracketZockets = {};
            sqrt.numZockets = 1;
          }

          return zySome(sqrt);
        }

        return NONE;
      },
    }
  );
}
