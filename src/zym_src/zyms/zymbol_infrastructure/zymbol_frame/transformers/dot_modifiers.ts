import _ from "underscore";
import { last } from "../../../../../global_utils/array_utils";
import { checkLatex } from "../../../../../global_utils/latex_utils";
import { Zentinel } from "../../../../../zym_lib/zentinel/zentinel";
import { Zymbol } from "../../../zymbol/zymbol";
import { isSuperSub } from "../../../zymbol/zymbols/super_sub";
import { isSymbolZymbol } from "../../../zymbol/zymbols/symbol_zymbol/symbol_zymbol";
import {
  TextZymbol,
  TEXT_ZYMBOL_NAME,
} from "../../../zymbol/zymbols/text_zymbol/text_zymbol";
import { Zocket, ZymbolModifier } from "../../../zymbol/zymbols/zocket/zocket";
import {
  BasicZymbolTreeTransformation,
  TransformerMessage,
  ZymbolTransformRank,
} from "../zymbol_frame";
import {
  getTransformTextZymbolAndParent,
  makeHelperCursor,
  recoverAllowedCursor,
} from "./transform_utils";

export const DOT_MODIFIERS_TRANSFORM = "dot-modifiers-e1125";

const dot = ".";

const dotMap: { [key: string]: string } = {
  vc: "vec",
  ht: "hat",
  dt: "dot",
  ddt: "ddot",
  ul: "underline",
  bd: "bold",
  scr: "mathscr",
  cal: "mathcal",
  tt: "text",
};

const PRIME_GROUP = "prime";

function genPrimeMod(numPrime: number): ZymbolModifier {
  let post = "";
  _.range(numPrime).forEach((i) => (post += "'"));
  post += "}";

  return {
    id: {
      group: "prime",
      item: numPrime,
    },
    pre: "{",
    post,
  };
}

const PRIME_DELIM = "'";
const UN_PRIME_DELIM = '"';

const suggestedMods = Object.values(dotMap);

const dotKeys = Object.keys(dotMap);

function checkMod(mod: string): boolean {
  return checkLatex(`\\${mod}{a}`) && !checkLatex(`\\${mod}`);
}

class DotModifiers extends Zentinel {
  zyId: string = DOT_MODIFIERS_TRANSFORM;

  onRegistration = async () => {
    this.callHermes(
      TransformerMessage.registerTransformer({
        source: DOT_MODIFIERS_TRANSFORM,
        name: "dot-mod",
        transform: (root, cursor) => {
          cursor = makeHelperCursor(cursor, root);
          const cursorCopy = [...cursor];

          /* First we want to get to the parent */
          const textTransform = getTransformTextZymbolAndParent(root, cursor);

          const zymbolIndex: number = last(cursorCopy, 2);

          if (zymbolIndex > 0 && textTransform.isTextZymbol) {
            const { text, parent, prevZymbol } = textTransform;
            const firstWord = text.getText();

            if (firstWord.startsWith(dot)) {
              let modWord = firstWord.slice(1);

              let allowed = false;
              let rank = ZymbolTransformRank.Include;

              if (dotKeys.includes(modWord)) {
                allowed = true;
                rank = ZymbolTransformRank.Suggest;
                modWord = dotMap[modWord];
              } else if (suggestedMods.includes(modWord)) {
                allowed = true;
                rank = ZymbolTransformRank.Suggest;
              } else if (checkMod(modWord)) {
                /* We default to suggested */
                allowed = true;

                if (modWord.length > 2) {
                  rank = ZymbolTransformRank.Suggest;
                }
              }

              if (allowed) {
                const mod = {
                  id: {
                    group: "basic",
                    item: modWord,
                  },
                  pre: `\\${modWord}{`,
                  post: "}",
                };

                parent.children.splice(zymbolIndex, 1);

                if (isSymbolZymbol(prevZymbol!)) {
                  prevZymbol.toggleModifier(mod);
                } else if (isSuperSub(prevZymbol!) && zymbolIndex > 1) {
                  const prevPrevZymbol = parent.children[
                    zymbolIndex - 2
                  ] as Zymbol;

                  if (isSymbolZymbol(prevPrevZymbol)) {
                    prevPrevZymbol.toggleModifier(mod);
                  }
                }

                cursorCopy.pop();
                root.recursivelyReIndexChildren();

                return [
                  new BasicZymbolTreeTransformation({
                    newTreeRoot: root as Zocket,
                    cursor: recoverAllowedCursor(cursorCopy, root),
                    priority: {
                      rank,
                      cost: 100,
                    },
                  }),
                ];
              }
            } else if ([PRIME_DELIM, UN_PRIME_DELIM].includes(firstWord)) {
              parent.children.splice(zymbolIndex, 1);

              if (isSymbolZymbol(prevZymbol!)) {
                const lastPrime = prevZymbol.getModsByGroup(PRIME_GROUP)[0];
                prevZymbol.removeGroupMods(PRIME_GROUP);

                if (firstWord === PRIME_DELIM) {
                  if (lastPrime) {
                    const lastNum = lastPrime.id.item as number;

                    prevZymbol.addModifier(genPrimeMod(lastNum + 1));
                  } else {
                    prevZymbol.addModifier(genPrimeMod(1));
                  }
                } else {
                  if (lastPrime && lastPrime.id.item > 0) {
                    const lastNum = lastPrime.id.item as number;

                    prevZymbol.addModifier(genPrimeMod(lastNum - 1));
                  }
                }
              }

              cursorCopy.pop();
              root.recursivelyReIndexChildren();

              return [
                new BasicZymbolTreeTransformation({
                  newTreeRoot: root as Zocket,
                  cursor: recoverAllowedCursor(cursorCopy, root),
                  priority: {
                    rank: ZymbolTransformRank.Suggest,
                    cost: 100,
                  },
                }),
              ];
            }
          }

          return [];
        },
      })
    );
  };
}

export const dotModifiers = new DotModifiers();
