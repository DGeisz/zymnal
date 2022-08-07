import { last } from "../../../../../global_utils/array_utils";
import { splitCursorStringAtLastWord } from "../../../../../global_utils/text_utils";
import { Zentinel } from "../../../../../zym_lib/zentinel/zentinel";
import { extendParentCursor } from "../../../../../zym_lib/zy_god/cursor/cursor";
import { Zymbol } from "../../../zymbol/zymbol";
import {
  TextZymbol,
  TEXT_ZYMBOL_NAME,
} from "../../../zymbol/zymbols/text_zymbol/text_zymbol";
import { Zocket, ZymbolModifier } from "../../../zymbol/zymbols/zocket/zocket";
import {
  BasicZymbolTreeTransformation,
  CreateTransformerMessage,
  ZymbolTransformRank,
  ZymbolTreeTransformation,
} from "../zymbol_frame";
import {
  getTransformTextZymbolAndParent,
  makeHelperCursor,
  recoverAllowedCursor,
  zymbolIsBinaryOperator,
} from "./transform_utils";

const LEFT_PARENTHESIS = "(";
const RIGHT_PARENTHESIS = ")";

const ParenthesisMod: ZymbolModifier = {
  id: {
    group: "wrap",
    item: "parenthesis",
  },
  pre: "\\left(",
  post: "\\right)",
};

export const PARENTHESIS_TRANSFORM = "par-trans-t23dki";

class Parenthesis extends Zentinel {
  zyId: string = PARENTHESIS_TRANSFORM;

