import { Zentinel } from "../../../../../../../../zym_lib/zentinel/zentinel";
import {
  BASIC_MATRIX_WRAPPER,
  MATRIX_MAP,
  MATRIX_MAP_LABELS,
  MatrixWrapperTex,
} from "../../../../../../zymbol/zymbols/matrix_zymbol/matrix_zymbol_schema";
import { MatrixZymbol } from "../../../../../../zymbol/zymbols/matrix_zymbol/matrix_zymbol";
import { Zocket } from "../../../../../../zymbol/zymbols/zocket/zocket";
import { ZymbolFrameMethod } from "../../../../zymbol_frame_schema";
import {
  BasicZymbolTreeTransformation,
  ZymbolTransformRank,
} from "../../../transformer";
import { STD_TRANSFORMER_TYPE_FILTERS } from "../../std_transformer_type_filters";
import {
  getTransformTextZymbolAndParent,
  makeHelperCursor,
  recoverAllowedCursor,
} from "../../transform_utils";

export const MATRIX_TRANSFORMER = "mat-trans";

class MatrixTransformer extends Zentinel {
  zyId = MATRIX_TRANSFORMER;

  onRegistration = async () => {
    this.callZentinelMethod(ZymbolFrameMethod.registerTransformer, {
      source: MATRIX_TRANSFORMER,
      name: "fn-trans",
      typeFilters: [STD_TRANSFORMER_TYPE_FILTERS.EQUATION],
      transform: async (root, cursor) => {
        cursor = makeHelperCursor(cursor, root);
        const universalCursorCopy = [...cursor];

        const cursorCopy = [...universalCursorCopy];

        const textTransform = getTransformTextZymbolAndParent(root, cursorCopy);

        if (textTransform.isTextZymbol) {
          const { text, parent } = textTransform;
          const mat = text.getText().trim();

          let rank = ZymbolTransformRank.Suggest;

          if (MATRIX_MAP_LABELS.includes(mat)) {
            cursorCopy.pop();

            const textPointer = cursorCopy.pop()!;
            const parentZocket = text.parent as Zocket;

            let newTextPointer = textPointer + 1;

            const wrapper = MATRIX_MAP[mat];

            const matrix = new MatrixZymbol(
              wrapper,
              root.parentFrame,
              0,
              parent
            );

            parentZocket.children.splice(textPointer, 1, matrix);

            cursorCopy.push(...[newTextPointer - 1, 0, 0]);

            root.recursivelyReIndexChildren();

            return [
              new BasicZymbolTreeTransformation({
                newTreeRoot: root as Zocket,
                cursor: recoverAllowedCursor(cursorCopy, root),
                previewZymbol: matrix,
                priority: {
                  rank: rank,
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

export const matrixTransformer = new MatrixTransformer();
