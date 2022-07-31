import { last } from "../../../../../global_utils/array_utils";
import { checkLatex } from "../../../../../global_utils/latex_utils";
import { splitCursorStringAtLastWord } from "../../../../../global_utils/text_utils";
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
  CreateTransformerMessage,
  ZymbolTransformRank,
} from "../zymbol_frame";

const CASH_FUNCTIONS = "cash-fractions";

const cash = "$";

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

class CashFunctions extends Zentinel {
  zyId: string = CASH_FUNCTIONS;

  onRegistration = async () => {
    this.callHermes(
      CreateTransformerMessage.registerTransformer({
        source: CASH_FUNCTIONS,
        name: "cash-fn",
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

          if (currZymbol.getMasterId() === TEXT_ZYMBOL_NAME) {
            const i = last(cursorCopy);
            const text = currZymbol as TextZymbol;

            const { word, before, after } = splitCursorStringAtLastWord(
              text.getText(),
              i
            );

            let rank = ZymbolTransformRank.Include;

            if (word.startsWith(cash)) {
              const fn = word.slice(1);

              const numArgs = getTexFunctionArgCount(fn);

              if (numArgs > 0) {
                cursorCopy.pop();

                const textPointer = cursorCopy.pop()!;
                const parentZocket = text.parent as Zocket;

                const newZym = [];
                let newTextPointer = textPointer + 1;

                if (before) {
                  const txt1 = new TextZymbol(
                    parentZocket.parentFrame,
                    textPointer,
                    parentZocket
                  );

                  txt1.setText(before);

                  newZym.push(txt1);
                  newTextPointer++;
                }

                const fnZym = new FunctionZymbol(
                  fn,
                  numArgs,
                  root.parentFrame,
                  0,
                  parent
                );

                newZym.push(fnZym);

                if (after) {
                  const txt2 = new TextZymbol(
                    parentZocket.parentFrame,
                    textPointer + 2,
                    parentZocket
                  );

                  txt2.setText(after);

                  newZym.push(txt2);
                }

                parentZocket.children.splice(textPointer, 1, ...newZym);

                cursorCopy.push(...[newTextPointer - 1, 0, 0]);

                return [
                  new BasicZymbolTreeTransformation({
                    newTreeRoot: root as Zocket,
                    cursor: cursorCopy,
                    priority: {
                      rank: rank,
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

export const cashFunctions = new CashFunctions();