  onRegistration = async () => {
    this.callHermes(
      CreateTransformerMessage.registerTransformer({
        source: PARENTHESIS_TRANSFORM,
        name: "par-trans",
        transform: async (root, cursor) => {
          cursor = makeHelperCursor(cursor, root);
          const allTransformations: ZymbolTreeTransformation[] = [];
          const zymbolIndex = last(cursor, 2);
          const i = last(cursor);

          /* First make a copy of the root */
          const rootCopy = (await root.clone(1, root.parent))[0] as Zymbol;

          /* Handle the parenthesis that groups by operators */
          if (zymbolIndex > 0) {
            {
              const cursorCopy = [...cursor];
              const transformText = getTransformTextZymbolAndParent(
                rootCopy,
                cursorCopy
              );

              if (transformText.isTextZymbol) {
                const { text, parent } = transformText;

                const {
                  word,
                  before: rightBefore,
                  after: rightAfter,
                } = splitCursorStringAtLastWord(text.getText(), i);

                if (word === RIGHT_PARENTHESIS) {
                  // debugger;

                  /* First we're going to wrap around a single operator */
                  let k = zymbolIndex - 1;
                  let foundOperator = false;
                  let startIndex = 0;

                  while (k >= 0) {
                    if (zymbolIsBinaryOperator(parent.children[k])) {
                      if (foundOperator) {
                        startIndex = k + 1;
                        break;
                      } else {
                        foundOperator = true;
                      }
                    }

                    k--;
                  }

                  const newChildren = parent.children.slice(
                    startIndex,
                    zymbolIndex
                  );

                  if (rightBefore) {
                    const txt = new TextZymbol(parent.parentFrame, 0, parent);
                    txt.setText(rightBefore);

                    newChildren.push(txt);
                  }

                  parent.children.splice(
                    startIndex,
                    1 + zymbolIndex - startIndex
                  );

                  if (rightAfter) {
                    const txt = new TextZymbol(parent.parentFrame, 0, parent);
                    txt.setText(rightAfter);

                    parent.children.splice(k, 0, txt);
                  }

                  const newZocket = new Zocket(parent.parentFrame, 0, parent);
                  newZocket.children = newChildren as Zymbol[];
                  newZocket.reConnectParentChildren();

                  newZocket.toggleModifier(ParenthesisMod);

                  parent.children.splice(startIndex, 0, newZocket);

                  const cc2 = [...cursorCopy];
                  cc2.splice(cc2.length - 2, 2);

                  console.log("ccc", cc2, cursorCopy);

                  rootCopy.recursivelyReIndexChildren();

                  console.log(
                    "pn",
                    parent.getFullCursorPointer(),
                    newZocket.getFullCursorPointer()
                  );

                  allTransformations.push(
                    new BasicZymbolTreeTransformation({
                      newTreeRoot: rootCopy as Zocket,
                      cursor: recoverAllowedCursor(
                        [...cc2, startIndex + 1],
                        rootCopy
                      ),
                      priority: {
                        rank: ZymbolTransformRank.Suggest,
                        cost: 150,
                      },
                    })
                  );
                }
              }
            }
            {
              const transformText = getTransformTextZymbolAndParent(
                root,
                cursor
              );

              if (transformText.isTextZymbol) {
                const { text, parent } = transformText;
                const {
                  word,
                  before: rightBefore,
                  after: rightAfter,
                } = splitCursorStringAtLastWord(text.getText(), i);

                const cursorCopy = [...cursor];

                if (word === RIGHT_PARENTHESIS) {
                  /* Check if there's a left parenthesis that we're missing */
                  for (let k = 0; k < zymbolIndex; k++) {
                    const child = parent.children[k];

                    if (child.getMasterId() === TEXT_ZYMBOL_NAME) {
                      const newText = child as TextZymbol;
                      const words = newText.getText().split(/\s/);

                      const openIndex = words.indexOf(LEFT_PARENTHESIS);

                      if (openIndex > -1) {
                        cursorCopy.splice(cursorCopy.length - 2, 2);

                        let newPointer = k + 1;

                        const { before: leftBefore, after: leftAfter } =
                          splitCursorStringAtLastWord(
                            newText.getText(),
                            openIndex + 1
                          );

                        /* Now create the new children */
                        const newChildren = parent.children.slice(
                          k + 1,
                          zymbolIndex
                        );

                        if (rightBefore) {
                          const txt = new TextZymbol(
                            parent.parentFrame,
                            0,
                            parent
                          );
                          txt.setText(rightBefore);

                          newChildren.push(txt);
                        }

                        if (leftAfter) {
                          const txt = new TextZymbol(
                            parent.parentFrame,
                            0,
                            parent
                          );
                          txt.setText(leftAfter);

                          newChildren.unshift(txt);
                        }

                        /* Doctor the old children */
                        parent.children.splice(k, 1 + zymbolIndex - k);

                        if (rightAfter) {
                          const txt = new TextZymbol(
                            parent.parentFrame,
                            0,
                            parent
                          );
                          txt.setText(rightAfter);

                          parent.children.splice(k, 0, txt);
                        }

                        const newZocket = new Zocket(
                          parent.parentFrame,
                          0,
                          parent
                        );
                        newZocket.children = newChildren as Zymbol[];

                        parent.children.splice(k, 0, newZocket);

                        if (leftBefore) {
                          const txt = new TextZymbol(
                            parent.parentFrame,
                            0,
                            parent
                          );
                          txt.setText(leftBefore);
                          newPointer++;

                          parent.children.splice(k, 0, txt);
                        }

                        parent.reIndexChildren();
                        newZocket.reIndexChildren();

                        newZocket.toggleModifier(ParenthesisMod);

                        root.recursivelyReIndexChildren();

                        allTransformations.push(
                          new BasicZymbolTreeTransformation({
                            newTreeRoot: root as Zocket,
                            cursor: recoverAllowedCursor(
                              extendParentCursor(newPointer, cursorCopy),
                              root
                            ),
                            priority: {
                              rank: ZymbolTransformRank.Suggest,
                              cost: 100,
                            },
                          })
                        );

                        break;
                      }
                    }
                  }
                }
              }
            }
          }

          /* Handle the parenthesis when we already have a left parenthesis */
          return allTransformations;
        },
      })
    );
  };
}

export const parenthesisModifiers = new Parenthesis();
