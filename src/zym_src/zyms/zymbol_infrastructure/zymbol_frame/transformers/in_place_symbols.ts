import _ from "underscore";
import { last } from "../../../../../global_utils/array_utils";
import {
  backslash,
  checkLatex,
  LATEX_SPACE,
} from "../../../../../global_utils/latex_utils";
import { splitCursorStringAtLastWord } from "../../../../../global_utils/text_utils";
import { Zentinel } from "../../../../../zym_lib/zentinel/zentinel";
import {
  Cursor,
  extendParentCursor,
} from "../../../../../zym_lib/zy_god/cursor/cursor";
import {
  KeyPressBasicType,
  KeyPressComplexType,
  KeyPressModifier,
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

const STRING_TEST = /^[a-zA-Z,:0-9]+$/;

const alphaValidator = (keyPress: ZymKeyPress) =>
  !(
    keyPress.type === KeyPressBasicType.Delete ||
    (keyPress.type === KeyPressComplexType.Key &&
      /^[a-zA-Z,:0-9]$/.test(keyPress.key))
  );

function checkSymbol(sym: TeX): boolean {
  return checkLatex(`\\${sym}`);
}

/* +++ Basic binary operations +++ */
const basicBinaryOperations: string[] = ["+", "=", "-"];

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

const differentialDelim = "dff";
const diffSymbol = "\\text{d}";

/* +++ Math +++ */
const mathDirectMap: DirectMap = {
  nft: "infty",
  ift: "infty",
};

/* +++ GREEK!! +++ */
const lowerGreekSlashMap: SlashMap = {
  a: "alpha",
  b: "beta",
  g: "gamma",
  dg: "digamma",
  d: "delta",
  ep: "epsilon",
  vep: "varepsilon",
  z: "zeta",
  th: "theta",
  vth: "vartheta",
  i: "iota",
  k: "kappa",
  vk: "varkappa",
  l: "lambda",
  oc: "omicron",
  s: "sigma",
  vs: "varsigma",
  u: "upsilon",
  om: "omega",
  w: "omega",
  m: "mu",
  n: "nu",
  vpi: "varpi",
  vph: "varphi",
  vro: "varrho",
};

const upperGreekSlashMap: SlashMap = {
  G: "Gamma",
  D: "Delta",
  Th: "Theta",
  L: "Lambda",
  S: "Sigma",
  E: "Sigma",
  U: "Upsilon",
  Om: "Omega",
  W: "Omega",
  vW: "varOmega",
  vPh: "varPhi",
  vPi: "varPi",
  vPs: "varPsi",
  vX: "varXi",
  vU: "varUpsilon",
  vE: "varSigma",
  vS: "varSigma",
  vL: "varLambda",
  vG: "varGamma",
  vD: "varDelta",
  vTh: "varTheta",
};

const greekDirectMap: DirectMap = {
  moo: "mu",
  noo: "nu",
  Lm: "Lambda",
  lm: "lambda",
};

const greekSlashMap: SlashMap = {
  ...lowerGreekSlashMap,
  ...upperGreekSlashMap,
};

/* +++ PHYSICS! +++ */

const physSlash: SlashMap = {
  h: "hbar",
};

const physDirectMap: DirectMap = {
  hb: "hbar",
};

/* Slash matches */
const slashMap = { ...setSlashMap, ...greekSlashMap, ...physSlash };
const slashKeys = Object.keys(slashMap);

/* Direct Matches */
const directMap = {
  ...binDirectMap,
  ...calcDirectMap,
  ...mathDirectMap,
  ...physDirectMap,
  ...greekDirectMap,
};
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
        transform: async (root, cursor, keyPress) => {
          cursor = makeHelperCursor(cursor, root);
          const cursorCopy: Cursor = [...cursor];

          const allTransformations: ZymbolTreeTransformation[] = [];

          const rootCopy = (await root.clone(1, root.parent))[0] as Zocket;

          const tt1 = getTransformTextZymbolAndParent(rootCopy, cursor);
          const tt2 = getTransformTextZymbolAndParent(root, cursor);

          /* If the keypress is a power space, we're going to steal and return with tt1 */
          if (
            keyPress.type === KeyPressComplexType.Key &&
            keyPress.key === " " &&
            keyPress.modifiers?.includes(KeyPressModifier.Shift) &&
            tt1.isTextZymbol
          ) {
            const { parent, zymbolIndex } = tt1;

            parent.children.splice(
              zymbolIndex,
              1,
              new SymbolZymbol(
                LATEX_SPACE,
                parent.parentFrame,
                zymbolIndex,
                parent
              )
            );

            parent.recursivelyReIndexChildren();

            cursorCopy.splice(cursorCopy.length - 2, 2, zymbolIndex + 1);

            return [
              new BasicZymbolTreeTransformation({
                newTreeRoot: rootCopy as Zocket,
                cursor: recoverAllowedCursor(cursorCopy, rootCopy),
                priority: {
                  rank: ZymbolTransformRank.Suggest,
                  cost: 100,
                },
              }),
            ];
          }

          if (tt1.isTextZymbol) {
            const { text, parent, zymbolIndex } = tt1;

            console.log("yee", parent, zymbolIndex);

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

            const i = last(cursorCopy);

            const fullText = text.getText();

            const { word, before, after } = splitCursorStringAtLastWord(
              fullText,
              i,
              ["("]
            );

            let changed = false;
            let symbol: string | string[] = "";
            let rank = ZymbolTransformRank.Include;
            let keyPressValidator: KeyPressValidator | undefined;

            console.log(word, differentialDelim, word === differentialDelim);

            /* First check for the differential deliminator */
            /* TODO: This should probably be it's own transformer */
            if (word === differentialDelim && !before) {
              changed = true;

              if (/^\s/.test(fullText)) {
                symbol = [LATEX_SPACE, diffSymbol];
              } else {
                symbol = diffSymbol;
              }

              rank = ZymbolTransformRank.Suggest;
            } else if (directWords.includes(word)) {
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

              keyPressValidator = (keyPress: ZymKeyPress) =>
                !(
                  keyPress.type === KeyPressComplexType.Key &&
                  /[a-zA-Z]+/.test(keyPress.key) &&
                  checkSymbol(word + keyPress.key)
                );
            }

            if (changed) {
              cursorCopy.pop();
              const textPointer = cursorCopy.pop()!;
              const parentZocket = text.parent as Zocket;

              const newZym = [];
              let newTextPointer = textPointer + 1;

              let symZyms: SymbolZymbol[];

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

              if (after) {
                const txt2 = new TextZymbol(
                  parentZocket.parentFrame,
                  textPointer + 2,
                  parentZocket
                );

                txt2.setText(after);

                newZym.push(txt2);
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
