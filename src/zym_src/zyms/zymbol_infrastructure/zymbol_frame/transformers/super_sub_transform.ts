import { last } from "../../../../../global_utils/array_utils";
import { splitCursorStringAtLastWord } from "../../../../../global_utils/text_utils";
import { Zentinel } from "../../../../../zym_lib/zentinel/zentinel";
import {
  SuperSubZymbol,
  SUPER_SUB_ID,
} from "../../../zymbol/zymbols/super_sub";
import { Zocket } from "../../../zymbol/zymbols/zocket/zocket";
import {
  BasicZymbolTreeTransformation,
  CreateTransformerMessage,
  ZymbolTransformRank,
} from "../zymbol_frame";
import { getTransformTextZymbolAndParent } from "./transform_utils";

const SUPER_DELIM = "^";
const SUB_DELIM = "_";

const SUPER_SUB_TRANSFORM = "super-sub-transform";

class SuperSubTransform extends Zentinel {
  zyId: string = SUPER_SUB_TRANSFORM;

  onRegistration = async () => {
    this.callHermes(
      CreateTransformerMessage.registerTransformer({
        source: SUPER_SUB_TRANSFORM,
        name: "super-sub-transform",
        transform: (root, cursor) => {
          const transformText = getTransformTextZymbolAndParent(root, cursor);

          if (transformText.isTextZymbol) {
            const { text, parent } = transformText;

            const fullText = text.getText();
            const textIndex = last(cursor, 2);

            if (textIndex > 0) {
              const cursorCopy = [...cursor];
              const { word, before, after } = splitCursorStringAtLastWord(
                fullText,
                last(cursor)
              );

              /* We only transform if the delim starts the text */
              if (before) return [];

              if ([SUB_DELIM, SUPER_DELIM].includes(word)) {
                let isSuper = false;
                if (word === SUPER_DELIM) isSuper = true;

                const alreadySuperSub =
                  parent.children[textIndex - 1].getMasterId() === SUPER_SUB_ID;

                let superSub: SuperSubZymbol;

                if (alreadySuperSub) {
                  superSub = parent.children[textIndex - 1] as SuperSubZymbol;
                } else {
                  superSub = new SuperSubZymbol(
                    root.parentFrame,
                    textIndex,
                    parent
                  );
                  parent.children.splice(textIndex, 0, superSub);

                  parent.reIndexChildren();
                }

                cursorCopy.pop();
                cursorCopy.pop();

                const newRelativeChildCursor = superSub.addChild(isSuper);
                cursorCopy.push(
                  superSub.getCursorIndex(),
                  ...newRelativeChildCursor
                );

                if (after) {
                  text.setText(after);
                } else {
                  parent.children.splice(superSub.getCursorIndex() + 1, 1);
                }

                console.log("ROOT", root);

                return [
                  new BasicZymbolTreeTransformation({
                    newTreeRoot: root as Zocket,
                    cursor: cursorCopy,
                    priority: {
                      rank: ZymbolTransformRank.Suggest,
                      cost: 100,
                    },
                  }),
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

export const superSubTransform = new SuperSubTransform();
