import _ from "underscore";
import { last } from "../../../../../global_utils/array_utils";
import { checkLatex } from "../../../../../global_utils/latex_utils";
import {
  HermesMessage,
  ZentinelMessage,
} from "../../../../../zym_lib/hermes/hermes";
import { Zentinel } from "../../../../../zym_lib/zentinel/zentinel";
import {
  groupPathFactory,
  isSome,
  justPath,
  NONE,
  ok,
  UNIMPLEMENTED,
  ZyCommandGroup,
  ZyCommandGroupType,
  ZyOption,
  ZyResult,
} from "../../../../../zym_lib/zy_commands/zy_command_types";
import { cursorForEach } from "../../../../../zym_lib/zy_god/cursor/cursor";
import { Zymbol } from "../../../zymbol/zymbol";
import { isSuperSub } from "../../../zymbol/zymbols/super_sub";
import { isSymbolZymbol } from "../../../zymbol/zymbols/symbol_zymbol/symbol_zymbol";
import { Zocket, ZymbolModifier } from "../../../zymbol/zymbols/zocket/zocket";
import {
  BasicZymbolTreeTransformation,
  TransformerMessage,
  ZymbolTransformRank,
  ZymbolTreeTransformation,
} from "../zymbol_frame";
import {
  getTransformTextZymbolAndParent,
  makeHelperCursor,
  recoverAllowedCursor,
} from "./transform_utils";

export const DOT_MODIFIERS_TRANSFORM = "dot-modifiers-e1125";

const DOT = ".";

const PRIME_GROUP = "prime";

function genPrimeMod(numPrime: number): ZymbolModifier {
  let post = "";
  _.range(numPrime).forEach((i) => (post += "'"));
  post += "}";

  return {
    id: {
      group: "prime",
      item: numPrime,
    },
    pre: "{",
    post,
  };
}

const PRIME_DELIM = "'";
const UN_PRIME_DELIM = '"';

function checkMod(mod: string): boolean {
  return checkLatex(`\\${mod}{a}`) && !checkLatex(`\\${mod}`);
}

enum DotModifierMessageType {
  AddDotModifierTransform = "adm",
  AddDotMap = "admp",
}

export const DotModifierMessage = {
  addDotModifierTransform(
    content: DotModifierZymbolTransform
  ): HermesMessage<DotModifierZymbolTransform> {
    return {
      zentinelId: DOT_MODIFIERS_TRANSFORM,
      message: DotModifierMessageType.AddDotModifierTransform,
      content,
    };
  },

  addDotMap(content: DotModifierMap): HermesMessage<DotModifierMap> {
    return {
      zentinelId: DOT_MODIFIERS_TRANSFORM,
      message: DotModifierMessageType.AddDotMap,
      content,
    };
  },
};

class DotModifiers extends Zentinel {
  zyId: string = DOT_MODIFIERS_TRANSFORM;
  globalDotTransforms: DotModifierZymbolTransform[] = [];
  globalDotMap: DotModifierMap[] = [];

