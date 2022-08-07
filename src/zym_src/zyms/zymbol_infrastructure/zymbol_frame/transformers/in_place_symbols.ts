import { debug } from "console";
import _ from "underscore";
import { last } from "../../../../../global_utils/array_utils";
import { backslash, checkLatex } from "../../../../../global_utils/latex_utils";
import {
  capitalizeFirstLetter,
  splitCursorStringAtLastWord,
} from "../../../../../global_utils/text_utils";
import { Zentinel } from "../../../../../zym_lib/zentinel/zentinel";
import { extendParentCursor } from "../../../../../zym_lib/zy_god/cursor/cursor";
import {
  KeyPressComplexType,
  ZymKeyPress,
} from "../../../../../zym_lib/zy_god/event_handler/key_press";
import { Zymbol } from "../../../zymbol/zymbol";
import { NumberZymbol } from "../../../zymbol/zymbols/number_zymbol";
import { SymbolZymbol } from "../../../zymbol/zymbols/symbol_zymbol/symbol_zymbol";
import {
  TextZymbol,
  TEXT_ZYMBOL_NAME,
} from "../../../zymbol/zymbols/text_zymbol/text_zymbol";
import { Zocket } from "../../../zymbol/zymbols/zocket/zocket";
import { TeX } from "../../../zymbol/zymbol_types";
import {
  BasicZymbolTreeTransformation,
  CreateTransformerMessage,
  KeyPressValidator,
  ZymbolTransformRank,
} from "../zymbol_frame";
import {
  getTransformTextZymbolAndParent,
  makeHelperCursor,
  recoverAllowedCursor,
} from "./transform_utils";

export const IN_PLACE_SYMBOL_TRANSFORM = "in-place-e8d29";

type SlashMap = { [key: string]: string };
type DirectMap = SlashMap;

const slashes = ["\\", "/"];

const comma = ",";
const semiColon = ";";

function checkSymbol(sym: TeX): boolean {
  return checkLatex(`\\${sym}`);
}

/* +++ Basic binary operations +++ */
const basicBinaryOperations: string[] = ["+", "=", "-"];

const texBinaryOperations: string[] = ["cdot", "div", "times"];

const binDirectMap: DirectMap = {
  dot: "cdot",
  "*": "cdot",
};

