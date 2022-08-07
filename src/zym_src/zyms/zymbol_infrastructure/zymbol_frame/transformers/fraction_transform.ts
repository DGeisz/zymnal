import { last } from "../../../../../global_utils/array_utils";
import { Zentinel } from "../../../../../zym_lib/zentinel/zentinel";
import { FunctionZymbol } from "../../../zymbol/zymbols/function_zymbol/function_zymbol";
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

const FRACTION = "fraction-transform";

const fractionDelim = "//";

class Fraction extends Zentinel {
  zyId: string = FRACTION;

  onRegistration = async () => {
    this.callHermes(
      CreateTransformerMessage.registerTransformer({
        source: FRACTION,
        name: "fraction",
        transform: (root, cursor) => {
          cursor = makeHelperCursor(cursor, root);
          const cursorCopy = [...cursor];

          const transformText = getTransformTextZymbolAndParent(
            root,
            cursorCopy
          );

          /* First we want to get to the parent */
          const zymbolIndex: number = last(cursorCopy, 2);

          /* Handle fractions */
          if (transformText.isTextZymbol) {
            const { text, parent } = transformText;

            const fullText = text.getText();

            const firstWord = fullText.split(/\s+/).filter((t) => !!t)[0];

            if (firstWord === fractionDelim) {
              const fraction = new FunctionZymbol(
                "frac",
                2,
                root.parentFrame,
                0,
                parent
              );

              if (zymbolIndex > 0) {
                text.setText(fullText.trimStart().slice(2));

                /* Check if we want to do a full fraction, or a single symbol fraction */
                if (fullText.startsWith(fractionDelim)) {
                  fraction.children[0].children = [
                    parent.children[zymbolIndex - 1],
                  ];

                  parent.children.splice(zymbolIndex - 1, 1, fraction);

                  cursorCopy.pop();
                  cursorCopy.pop();

                  cursorCopy.push(...[zymbolIndex - 1, 1, 0]);
                } else {
                  fraction.children[0].children = parent.children.slice(
                    0,
                    zymbolIndex
                  );

                  parent.children = parent.children.slice(zymbolIndex);
                  parent.children.unshift(fraction);

                  cursorCopy.pop();
                  cursorCopy.pop();

                  cursorCopy.push(...[0, 1, 0]);
                }

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

export const fraction = new Fraction();
