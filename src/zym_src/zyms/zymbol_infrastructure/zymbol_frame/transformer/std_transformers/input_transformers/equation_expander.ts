import { last } from "../../../../../../../global_utils/array_utils";
import {
  splitCursorStringAtLastWord,
  splitCursorStringWithFixedSymbols,
} from "../../../../../../../global_utils/string_utils";
import { Zentinel } from "../../../../../../../zym_lib/zentinel/zentinel";
import { Zymbol } from "../../../../../zymbol/zymbol";
import { TextZymbol } from "../../../../../zymbol/zymbols/text_zymbol/text_zymbol";
import { Zocket } from "../../../../../zymbol/zymbols/zocket/zocket";
import { ZymbolFrameMethod } from "../../../zymbol_frame_schema";
import {
  BasicZymbolTreeTransformation,
  ZymbolTransformRank,
} from "../../transformer";
import { STD_TRANSFORMER_TYPE_FILTERS } from "../std_transformer_type_filters";
import {
  getTransformTextZymbolAndParent,
  makeHelperCursor,
  recoverAllowedCursor,
} from "../transform_utils";

export const EQUATION_EXPANDER = "eq-ex-9f23";
const EQUATION_EXPANDER_DELIM = "$$";

class EquationExpander extends Zentinel {
  zyId: string = EQUATION_EXPANDER;

  onRegistration = async () => {
    this.callZentinelMethod(ZymbolFrameMethod.registerTransformer, {
      source: EQUATION_EXPANDER,
      name: "eq-ex",
      typeFilters: [STD_TRANSFORMER_TYPE_FILTERS.INPUT],
      transform: async (root, cursor) => {
        cursor = makeHelperCursor(cursor, root);
        const cursorCopy = [...cursor];

        const textTransform = getTransformTextZymbolAndParent(root, cursor);

        if (textTransform.isTextZymbol) {
          const { text, parent, zymbolIndex } = textTransform;

          const fullText = text.getText();

          const { word, before, after } = splitCursorStringWithFixedSymbols(
            fullText,
            last(cursor),
            2
          );

          if (word === EQUATION_EXPANDER_DELIM) {
            text.setText(before);

            const newZymbols: Zymbol[] = [
              new Zocket(parent.parentFrame, 0, parent),
            ];

            if (after) {
              const afterText = new TextZymbol(root.parentFrame, 0, parent);
              afterText.setText(after);

              newZymbols.push(afterText);
            }

            parent.children.splice(zymbolIndex + 1, 0, ...newZymbols);

            root.recursivelyReIndexChildren();

            cursorCopy.splice(cursorCopy.length - 2, 2, zymbolIndex + 1, 0);

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
    });
  };
}

export const equationExpander = new EquationExpander();
