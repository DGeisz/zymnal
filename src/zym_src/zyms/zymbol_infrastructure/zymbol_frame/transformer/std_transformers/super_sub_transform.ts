import { last } from "../../../../../../global_utils/array_utils";
import { Zentinel } from "../../../../../../zym_lib/zentinel/zentinel";
import { SuperSubZymbol } from "../../../../zymbol/zymbols/super_sub/super_sub";
import { isSuperSub } from "../../../../zymbol/zymbols/super_sub/super_sub_schema";
import { Zocket } from "../../../../zymbol/zymbols/zocket/zocket";
import { ZymbolFrameMethod } from "../../zymbol_frame_schema";
import {
  BasicZymbolTreeTransformation,
  ZymbolTransformRank,
} from "../transformer";
import {
  getTransformTextZymbolAndParent,
  makeHelperCursor,
  recoverAllowedCursor,
} from "./transform_utils";

const SUPER_DELIM = "^";
const SUB_DELIM = "_";

const SUPER_SUB_TRANSFORM = "super-sub-transform";

class SuperSubTransform extends Zentinel<{}> {
  zyId: string = SUPER_SUB_TRANSFORM;

  onRegistration = async () => {
    this.callZentinelMethod(ZymbolFrameMethod.registerTransformer, {
      source: SUPER_SUB_TRANSFORM,
      name: "super-sub-transform",
      transform: (root, cursor) => {
        cursor = makeHelperCursor(cursor, root);
        const transformText = getTransformTextZymbolAndParent(root, cursor);

        if (transformText.isTextZymbol) {
          const { text, parent } = transformText;

          const fullText = text.getText();

          /* Indicates whether this standalone is unto itself */
          const standalone = /^\s/.test(fullText);

          const word = fullText.trim();
          const textIndex = last(cursor, 2);

          const cursorCopy = [...cursor];

          if ([SUB_DELIM, SUPER_DELIM].includes(word)) {
            let isSuper = false;
            if (SUPER_DELIM === word) isSuper = true;

            if (textIndex > 0) {
              let superSub: SuperSubZymbol;
              const alreadySuperSub = isSuperSub(
                parent.children[textIndex - 1]
              );

              if (alreadySuperSub && !standalone) {
                superSub = parent.children[textIndex - 1] as SuperSubZymbol;
              } else {
                superSub = new SuperSubZymbol(
                  root.parentFrame,
                  textIndex,
                  parent
                );

                superSub.standalone = standalone;

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
            } else {
              const superSub = new SuperSubZymbol(
                root.parentFrame,
                textIndex,
                parent
              );

              superSub.standalone = true;

              parent.children.splice(textIndex, 0, superSub);

              parent.reIndexChildren();

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
    });
  };
}

export const superSubTransform = new SuperSubTransform();
