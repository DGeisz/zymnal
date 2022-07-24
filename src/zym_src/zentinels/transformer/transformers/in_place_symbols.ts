import { last } from "../../../../global_utils/array_utils";
import { backslash } from "../../../../global_utils/latex_utils";
import {
  capitalizeFirstLetter,
  splitCursorStringAtLastWord,
} from "../../../../global_utils/text_utils";
import { Zentinel } from "../../../../zym_lib/zentinel/zentinel";
import { extendParentCursor } from "../../../../zym_lib/zy_god/cursor/cursor";
import { Zymbol } from "../../../zyms/zymbol/zymbol";
import { SymbolZymbol } from "../../../zyms/zymbol/zymbols/symbol_zymbol/symbol_zymbol";
import {
  TextZymbol,
  TEXT_ZYMBOL_NAME,
} from "../../../zyms/zymbol/zymbols/text_zymbol/text_zymbol";
import { Zocket } from "../../../zyms/zymbol/zymbols/zocket/zocket";
import { CreateTransformerMessage } from "../transformer";

export const IN_PLACE_SYMBOL_TRANSFORM = "in-place-e8d29";

type SlashMap = { [key: string]: string };

const slashes = ["\\", "/"];

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

const physWords = ["hbar"];

const physSlash: SlashMap = {
  hb: "hbar",
};

/* +++ HEBREW? +++ */
const hebrewWords = ["aleph"];

/* Full word matches */
const fullWords: string[] = [...greekLetters, ...physWords, ...hebrewWords];

/* Slash matches */
const slashMap = { ...greekSlashMap, ...physSlash };
const slashKeys = Object.keys(slashMap);

class InPlaceSymbol extends Zentinel {
  zyId: string = IN_PLACE_SYMBOL_TRANSFORM;

  onRegistration = async () => {
    /* Register the greekify transformer 
    with the transformer zentinel */
    this.callHermes(
      CreateTransformerMessage.registerTransformer({
        source: IN_PLACE_SYMBOL_TRANSFORM,
        name: "in-place",
        transform: (root, cursor) => {
          const cursorCopy = [...cursor];

          /* First we want to get to the parent */
          let currZymbol = root;

          for (let i = 0; i < cursorCopy.length - 1; i++) {
            currZymbol = currZymbol.children[cursorCopy[i]] as Zymbol;

            if (!currZymbol) {
              return [];
            }
          }

          if (currZymbol.getMasterId() === TEXT_ZYMBOL_NAME) {
            const i = last(cursorCopy);
            const text = currZymbol as TextZymbol;

            const { word, before, after } = splitCursorStringAtLastWord(
              text.getText(),
              i
            );

            let changed = false;
            let symbol = "";

            /* First check for lowercase/uppercase */
            if (fullWords.includes(word)) {
              changed = true;
              symbol = backslash(word);
            } else if (slashes.some((s) => word.startsWith(s))) {
              const key = word.slice(1);

              if (slashKeys.includes(key)) {
                changed = true;
                symbol = backslash(slashMap[key]);
              }
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

              const sym = new SymbolZymbol(
                symbol,
                parentZocket.parentFrame,
                textPointer + 1,
                parentZocket
              );

              newZym.push(sym);

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
                {
                  newTreeRoot: root as Zocket,
                  cursor: extendParentCursor(newTextPointer, cursorCopy),
                  priority: {
                    rank: 1,
                    value: 100,
                  },
                },
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
