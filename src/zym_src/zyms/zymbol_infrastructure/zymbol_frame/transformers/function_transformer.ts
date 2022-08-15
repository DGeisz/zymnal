import { checkLatex } from "../../../../../global_utils/latex_utils";
import { Zentinel } from "../../../../../zym_lib/zentinel/zentinel";
import { Zymbol } from "../../../zymbol/zymbol";
import { FunctionZymbol } from "../../../zymbol/zymbols/function_zymbol/function_zymbol";
import {
  TextZymbol,
  TEXT_ZYMBOL_NAME,
} from "../../../zymbol/zymbols/text_zymbol/text_zymbol";
import { Zocket } from "../../../zymbol/zymbols/zocket/zocket";
import { TeX } from "../../../zymbol/zymbol_types";
import {
  BasicZymbolTreeTransformation,
  ZymbolTransformRank,
} from "../zymbol_frame";
import { ZymbolFrameMethod } from "../zymbol_frame_schema";
import { makeHelperCursor, recoverAllowedCursor } from "./transform_utils";

const FUNCTION_TRANSFORMER = "function-transformer";

const SPECIAL_COMMANDS: { [key: string]: string } = {
  sr: "sqrt",
};

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

class FunctionTransformer extends Zentinel<{}> {
  zyId: string = FUNCTION_TRANSFORMER;

  onRegistration = async () => {
    this.callZentinelMethod(ZymbolFrameMethod.registerTransformer, {
      source: FUNCTION_TRANSFORMER,
      name: "fn-trans",
      transform: (root, cursor) => {
        cursor = makeHelperCursor(cursor, root);

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

        if (currZymbol.getMasterId() === TEXT_ZYMBOL_NAME) {
          const text = currZymbol as TextZymbol;
          const word = text.getText().trim();

          let rank = ZymbolTransformRank.Include;

          let fn;

          if (word in SPECIAL_COMMANDS) {
            fn = SPECIAL_COMMANDS[word];
            rank = ZymbolTransformRank.Suggest;
          } else {
            fn = word;
          }

          if (fn.length > 2) {
            rank = ZymbolTransformRank.Suggest;
          }

          const numArgs = getTexFunctionArgCount(fn);

          if (numArgs > 0) {
            cursorCopy.pop();

            const textPointer = cursorCopy.pop()!;
            const parentZocket = text.parent as Zocket;

            const newZym = [];
            let newTextPointer = textPointer + 1;

            const fnZym = new FunctionZymbol(
              fn,
              numArgs,
              root.parentFrame,
              0,
              parent
            );

            newZym.push(fnZym);

            parentZocket.children.splice(textPointer, 1, ...newZym);

            cursorCopy.push(...[newTextPointer - 1, 0, 0]);

            root.recursivelyReIndexChildren();

            return [
              new BasicZymbolTreeTransformation({
                newTreeRoot: root as Zocket,
                cursor: recoverAllowedCursor(cursorCopy, root),
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

export const functionTransformer = new FunctionTransformer();
