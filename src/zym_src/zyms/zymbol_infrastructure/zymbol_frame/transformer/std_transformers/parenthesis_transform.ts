import { last } from "../../../../../../global_utils/array_utils";
import { splitCursorStringAtLastWord } from "../../../../../../global_utils/text_utils";
import { Zentinel } from "../../../../../../zym_lib/zentinel/zentinel";
import { Zym } from "../../../../../../zym_lib/zym/zym";
import {
  Cursor,
  extendParentCursor,
} from "../../../../../../zym_lib/zy_god/cursor/cursor";
import {
  KeyPressBasicType,
  KeyPressComplexType,
  ZymKeyPress,
} from "../../../../../../zym_lib/zy_god/event_handler/key_press";
import { Zymbol } from "../../../../zymbol/zymbol";
import { ParenthesisZymbol } from "../../../../zymbol/zymbols/parenthesis_zymbol/parenthesis_zymbol";
import { zymbolIsBinaryOperator } from "../../../../zymbol/zymbols/symbol_zymbol/symbol_zymbol_schema";
import { TextZymbol } from "../../../../zymbol/zymbols/text_zymbol/text_zymbol";
import { TEXT_ZYMBOL_NAME } from "../../../../zymbol/zymbols/text_zymbol/text_zymbol_schema";
import { Zocket } from "../../../../zymbol/zymbols/zocket/zocket";
import { ZymbolFrameMethod } from "../../zymbol_frame_schema";
import {
  BasicZymbolTreeTransformation,
  ZymbolTransformRank,
  ZymbolTreeTransformation,
  ZymbolTreeTransformationPriority,
} from "../transformer";
import {
  getTransformTextZymbolAndParent,
  makeHelperCursor,
  recoverAllowedCursor,
} from "./transform_utils";

const LEFT_PARENTHESIS = "(";
const RIGHT_PARENTHESIS = ")";

const BIG_RIGHT_PARENTHESIS = "))";

const rightPar = [RIGHT_PARENTHESIS, BIG_RIGHT_PARENTHESIS];

export const PARENTHESIS_TRANSFORM = "par-trans-t23dki";
class CustomParenthesisTransformation extends ZymbolTreeTransformation {
  baseRoot: Zocket;
  rootCopy: Zocket;
  startIndex: number;
  maxIndex: number;
  initialCursor: Cursor;

  changedIndex = true;

  memo?: { newTreeRoot: Zocket; cursor: Cursor };

  constructor(baseRoot: Zocket, initialCursor: Cursor, startIndex: number) {
    super();
    this.startIndex = startIndex;
    this.baseRoot = baseRoot;
    this.initialCursor = initialCursor;
    this.rootCopy = baseRoot;
    this.maxIndex = last(initialCursor, 2) - 1;
    this.makeCopy();
  }

  handleKeyPress = (keyPress: ZymKeyPress): boolean => {
    switch (keyPress.type) {
      case KeyPressBasicType.ArrowLeft: {
        if (this.startIndex > 0) {
          this.startIndex--;
          this.changedIndex = true;
        }

        return true;
      }
      case KeyPressBasicType.ArrowRight: {
        if (this.startIndex < this.maxIndex) {
          this.startIndex++;
          this.changedIndex = true;
        }

        return true;
      }
    }

    return false;
  };

  /* This is sketchy (we should technically await on this to ensure we have enough time for copies...) */
  private makeCopy = async () => {
    this.baseRoot = this.rootCopy;
    this.rootCopy = (
      await this.baseRoot.clone(1, this.baseRoot.parent)
    )[0] as Zocket;
  };

  init = this.makeCopy;

  priority: ZymbolTreeTransformationPriority = {
    rank: ZymbolTransformRank.Suggest,
    cost: 150,
  };

