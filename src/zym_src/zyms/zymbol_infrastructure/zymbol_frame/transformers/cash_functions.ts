import { last } from "../../../../../global_utils/array_utils";
import { Zentinel } from "../../../../../zym_lib/zentinel/zentinel";
import { Zymbol } from "../../../zymbol/zymbol";
import { FunctionZymbol } from "../../../zymbol/zymbols/function_zymbol/function_zymbol";
import {
  TextZymbol,
  TEXT_ZYMBOL_NAME,
} from "../../../zymbol/zymbols/text_zymbol/text_zymbol";
import { Zocket } from "../../../zymbol/zymbols/zocket/zocket";
import {
  BasicZymbolTreeTransformation,
  CreateTransformerMessage,
  ZymbolTransformRank,
} from "../zymbol_frame";

const CASH_FUNCTIONS = "cash-functions";

class CashFunction extends Zentinel {
  zyId: string = CASH_FUNCTIONS;

  onRegistration = async () => {
    this.callHermes(
      CreateTransformerMessage.registerTransformer({
        source: CASH_FUNCTIONS,
        name: "cash-fun",
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

          const zymbolIndex: number = last(cursorCopy, 2);

          /* Handle fractions */
          if (currZymbol.getMasterId() === TEXT_ZYMBOL_NAME) {
            const text = currZymbol as TextZymbol;

            const fullText = text.getText();

            const firstWord = fullText.split(/\s+/).filter((t) => !!t)[0];

            if (firstWord === "//") {
              const fraction = new FunctionZymbol(
                "frac",
                2,
                root.parentFrame,
                0,
                parent
              );

              if (zymbolIndex > 0) {
                fraction.children[0].children = [
                  parent.children[zymbolIndex - 1],
                ];

                parent.children.splice(zymbolIndex - 1, 1, fraction);

                text.setText(fullText.trimStart().slice(2));

                cursorCopy.pop();
                cursorCopy.pop();

                cursorCopy.push(...[zymbolIndex - 1, 1, 0]);

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
              } else {
                parent.children.unshift(fraction);

                const newText = fullText.trimStart().slice(2);

                if (newText) {
                  text.setText(newText);
                } else {
                  parent.children.splice(1, 1);
                }

                cursorCopy.pop();
                cursorCopy.pop();

                cursorCopy.push(...[0, 0, 0]);

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

export const cashFunction = new CashFunction();
