import { Zentinel } from "../../../../../../../../zym_lib/zentinel/zentinel";
import {
  checkStackOperator,
  StackPosition,
  StackZymbol,
} from "../../../../../../zymbol/zymbols/stack_zymbol/stack_zymbol";
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

const CASH_STACK = "cash-stack-trans";

const CASH_DELIM = "$";

const CashSpecialCommands: { [key: string]: string } = {
  fr: "frac",
  cf: "cfrac",
  df: "dfrac",
  bn: "binom",
  ch: "binom",
  tb: "tbinom",
  db: "dbinom",
};

class CashStack extends Zentinel<{}> {
  zyId: string = CASH_STACK;

  onRegistration = async () => {
    this.callZentinelMethod(ZymbolFrameMethod.registerTransformer, {
      source: CASH_STACK,
      name: "cash-stack",
      typeFilters: [STD_TRANSFORMER_TYPE_FILTERS.EQUATION],
      transform(root, cursor) {
        cursor = makeHelperCursor(cursor, root);
        const cursorCopy = [...cursor];

        const textTransform = getTransformTextZymbolAndParent(root, cursor);
        if (!textTransform.isTextZymbol) return [];

        const { text, parent } = textTransform;

        const word = text.getText().trim();

        if (word.startsWith(CASH_DELIM)) {
          let op = word.slice(1);

          if (op in CashSpecialCommands) {
            op = CashSpecialCommands[op];
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
                  rank: ZymbolTransformRank.Suggest,
                  cost: -500,
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

export const cashStack = new CashStack();
