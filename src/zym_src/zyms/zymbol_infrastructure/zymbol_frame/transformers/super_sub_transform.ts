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
import {
  getTransformTextZymbolAndParent,
  makeHelperCursor,
  recoverAllowedCursor,
} from "./transform_utils";

const SUPER_DELIMS = ["^", "tt"];
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
          cursor = makeHelperCursor(cursor, root);
          const transformText = getTransformTextZymbolAndParent(root, cursor);

          if (transformText.isTextZymbol) {
            const { text, parent } = transformText;

            const word = text.getText();
            const textIndex = last(cursor, 2);

            if (textIndex > 0) {
              const cursorCopy = [...cursor];

              if ([SUB_DELIM, ...SUPER_DELIMS].includes(word)) {
                let isSuper = false;
                if (SUPER_DELIMS.includes(word)) isSuper = true;

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

                const newRelativeChildCursor = superSub.addChild(isSuper);

                cursorCopy.splice(
                  cursorCopy.length - 2,
                  2,
                  superSub.getCursorIndex(),
                  ...newRelativeChildCursor
                );

                parent.children.splice(superSub.getCursorIndex() + 1, 1);

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
          }

          return [];
        },
      })
    );
  };
}

export const superSubTransform = new SuperSubTransform();