  onRegistration = async () => {
    this.callHermes(
      TransformerMessage.registerTransformerFactory({
        source: DOT_MODIFIERS_TRANSFORM,
        name: "dot-mod",
        factory: async (treeRoot, cursor) => {
          const contextualTransforms: DotModifierZymbolTransform[] = [];

          await cursorForEach(treeRoot, cursor, async (zym) => {
            const transResult = await zym.cmd<DotModifierZymbolTransform>(
              DotModifierCommand.getContextualTransforms
            );

            if (transResult.ok) {
              const { id } = transResult.val;

              if (!contextualTransforms.some((d) => _.isEqual(d.id, id))) {
                contextualTransforms.push(transResult.val);
              }
            }
          });

          return [
            async (root, cursor) => {
              cursor = makeHelperCursor(cursor, root);
              const universalCursorCopy = [...cursor];
              const cursorCopy = [...cursor];

              /* First we want to get to the parent */
              const textTransform = getTransformTextZymbolAndParent(
                root,
                cursor
              );

              const zymbolIndex: number = last(cursorCopy, 2);

              /* Put a guard here to prevent unwanted behavior below */
              if (!(zymbolIndex > 0 && textTransform.isTextZymbol)) return [];

              const rootCopies = (await root.clone(
                this.globalDotTransforms.length +
                  contextualTransforms.length +
                  this.globalDotMap.length +
                  1
              )) as Zocket[];

              const allTreeTransformations: ZymbolTreeTransformation[] = [];

              if (textTransform.isTextZymbol) {
                const { text, parent, prevZymbol } = textTransform;
                const firstWord = text.getText();

                if (!prevZymbol) return [];

                if (firstWord.startsWith(DOT)) {
                  let modWord = firstWord.slice(1);

                  let allowed = false;
                  let rank = ZymbolTransformRank.Include;

                  if (checkMod(modWord)) {
                    /* We default to suggested */
                    allowed = true;

                    if (modWord.length > 2) {
                      rank = ZymbolTransformRank.Suggest;
                    }
                  }

                  if (allowed) {
                    const mod = {
                      id: {
                        group: "basic",
                        item: modWord,
                      },
                      pre: `\\${modWord}{`,
                      post: "}",
                    };

                    parent.children.splice(zymbolIndex, 1);

                    let changed = false;
                    if (isSymbolZymbol(prevZymbol!)) {
                      prevZymbol.toggleModifier(mod);
                      changed = true;
                    } else if (isSuperSub(prevZymbol!) && zymbolIndex > 1) {
                      const prevPrevZymbol = parent.children[
                        zymbolIndex - 2
                      ] as Zymbol;

                      if (isSymbolZymbol(prevPrevZymbol)) {
                        prevPrevZymbol.toggleModifier(mod);
                        changed = true;
                      }
                    }

                    if (changed) {
                      cursorCopy.pop();
                      root.recursivelyReIndexChildren();

                      allTreeTransformations.push(
                        new BasicZymbolTreeTransformation({
                          newTreeRoot: root as Zocket,
                          cursor: recoverAllowedCursor(cursorCopy, root),
                          priority: {
                            rank,
                            cost: 100,
                          },
                        })
                      );
                    }
                  }

                  this.globalDotMap.forEach((dotModifierMap) => {
                    const { map: dotMap, cost } = dotModifierMap;
                    const dotKeys = Object.keys(dotMap);

                    const rootCopy = rootCopies.pop() as Zocket;
                    const cursor = [...universalCursorCopy];

                    const textTransform = getTransformTextZymbolAndParent(
                      rootCopy,
                      cursor
                    );

                    if (!textTransform.isTextZymbol) return;

                    const { text, parent, prevZymbol } = textTransform;
                    const firstWord = text.getText();

                    let modWord = firstWord.slice(1);

                    if (dotKeys.includes(modWord)) {
                      modWord = dotMap[modWord];

                      const mod = {
                        id: {
                          group: "basic",
                          item: modWord,
                        },
                        pre: `\\${modWord}{`,
                        post: "}",
                      };

                      parent.children.splice(zymbolIndex, 1);

                      let changed = false;
                      if (isSymbolZymbol(prevZymbol!)) {
                        prevZymbol.toggleModifier(mod);
                        changed = true;
                      } else if (isSuperSub(prevZymbol!) && zymbolIndex > 1) {
                        const prevPrevZymbol = parent.children[
                          zymbolIndex - 2
                        ] as Zymbol;

                        if (isSymbolZymbol(prevPrevZymbol)) {
                          prevPrevZymbol.toggleModifier(mod);
                          changed = true;
                        }
                      }

                      if (changed) {
                        cursor.pop();
                        rootCopy.recursivelyReIndexChildren();

                        allTreeTransformations.push(
                          new BasicZymbolTreeTransformation({
                            newTreeRoot: rootCopy as Zocket,
                            cursor: recoverAllowedCursor(cursor, rootCopy),
                            priority: {
                              rank: ZymbolTransformRank.Suggest,
                              cost,
                            },
                          })
                        );
                      }
                    }
                  });

                  const transforms = [
                    ...this.globalDotTransforms,
                    ...contextualTransforms,
                  ];

                  const tranOp =
                    await prevZymbol.cmd<DotModifierZymbolTransform>(
                      DotModifierCommand.getNodeTransforms
                    );

                  console.log(prevZymbol, tranOp);

                  if (tranOp.ok) {
                    transforms.push(tranOp.val);
                  }

                  transforms.forEach((zymbolTransformer) => {
                    const { transform, cost } = zymbolTransformer;
                    const rootCopy = rootCopies.pop() as Zocket;
                    const cursor = [...universalCursorCopy];

                    const textTransform = getTransformTextZymbolAndParent(
                      rootCopy,
                      cursor
                    );

                    if (
                      !(
                        textTransform.isTextZymbol &&
                        textTransform.prevZymbol &&
                        textTransform.zymbolIndex > 0
                      )
                    )
                      return;

                    const { text, zymbolIndex, parent, prevZymbol } =
                      textTransform;
                    const firstWord = text.getText();

                    let modWord = firstWord.slice(1);

                    const newPrevZymbol = transform({
                      zymbol: prevZymbol,
                      word: modWord,
                    });

                    if (isSome(newPrevZymbol)) {
                      parent.children.splice(
                        zymbolIndex - 1,
                        2,
                        newPrevZymbol.val
                      );

                      cursor.pop();
                      rootCopy.recursivelyReIndexChildren();

                      allTreeTransformations.push(
                        new BasicZymbolTreeTransformation({
                          newTreeRoot: rootCopy as Zocket,
                          cursor: recoverAllowedCursor(cursor, rootCopy),
                          priority: {
                            rank: ZymbolTransformRank.Suggest,
                            cost,
                          },
                        })
                      );
                    }
                  });
                } else if ([PRIME_DELIM, UN_PRIME_DELIM].includes(firstWord)) {
                  /* We're just sneaking in the prime transformer here */
                  parent.children.splice(zymbolIndex, 1);

                  if (isSymbolZymbol(prevZymbol!)) {
                    const lastPrime = prevZymbol.getModsByGroup(PRIME_GROUP)[0];
                    prevZymbol.removeGroupMods(PRIME_GROUP);

                    if (firstWord === PRIME_DELIM) {
                      if (lastPrime) {
                        const lastNum = lastPrime.id.item as number;

                        prevZymbol.addModifier(genPrimeMod(lastNum + 1));
                      } else {
                        prevZymbol.addModifier(genPrimeMod(1));
                      }
                    } else {
                      if (lastPrime && lastPrime.id.item > 0) {
                        const lastNum = lastPrime.id.item as number;

                        prevZymbol.addModifier(genPrimeMod(lastNum - 1));
                      }
                    }
                  }

                  cursorCopy.pop();
                  root.recursivelyReIndexChildren();

                  allTreeTransformations.push(
                    new BasicZymbolTreeTransformation({
                      newTreeRoot: root as Zocket,
                      cursor: recoverAllowedCursor(cursorCopy, root),
                      priority: {
                        rank: ZymbolTransformRank.Suggest,
                        cost: 100,
                      },
                    })
                  );
                }
              }

              return allTreeTransformations;
            },
          ];
        },
      })
    );
  };

