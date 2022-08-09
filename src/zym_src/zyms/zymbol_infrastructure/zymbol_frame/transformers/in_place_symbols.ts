import _ from "underscore";
import { backslash, checkLatex } from "../../../../../global_utils/latex_utils";
import { capitalizeFirstLetter } from "../../../../../global_utils/text_utils";
import { Zentinel } from "../../../../../zym_lib/zentinel/zentinel";
import {
  Cursor,
  extendParentCursor,
} from "../../../../../zym_lib/zy_god/cursor/cursor";
import {
  KeyPressBasicType,
  KeyPressComplexType,
  ZymKeyPress,
} from "../../../../../zym_lib/zy_god/event_handler/key_press";
import { SymbolZymbol } from "../../../zymbol/zymbols/symbol_zymbol/symbol_zymbol";
import { TextZymbol } from "../../../zymbol/zymbols/text_zymbol/text_zymbol";
import { Zocket } from "../../../zymbol/zymbols/zocket/zocket";
import { TeX } from "../../../zymbol/zymbol_types";
import {
  BasicZymbolTreeTransformation,
  CreateTransformerMessage,
  KeyPressValidator,
  ZymbolTransformRank,
  ZymbolTreeTransformation,
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

const SINGLE_DIRECT_SYMBOL_DELIM = ":";
const MULTI_DIRECT_SYMBOL_DELIM = ";";

const stringPrefixList = ["("];

const STRING_TEST = /^[a-zA-Z,0-9]+$/;

const alphaValidator = (keyPress: ZymKeyPress) =>
  !(
    keyPress.type === KeyPressBasicType.Delete ||
    (keyPress.type === KeyPressComplexType.Key &&
      /^[a-zA-Z,0-9]$/.test(keyPress.key))
  );

function checkSymbol(sym: TeX): boolean {
  return checkLatex(`\\${sym}`);
}

/* +++ Basic binary operations +++ */
const basicBinaryOperations: string[] = ["+", "=", "-"];

const texBinaryOperations: string[] = ["cdot", "div", "times", "pm"];

const binDirectMap: DirectMap = {
  dot: "cdot",
  "*": "cdot",
};

/* +++ Calculus! +++ */
const calcDirectMap: DirectMap = {
  ptl: "partial",
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
  h: "hbar",
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
const directMap = { ...binDirectMap, ...calcDirectMap };
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
        transform: async (root, cursor) => {
          cursor = makeHelperCursor(cursor, root);
          const cursorCopy: Cursor = [...cursor];

          const allTransformations: ZymbolTreeTransformation[] = [];

          const rootCopy = (await root.clone(1, root.parent))[0] as Zocket;

          const tt1 = getTransformTextZymbolAndParent(rootCopy, cursor);
          const tt2 = getTransformTextZymbolAndParent(root, cursor);

          if (tt1.isTextZymbol) {
            const { text } = tt1;

            const fullText = text.getText().trim();
            let finalWord = fullText;

            let prefix = undefined;

            if (stringPrefixList.includes(fullText[0])) {
              prefix = fullText[0];
              finalWord = fullText.slice(1);
            }

            if (STRING_TEST.test(finalWord)) {
              const cursorCopy = [...cursor];

              cursorCopy.pop();
              const textPointer = cursorCopy.pop()!;
              const parentZocket = text.parent as Zocket;

              let newTextPointer = textPointer + finalWord.length;

              let prefixSymbol = undefined;

              if (prefix) {
                prefixSymbol = new TextZymbol(
                  parentZocket.parentFrame,
                  textPointer,
                  parentZocket
                );

                prefixSymbol.setText(prefix);
                newTextPointer++;
              }

              parentZocket.children.splice(
                textPointer,
                1,
                ..._.compact([
                  prefixSymbol,
                  ...finalWord
                    .split("")
                    .map(
                      (s) =>
                        new SymbolZymbol(
                          s,
                          parentZocket.parentFrame,
                          textPointer + 1,
                          parentZocket
                        )
                    ),
                ])
              );

              rootCopy.recursivelyReIndexChildren();
              allTransformations.push(
                new BasicZymbolTreeTransformation(
                  {
                    newTreeRoot: rootCopy as Zocket,
                    cursor: recoverAllowedCursor(
                      extendParentCursor(newTextPointer, cursorCopy),
                      rootCopy
                    ),
                    priority: {
                      rank: ZymbolTransformRank.Suggest,
                      /* Super high cost so this is always suggested last */
                      cost: 10000,
                    },
                  },
                  alphaValidator
                )
              );
            }
          }

          if (tt2.isTextZymbol) {
            const { text } = tt2;

            const word = text.getText().trim();

            let changed = false;
            let symbol: string | string[] = "";
            let rank = ZymbolTransformRank.Include;
            let keyPressValidator: KeyPressValidator | undefined;

            if (directWords.includes(word)) {
              changed = true;
              symbol = word;
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
            } else if (
              word.length === 2 &&
              word.startsWith(SINGLE_DIRECT_SYMBOL_DELIM)
            ) {
              changed = true;
              symbol = word.slice(1);
              rank = ZymbolTransformRank.Suggest;
            } else if (
              word.startsWith(MULTI_DIRECT_SYMBOL_DELIM) &&
              word.length > 1
            ) {
              changed = true;
              symbol = word.slice(1);
              rank = ZymbolTransformRank.Suggest;

              keyPressValidator = alphaValidator;
            } else if (!word.includes(".") && checkSymbol(word)) {
              changed = true;
              symbol = backslash(word);

              if (word.length > 1) {
                rank = ZymbolTransformRank.Suggest;
              }
            }

            if (changed) {
              cursorCopy.pop();
              const textPointer = cursorCopy.pop()!;
              const parentZocket = text.parent as Zocket;

              const newZym = [];
              let newTextPointer = textPointer + 1;

              let symZyms: SymbolZymbol[];

              if (Array.isArray(symbol)) {
                symZyms = symbol.map(
                  (s) =>
                    new SymbolZymbol(
                      s,
                      parentZocket.parentFrame,
                      textPointer + 1,
                      parentZocket
                    )
                );

                newTextPointer += symbol.length - 1;
              } else {
                symZyms = [
                  new SymbolZymbol(
                    symbol,
                    parentZocket.parentFrame,
                    textPointer + 1,
                    parentZocket
                  ),
                ];
              }

              newZym.push(...symZyms);

              parentZocket.children.splice(textPointer, 1, ...newZym);

              root.recursivelyReIndexChildren();
              allTransformations.push(
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
                )
              );
            }
          }

          return allTransformations;
        },
      })
    );
  };
}

export const inPlaceSymbol = new InPlaceSymbol();