  getCurrentTransformation(): { newTreeRoot: Zocket; cursor: Cursor } {
    if (!this.changedIndex && this.memo) return this.memo;

    const rootCopy = this.baseRoot;

    /* Make a copy for the next run */
    this.makeCopy();

    const cursor = this.initialCursor;
    const zymbolIndex = last(cursor, 2);
    const i = last(cursor);

    /* Handle the parenthesis that groups by operators */
    const cursorCopy = [...cursor];
    const transformText = getTransformTextZymbolAndParent(rootCopy, cursorCopy);

    if (transformText.isTextZymbol) {
      const { text, parent } = transformText;

      const { before: rightBefore, after: rightAfter } =
        splitCursorStringAtLastWord(text.getText(), i);

      /* First we're going to wrap around a single operator */
      const newChildren = parent.children.slice(this.startIndex, zymbolIndex);

      if (rightBefore) {
        const txt = new TextZymbol(parent.parentFrame, 0, parent);
        txt.setText(rightBefore);

        newChildren.push(txt);
      }

      parent.children.splice(
        this.startIndex,
        1 + zymbolIndex - this.startIndex
      );

      if (rightAfter) {
        const txt = new TextZymbol(parent.parentFrame, 0, parent);
        txt.setText(rightAfter);

        parent.children.splice(Math.max(this.startIndex - 1, 0), 0, txt);
      }

      const parenthesis = new ParenthesisZymbol(parent.parentFrame, 0, parent);

      parenthesis.baseZocket.children = newChildren;
      parenthesis.baseZocket.reConnectParentChildren();
      parenthesis.bigParenthesis = true;

      parent.children.splice(this.startIndex, 0, parenthesis);

      const cc2 = [...cursorCopy];
      cc2.splice(cc2.length - 2, 2);

      rootCopy.recursivelyReIndexChildren();

      this.memo = {
        newTreeRoot: rootCopy,
        cursor: recoverAllowedCursor([...cc2, this.startIndex + 1], rootCopy),
      };

      this.changedIndex = false;

      return this.memo;
    }

    this.memo = {
      newTreeRoot: this.baseRoot,
      cursor: this.initialCursor,
    };

    this.changedIndex = false;

    return this.memo;
  }

  setRootParent(parent: Zym<any, any, any>): void {
    this.baseRoot.parent = parent;
  }
}

class Parenthesis extends Zentinel<{}> {
  zyId: string = PARENTHESIS_TRANSFORM;

  onRegistration = async () => {
    this.callZentinelMethod(ZymbolFrameMethod.registerTransformer, {
      source: PARENTHESIS_TRANSFORM,
      name: "par-trans",
      transform: async (root, cursor) => {
        cursor = makeHelperCursor(cursor, root);
        const allTransformations: ZymbolTreeTransformation[] = [];
        const zymbolIndex = last(cursor, 2);
        const i = last(cursor);

        /* First make a copy of the root */
        const [rootCopy, rootCopy2] = (await root.clone(
          2,
          root.parent
        )) as Zymbol[];

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

              const { word } = splitCursorStringAtLastWord(text.getText(), i);

              if (word === RIGHT_PARENTHESIS) {
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

                const t = new CustomParenthesisTransformation(
                  rootCopy2 as Zocket,
                  [...cursorCopy],
                  startIndex
                );

                await t.init();

                allTransformations.push(t);
              }
            }
          }
          {
            const transformText = getTransformTextZymbolAndParent(root, cursor);

            if (transformText.isTextZymbol) {
              const { text, parent } = transformText;
              const {
                word,
                before: rightBefore,
                after: rightAfter,
              } = splitCursorStringAtLastWord(text.getText(), i);

              const cursorCopy = [...cursor];

              if (rightPar.includes(word)) {
                /* Check if there's a left parenthesis that we're missing */
                for (let k = zymbolIndex - 1; k >= 0; k--) {
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

                      const parenthesis = new ParenthesisZymbol(
                        parent.parentFrame,
                        0,
                        parent
                      );

                      parenthesis.baseZocket.children = newChildren as Zymbol[];
                      parenthesis.baseZocket.reConnectParentChildren();

                      parent.children.splice(k, 0, parenthesis);

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

                      parenthesis.bigParenthesis = word !== RIGHT_PARENTHESIS;

                      root.recursivelyReIndexChildren();

                      allTransformations.push(
                        new BasicZymbolTreeTransformation(
                          {
                            newTreeRoot: root as Zocket,
                            cursor: recoverAllowedCursor(
                              extendParentCursor(newPointer, cursorCopy),
                              root
                            ),
                            priority: {
                              rank: ZymbolTransformRank.Suggest,
                              cost: 100,
                            },
                          },
                          (keyPress: ZymKeyPress) =>
                            !(
                              word !== BIG_RIGHT_PARENTHESIS &&
                              keyPress.type === KeyPressComplexType.Key &&
                              keyPress.key === RIGHT_PARENTHESIS
                            )
                        )
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
    });
  };
}

export const parenthesisModifiers = new Parenthesis();
