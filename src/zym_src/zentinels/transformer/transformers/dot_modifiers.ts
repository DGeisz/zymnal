import { last } from "../../../../global_utils/array_utils";
import { Zentinel } from "../../../../zym_lib/zentinel/zentinel";
import { Zymbol } from "../../../zyms/zymbol/zymbol";
import {
  BasicModifierId,
  BasicZymbolModifiers,
  ModifierZymbol,
  MODIFIER_ZYMBOL_ID,
} from "../../../zyms/zymbol/zymbols/modifier_zymbol/modifier_zymbol";
import {
  TextZymbol,
  TEXT_ZYMBOL_NAME,
} from "../../../zyms/zymbol/zymbols/text_zymbol/text_zymbol";
import { CreateTransformerMessage } from "../transformer";

export const DOT_MODIFIERS_TRANSFORM = "dot-modifiers-e1125";

const dot = ".";

const dotMap: { [key: string]: BasicModifierId } = {
  vec: BasicModifierId.Vec,
  vc: BasicModifierId.Vec,
  hat: BasicModifierId.Hat,
  ht: BasicModifierId.Hat,
  dot: BasicModifierId.Dot,
  dt: BasicModifierId.Dot,
  ddot: BasicModifierId.DDot,
  ddt: BasicModifierId.DDot,
  underline: BasicModifierId.Underline,
  ul: BasicModifierId.Underline,
  bold: BasicModifierId.Bold,
  bd: BasicModifierId.Bold,
};

const dotKeys = Object.keys(dotMap);

class DotModifiers extends Zentinel {
  zyId: string = DOT_MODIFIERS_TRANSFORM;

  onRegistration = async () => {
    this.callHermes(
      CreateTransformerMessage.registerTransformer({
        source: DOT_MODIFIERS_TRANSFORM,
        name: "dot-mod",
        transform: (root, cursor) => {
          const cursorCopy = [...cursor];

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

          const zymbolIndex = last(cursorCopy, 2);

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

            if (
              firstWord &&
              firstWord.startsWith(dot) &&
              dotKeys.includes(firstWord.slice(1))
            ) {
              const mod = BasicZymbolModifiers[dotMap[firstWord.slice(1)]];

              const remainingText = text.getText().slice(firstWord.length);

              /* TODO: Add behavior where we can get rid of a modifier if it already exists */
              if (prevZymbol.getMasterId() === MODIFIER_ZYMBOL_ID) {
                (prevZymbol as ModifierZymbol).addModifier(mod);
              } else {
                const modZym = new ModifierZymbol(
                  text.parentFrame,
                  zymbolIndex - 1,
                  parent
                );

                modZym.modZocket.children = [prevZymbol];
                modZym.modZocket.reIndexChildren();
                modZym.addModifier(mod);

                parent.children[zymbolIndex - 1] = modZym;
              }

              text.setText(remainingText);
            }
          }

          return [];
        },
      })
    );
  };
}
