import { checkLatex } from "../../../../../../global_utils/latex_utils";
import { Zentinel } from "../../../../../../zym_lib/zentinel/zentinel";
import { FunctionZymbol } from "../../../../zymbol/zymbols/function_zymbol/function_zymbol";
import { Zocket } from "../../../../zymbol/zymbols/zocket/zocket";
import { TeX } from "../../../../zymbol/zymbol_types";
import { ZymbolFrameMethod } from "../../zymbol_frame_schema";
import {
  BasicZymbolTreeTransformation,
  ZymbolTransformRank,
  ZymbolTreeTransformation,
} from "../transformer";
import {
  getTransformTextZymbolAndParent,
  makeHelperCursor,
  recoverAllowedCursor,
} from "../std_transformers/transform_utils";
import {
  FunctionTransformerMap,
  FunctionTransformerMethodSchema,
  FUNCTION_TRANSFORMER,
} from "./function_transformer_schema";
import _ from "underscore";

function getTexFunctionArgCount(fn: TeX): number {
  const operator = "{a}";
  let tex = `\\${fn}`;

  for (let i = 0; i < 10; i++) {
    if (checkLatex(tex)) {
      return i;
    } else {
      tex += operator;
    }
  }

  return -1;
}

class FunctionTransformer extends Zentinel<FunctionTransformerMethodSchema> {
  zyId: string = FUNCTION_TRANSFORMER;
  functionMaps: FunctionTransformerMap[] = [];

  constructor() {
    super();

    this.setMethodImplementation({
      addFunctionTransformerMap: async (map) => {
        if (!this.functionMaps.some((s) => _.isEqual(map.id, s.id))) {
          this.functionMaps.push(map);
        }
      },
    });
  }

  onRegistration = async () => {
    this.callZentinelMethod(ZymbolFrameMethod.registerTransformer, {
      source: FUNCTION_TRANSFORMER,
      name: "fn-trans",
      transform: async (root, cursor) => {
        cursor = makeHelperCursor(cursor, root);
        const universalCursorCopy = [...cursor];

        const cursorCopy = [...universalCursorCopy];

        const textTransform = getTransformTextZymbolAndParent(root, cursorCopy);
        const allTreeTransformations: ZymbolTreeTransformation[] = [];

        const rootCopies = (await root.clone(
          this.functionMaps.length
        )) as Zocket[];

        if (textTransform.isTextZymbol) {
          const { text, parent } = textTransform;
          const word = text.getText().trim();

          let rank = ZymbolTransformRank.Include;

          const fn = word;
          const numZockets = getTexFunctionArgCount(fn);

          if (fn.length > 2) {
            rank = ZymbolTransformRank.Suggest;
          }

          if (numZockets > 0) {
            cursorCopy.pop();

            const textPointer = cursorCopy.pop()!;
            const parentZocket = text.parent as Zocket;

            const newZym = [];
            let newTextPointer = textPointer + 1;

            const fnZym = new FunctionZymbol(
              fn,
              numZockets,
              {},
              root.parentFrame,
              0,
              parent
            );

            newZym.push(fnZym);

            parentZocket.children.splice(textPointer, 1, ...newZym);

            cursorCopy.push(...[newTextPointer - 1, 0, 0]);

            root.recursivelyReIndexChildren();

            allTreeTransformations.push(
              new BasicZymbolTreeTransformation({
                newTreeRoot: root as Zocket,
                cursor: recoverAllowedCursor(cursorCopy, root),
                priority: {
                  rank: rank,
                  cost: 100,
                },
              })
            );
          }

          this.functionMaps.forEach((functionMap) => {
            const rootCopy = rootCopies.pop()!;
            const cursorCopy = [...universalCursorCopy];

            const { map } = functionMap;

            const textTransform = getTransformTextZymbolAndParent(
              rootCopy,
              cursorCopy
            );

            if (!textTransform.isTextZymbol) return;

            const { text, parent } = textTransform;
            const word = text.getText().trim();

            let fn;
            let numZockets = -1;
            let bracketZockets = {};

            if (word in map) {
              const cmd = map[word];

              if (typeof cmd === "string") {
                fn = cmd;
                numZockets = getTexFunctionArgCount(fn);
              } else {
                fn = cmd.tex;
                bracketZockets = cmd.bracketZockets;
                numZockets = cmd.numZockets;
              }
            }

            if (fn && numZockets > 0) {
              cursorCopy.pop();

              const textPointer = cursorCopy.pop()!;
              const parentZocket = text.parent as Zocket;

              const newZym = [];
              let newTextPointer = textPointer + 1;

              const fnZym = new FunctionZymbol(
                fn,
                numZockets,
                bracketZockets,
                rootCopy.parentFrame,
                0,
                parent
              );

              newZym.push(fnZym);

              parentZocket.children.splice(textPointer, 1, ...newZym);

              cursorCopy.push(...[newTextPointer - 1, 0, 0]);

              rootCopy.recursivelyReIndexChildren();

              allTreeTransformations.push(
                new BasicZymbolTreeTransformation({
                  newTreeRoot: rootCopy as Zocket,
                  cursor: recoverAllowedCursor(cursorCopy, rootCopy),
                  priority: {
                    rank: ZymbolTransformRank.Suggest,
                    cost: 100,
                  },
                })
              );
            }
          });
        }

        return allTreeTransformations;
      },
    });
  };
}

export const functionTransformer = new FunctionTransformer();