  handleMessage = async (msg: ZentinelMessage): Promise<ZyResult<any>> => {
    switch (msg.message) {
      case DotModifierMessageType.AddDotModifierTransform: {
        const { id } = msg.content! as DotModifierZymbolTransform;

        if (!this.globalDotTransforms.some((s) => _.isEqual(id, s.id))) {
          this.globalDotTransforms.push(msg.content);
        }

        return ok(NONE);
      }
      case DotModifierMessageType.AddDotMap: {
        const { id } = msg.content! as DotModifierMap;

        if (!this.globalDotMap.some((s) => _.isEqual(id, s.id))) {
          this.globalDotMap.push(msg.content);
        }

        return ok(NONE);
      }
    }

    return UNIMPLEMENTED;
  };
}

export const dotModifiers = new DotModifiers();

export interface DotModifierZymbolTransform {
  id: {
    group: string;
    item: string | number;
  };
  transform: (s: { zymbol: Zymbol; word: string }) => ZyOption<Zymbol>;
  cost: number;
}

export interface DotModifierMap {
  id: {
    group: string;
    item: string | number;
  };
  map: { [key: string]: string };

  cost: number;
}

interface DotModifierCommandGroup extends ZyCommandGroupType {
  getContextualTransforms: {
    args: undefined;
    return: DotModifierZymbolTransform;
  };
  getNodeTransforms: {
    args: undefined;
    return: DotModifierZymbolTransform;
  };
}

const pathFactory = groupPathFactory(DOT_MODIFIERS_TRANSFORM);

export const DotModifierCommand: ZyCommandGroup<DotModifierCommandGroup> = {
  getContextualTransforms: justPath(pathFactory("gct")),
  getNodeTransforms: justPath(pathFactory("gnt")),
};
