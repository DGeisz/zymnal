import { last } from "../../../../global_utils/array_utils";
import { checkLatex } from "../../../../global_utils/latex_utils";
import { Zentinel } from "../../../../zym_lib/zentinel/zentinel";
import { Zymbol } from "../../../zyms/zymbol/zymbol";
import {
  ModifierZymbol,
  MODIFIER_ZYMBOL_ID,
} from "../../../zyms/zymbol/zymbols/modifier_zymbol/modifier_zymbol";
import {
  TextZymbol,
  TEXT_ZYMBOL_NAME,
} from "../../../zyms/zymbol/zymbols/text_zymbol/text_zymbol";
import { Zocket } from "../../../zyms/zymbol/zymbols/zocket/zocket";
import { CreateTransformerMessage, ZymbolTransformRank } from "../transformer";

export const DOT_MODIFIERS_TRANSFORM = "dot-modifiers-e1125";

const dot = ".";

const dotMap: { [key: string]: string } = {
  vc: "vec",
  ht: "hat",
  dt: "dot",
  ddt: "ddot",
  ul: "underline",
  bd: "bold",
};

const suggestedMods = Object.values(dotMap);

const dotKeys = Object.keys(dotMap);

function checkMod(mod: string): boolean {
  return checkLatex(`\\${mod}{a}`) && !checkLatex(`\\${mod}`);
}

class DotModifiers extends Zentinel {
  zyId: string = DOT_MODIFIERS_TRANSFORM;

  onRegistration = async () => {
    this.callHermes(
      CreateTransformerMessage.registerTransformer({
        source: DOT_MODIFIERS_TRANSFORM,
        name: "dot-mod",
        transform: (root, cursor) => {
          const cursorCopy = [...cursor];

          console.log("zrc pro", root);

          /* First we want to get to the parent */
          let currZymbol = root;
          let parent = root;

          for (let i = 0; i < cursorCopy.length - 1; i++) {
            parent = currZymbol;
            currZymbol = parent.children[cursorCopy[i]] as Zymbol;

            if (!currZymbol) {
              return [];
            }
          }

          const zymbolIndex: number = last(cursorCopy, 2);

          if (
            zymbolIndex > 0 &&
            currZymbol.getMasterId() === TEXT_ZYMBOL_NAME
          ) {
            const prevZymbol = parent.children[zymbolIndex - 1] as Zymbol;

            const text = currZymbol as TextZymbol;

            const firstWord = text
              .getText()
              .split(/\s+/)
              .filter((t) => !!t)[0];

            if (firstWord && firstWord.startsWith(dot)) {
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

                const remainingText = text.getText().slice(firstWord.length);

                if (prevZymbol.getMasterId() === MODIFIER_ZYMBOL_ID) {
                  // if ((prevZymbol as ModifierZymbol).modifiers.length === 1) {
                  //   // debugger;
                  // }
                  (prevZymbol as ModifierZymbol).toggleModifier(mod);
                } else {
                  const modZym = new ModifierZymbol(
                    text.parentFrame,
                    zymbolIndex - 1,
                    parent
                  );

                  modZym.modZocket.children = [prevZymbol];
                  modZym.modZocket.reIndexChildren();

                  modZym.toggleModifier(mod);

                  parent.children[zymbolIndex - 1] = modZym;
                }

                text.setText(remainingText);

                cursorCopy.pop();

                return [
                  {
                    newTreeRoot: root as Zocket,
                    cursor: cursorCopy,
                    priority: {
                      rank,
                      cost: 100,
                    },
                  },
                ];
              }
            }
          }

          return [];
        },
      })
    );
  };
}

export const dotModifiers = new DotModifiers();