/* +++ GREEK!! +++ */
const lowerGreek: string[] = [
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

const greekCaps = lowerGreek.map(capitalizeFirstLetter);
const greekLetters = lowerGreek.concat(greekCaps);

const lowerGreekSlashMap: SlashMap = {
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
  w: "omega",
};

let upperGreekSlashMap: { [key: string]: string } = {};

for (const [key, value] of Object.entries(lowerGreekSlashMap)) {
  upperGreekSlashMap[key.toUpperCase()] = capitalizeFirstLetter(value);
  upperGreekSlashMap[capitalizeFirstLetter(key)] = capitalizeFirstLetter(value);
}

const greekSlashMap: SlashMap = {
  ...lowerGreekSlashMap,
  ...upperGreekSlashMap,
};

/* +++ PHYSICS! +++ */

const physSlash: SlashMap = {
  hb: "hbar",
};

/* Full word matches */
const suggestedWords = _.uniq([
  ...greekLetters,
  ...Object.values(physSlash),
  ...texBinaryOperations,
]);

/* Slash matches */
const slashMap = { ...greekSlashMap, ...physSlash };
const slashKeys = Object.keys(slashMap);

/* Direct Matches */
const directMap = { ...binDirectMap };
const directKeys = Object.keys(directMap);

/* Direct words */
const directWords = _.uniq([...basicBinaryOperations]);

class InPlaceSymbol extends Zentinel {
  zyId: string = IN_PLACE_SYMBOL_TRANSFORM;

  onRegistration = async () => {
    this.callHermes(
      CreateTransformerMessage.registerTransformer({
        source: IN_PLACE_SYMBOL_TRANSFORM,
        name: "in-place",
        transform: (root, cursor) => {
          cursor = makeHelperCursor(cursor, root);
          const cursorCopy = [...cursor];

          const transformText = getTransformTextZymbolAndParent(root, cursor);

          if (transformText.isTextZymbol) {
            const { text } = transformText;

            const i = last(cursorCopy);

            const { word, before, after } = splitCursorStringAtLastWord(
              text.getText(),
              i
            );

            let changed = false;
            let symbol = "";
            let number: number | undefined;
            let rank = ZymbolTransformRank.Include;
            let keyPressValidator: KeyPressValidator | undefined;

            if (directWords.includes(word)) {
              changed = true;
              symbol = word;
              rank = ZymbolTransformRank.Suggest;
            } else if (suggestedWords.includes(word)) {
              changed = true;
              symbol = backslash(word);
              rank = ZymbolTransformRank.Suggest;
            } else if (directKeys.includes(word)) {
              changed = true;
              symbol = backslash(directMap[word]);
              rank = ZymbolTransformRank.Suggest;
            } else if (slashes.some((s) => word.startsWith(s))) {
              const key = word.slice(1);

              if (slashKeys.includes(key)) {
                changed = true;
                symbol = backslash(slashMap[key]);
                rank = ZymbolTransformRank.Suggest;
              }
            } else if (word.length === 2 && word.startsWith(comma)) {
              changed = true;
              symbol = word.slice(1);
              rank = ZymbolTransformRank.Suggest;
            } else if (word.startsWith(semiColon) && word.length > 1) {
              changed = true;
              symbol = word.slice(1);
              rank = ZymbolTransformRank.Suggest;

              keyPressValidator = (keyPress: ZymKeyPress) =>
                !(
                  keyPress.type === KeyPressComplexType.Key &&
                  /^[a-zA-Z]$/.test(keyPress.key)
                );
            } else if (/^(\d+.?\d*)|(r.\d+)$/.test(word)) {
              changed = true;
              number = parseFloat(word);
              rank = ZymbolTransformRank.Suggest;

              keyPressValidator = (keyPress: ZymKeyPress) =>
                !(
                  keyPress.type === KeyPressComplexType.Key &&
                  /^[0-9.]$/.test(keyPress.key)
                );
            } else if (/^[a-zA-Z]/.test(word) && checkSymbol(word)) {
              changed = true;
              symbol = backslash(word);
            }

            if (changed) {
              cursorCopy.pop();
              const textPointer = cursorCopy.pop()!;
              const parentZocket = text.parent as Zocket;

              const newZym = [];
              let newTextPointer = textPointer + 1;

              if (before) {
                const txt1 = new TextZymbol(
                  parentZocket.parentFrame,
                  textPointer,
                  parentZocket
                );

                txt1.setText(before);

                newZym.push(txt1);
                newTextPointer++;
              }

              /* Now either create a symbol or a number */
              if (number !== undefined) {
                const numZym = new NumberZymbol(
                  number,

                  parentZocket.parentFrame,
                  textPointer + 1,
                  parentZocket
                );

                newZym.push(numZym);
              } else {
                const sym = new SymbolZymbol(
                  symbol,
                  parentZocket.parentFrame,
                  textPointer + 1,
                  parentZocket
                );

                newZym.push(sym);
              }

              if (after) {
                const txt2 = new TextZymbol(
                  parentZocket.parentFrame,
                  textPointer + 2,
                  parentZocket
                );

                txt2.setText(after);

                newZym.push(txt2);
              }

              parentZocket.children.splice(textPointer, 1, ...newZym);

              return [
                new BasicZymbolTreeTransformation(
                  {
                    newTreeRoot: root as Zocket,
                    cursor: recoverAllowedCursor(
                      extendParentCursor(newTextPointer, cursorCopy),
                      root
                    ),
                    priority: {
                      rank: rank,
                      cost: 100,
                    },
                  },
                  keyPressValidator
                ),
              ];
            }
          }

          return [];
        },
      })
    );
  };
}

export const inPlaceSymbol = new InPlaceSymbol();
