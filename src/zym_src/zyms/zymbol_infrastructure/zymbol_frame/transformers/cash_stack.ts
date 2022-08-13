import { Zentinel } from "../../../../../zym_lib/zentinel/zentinel";
import {
  checkStackOperator,
  StackPosition,
  StackZymbol,
} from "../../../zymbol/zymbols/stack_zymbol";
import { Zocket } from "../../../zymbol/zymbols/zocket/zocket";
import {
  BasicZymbolTreeTransformation,
  TransformerMessage,
  ZymbolTransformRank,
} from "../zymbol_frame";
import {
  getTransformTextZymbolAndParent,
  makeHelperCursor,
  recoverAllowedCursor,
} from "./transform_utils";

const CASH_STACK = "cash-stack-trans";

const CASH_DELIM = "$";

class CashStack extends Zentinel {
  zyId: string = CASH_STACK;

  onRegistration = async () => {
    this.callHermes(
      TransformerMessage.registerTransformer({
        source: CASH_STACK,
        name: "cash-stack",
        transform: (root, cursor) => {
          cursor = makeHelperCursor(cursor, root);

          const cursorCopy = [...cursor];

          const textTransform = getTransformTextZymbolAndParent(root, cursor);

          if (textTransform.isTextZymbol) {
            const { text, parent } = textTransform;

            const word = text.getText().trim();

            if (word.startsWith(CASH_DELIM)) {
              const op = word.slice(1);

              let rank = ZymbolTransformRank.Suggest;

              if (op.length > 2) {
                rank = ZymbolTransformRank.Suggest;
              }

              if (checkStackOperator(op)) {
                cursorCopy.pop();

                const stackPointer = cursorCopy.pop()!;
                const parentZocket = text.parent as Zocket;

                parentZocket.children.splice(
                  stackPointer,
                  1,
                  new StackZymbol(op, root.parentFrame, 0, parent)
                );

                cursorCopy.push(...[stackPointer, StackPosition.TOP, 0]);

                root.recursivelyReIndexChildren();

                return [
                  new BasicZymbolTreeTransformation({
                    newTreeRoot: root as Zocket,
                    cursor: recoverAllowedCursor(cursorCopy, root),
                    priority: {
                      rank: rank,
                      cost: -500,
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

export const cashStack = new CashStack();
