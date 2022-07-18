import { backslash } from "../../../../global_utils/latex_utils";
import {
  capitalizeFirstLetter,
  splitCursorStringAtLastWord,
} from "../../../../global_utils/text_utils";
import { Zentinel } from "../../../../zym_lib/zentinel/zentinel";
import {
  Cursor,
  extractCursorInfo,
} from "../../../../zym_lib/zy_god/cursor/cursor";
import { Zymbol } from "../../../zyms/zymbol/zymbol";
import {
  TextZymbol,
  TEXT_ZYMBOL_NAME,
} from "../../../zyms/zymbol/zymbols/text_zymbol/text_zymbol";
import {
  Zocket,
  ZOCKET_MASTER_ID,
} from "../../../zyms/zymbol/zymbols/zocket/zocket";
import { CreateTransformerMessage } from "../transformer";

export const IN_PLACE_SYMBOL_TRANSFORM = "in-place-e8d29";

const lower: string[] = [
  "alpha",
  "beta",
  "gamma",
  "delta",
  "epsilon",
  "zeta",
  "eta",
  "theta",
  "iota",
  "kappa",
  "lambda",
  "mu",
  "nu",
  "xi",
  "omicron",
  "pi",
  "rho",
  "sigma",
  "tau",
  "upsilon",
  "phi",
  "chi",
  "psi",
  "omega",
];

const caps = lower.map(capitalizeFirstLetter);
const greekLetters = lower.concat(caps);

const lowerSlashMap: { [key: string]: string } = {
  a: "alpha",
  b: "beta",
  g: "gamma",
  d: "delta",
  ep: "epsilon",
  z: "zeta",
  th: "theta",
  i: "iota",
  k: "kappa",
  l: "lambda",
  oc: "omicron",
  s: "sigma",
  u: "upsilon",
  om: "omega",
};

let upperSlashMap: { [key: string]: string } = {};

for (const [key, value] of Object.entries(lowerSlashMap)) {
  upperSlashMap[key.toUpperCase()] = capitalizeFirstLetter(value);
}

const greekSlashMap = { ...lowerSlashMap, ...upperSlashMap };
const greekSlashKeys = Object.keys(greekSlashMap);

function greekifyHelper(
  zymbol: Zymbol,
  cursor: Cursor
): { zymbol: Zymbol; changed: boolean } {
  const { nextCursorIndex, parentOfCursorElement, childRelativeCursor } =
    extractCursorInfo(cursor);

  if (parentOfCursorElement) {
    if (zymbol.getMasterId() === TEXT_ZYMBOL_NAME) {
      const text = zymbol as TextZymbol;

      const { word, before, after } = splitCursorStringAtLastWord(
        text.getText(),
        nextCursorIndex
      );

      let changed = false;
      let symbol = "";

      /* First check for lowercase/uppercase */
      if (greekLetters.includes(word)) {
        changed = true;
        symbol = backslash(word);
      } else if (word.startsWith("\\")) {
        const key = word.slice(1);

        if (greekSlashKeys.includes(key)) {
          changed = true;
          symbol = backslash(greekSlashMap[key]);
        }
      }

      /* Now we change the parent zocket to properly include this */
    }
  } else {
    const newChild = greekifyHelper(
      zymbol.children[nextCursorIndex] as Zymbol,
      childRelativeCursor
    );

    zymbol.children.splice(nextCursorIndex, 1, newChild.zymbol);

    return {
      zymbol,
      changed: newChild.changed,
    };
  }

  return {
    zymbol,
    changed: false,
  };
}

export class InPlaceSymbol extends Zentinel {
  zyId: string = IN_PLACE_SYMBOL_TRANSFORM;

  onRegistration = async () => {
    /* Register the greekify transformer 
    with the transformer zentinel */
    this.callHermes(
      CreateTransformerMessage.registerTransformer({
        source: IN_PLACE_SYMBOL_TRANSFORM,
        name: "in-place",
        transform: (root, cursor) => {
          throw new Error("unimpl");
        },
      })
    );
  };
}
