import { last } from "../../../../global_utils/array_utils";
import { BasicContext } from "../../../../zym_lib/utils/basic_context";
import { isSome, unwrapOption } from "../../../../zym_lib/utils/zy_option";
import {
  hydrateChild,
  safeHydrate,
} from "../../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../../zym_lib/zym/zym";
import { useZymponents } from "../../../../zym_lib/zym/zymplementations/zyact/hooks";
import { Zyact } from "../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../../zym_lib/zym/zy_master";
import {
  chainMoveResponse,
  Cursor,
  CursorIndex,
  CursorMoveResponse,
  extendChildCursor,
  extractCursorInfo,
  FAILED_CURSOR_MOVE_RESPONSE,
  getLastZymInCursorWithId,
  successfulMoveResponse,
} from "../../../../zym_lib/zy_god/cursor/cursor";
import { CursorCommandTrait } from "../../../../zym_lib/zy_god/cursor/cursor_commands";
import {
  basicKeyPress,
  KeyPressBasicType,
  KeyPressComplexType,
  keyPressEqual,
  KeyPressModifier,
  KeyPressTrait,
} from "../../../../zym_lib/zy_god/event_handler/key_press";
import { ZyGodMethod } from "../../../../zym_lib/zy_god/zy_god_schema";
import { ZyPartialPersist } from "../../../../zym_lib/zy_schema/zy_schema";
import { unwrapTraitResponse } from "../../../../zym_lib/zy_trait/zy_trait";
import { TextZymbol } from "../../zymbol/zymbols/text_zymbol/text_zymbol";
import { isTextZymbol } from "../../zymbol/zymbols/text_zymbol/text_zymbol_schema";
import { ZymbolProgression } from "../zymbol_progression/zymbol_progression";
import { InlineInput } from "./module_lines/inline_input/inline_input";
import { zymIsInlineInput } from "./module_lines/inline_input/inline_input_schema";
import {
  ZymbolModuleMethodSchema,
  ZymbolModulePersistenceSchema,
  ZymbolModuleSchema,
  ZYMBOL_MODULE_ID,
} from "./zymbol_module_schema";

class ZymbolModuleMaster extends ZyMaster<
  ZymbolModuleSchema,
  ZymbolModulePersistenceSchema,
  ZymbolModuleMethodSchema
> {
  zyId = ZYMBOL_MODULE_ID;

  constructor() {
    super();

    this.setMethodImplementation({
      addInlineLine: async ({ cursor }) => {
        const root = await this.callZentinelMethod(
          ZyGodMethod.getZymRoot,
          undefined
        );

        const op = getLastZymInCursorWithId<ZymbolModule>(
          root,
          cursor,
          ZYMBOL_MODULE_ID
        );

        if (isSome(op)) {
          const { zym: module, childRelativeCursor } = op.val;

          if (childRelativeCursor.length > 0) {
            const childIndex = childRelativeCursor[0];

            const newLine = new InlineInput(0, module);

            module.children.splice(childIndex, 0, newLine);
            module.recursivelyReIndexChildren();

            const newFullCursor = [
              ...module.getFullCursorPointer(),
              childIndex + 1,
              0,
              0,
              0,
            ];

            await this.callZentinelMethod(
              ZyGodMethod.takeCursor,
              newFullCursor
            );
          }
        }
      },
      joinLine: async ({ cursor }) => {
        const root = await this.callZentinelMethod(
          ZyGodMethod.getZymRoot,
          undefined
        );

        const op = getLastZymInCursorWithId<ZymbolModule>(
          root,
          cursor,
          ZYMBOL_MODULE_ID
        );

        if (isSome(op)) {
          const { zym: module, childRelativeCursor } = op.val;

          if (childRelativeCursor.length > 0) {
            const childIndex = childRelativeCursor[0];

            if (childIndex < module.children.length && childIndex > 0) {
              /* Make sure both these bad bois are inline_inputs */
              if (
                zymIsInlineInput(module.children[childIndex]) &&
                zymIsInlineInput(module.children[childIndex - 1])
              ) {
                const input1 = module.children[childIndex - 1] as InlineInput;
                const input2 = module.children[childIndex] as InlineInput;

                const zocket1 = input1.inputFrame.baseZocket;
                const zocket2 = input2.inputFrame.baseZocket;

                const z1ChildrenLen = zocket1.children.length;
                const z1LastChild = last(zocket1.children);
                const z2FirstChild = zocket2.children[0];

                let zocketRelativeCursor: Cursor;

                if (
                  z1LastChild &&
                  z2FirstChild &&
                  isTextZymbol(z1LastChild) &&
                  isTextZymbol(z2FirstChild)
                ) {
                  const z1Chars = z1LastChild.getCharacters();
                  const z2Chars = z2FirstChild.getCharacters();

                  z1LastChild.setCharacters([...z1Chars, ...z2Chars]);

                  zocket1.children.push(...zocket2.children.slice(1));

                  if (z1Chars.length === 0) {
                    zocketRelativeCursor = [Math.max(z1ChildrenLen - 1, 0)];
                  } else if (z2Chars.length === 0) {
                    zocketRelativeCursor = [Math.max(z1ChildrenLen)];
                  } else {
                    zocketRelativeCursor = [z1ChildrenLen - 1, z1Chars.length];
                  }
                } else {
                  zocket1.children.push(...zocket2.children);

                  zocketRelativeCursor = [z1ChildrenLen];
                }

                module.children.splice(childIndex, 1);
                module.recursivelyReIndexChildren();

                const newFullCursor = [
                  ...module.getFullCursorPointer(),
                  childIndex - 1,
                  0,
                  0,
                  ...zocketRelativeCursor,
                ];

                await this.callZentinelMethod(
                  ZyGodMethod.takeCursor,
                  newFullCursor
                );
              }
            }
          }
        }
      },
      breakLine: async ({ cursor }) => {
        const root = await this.callZentinelMethod(
          ZyGodMethod.getZymRoot,
          undefined
        );

        const op = getLastZymInCursorWithId<ZymbolModule>(
          root,
          cursor,
          ZYMBOL_MODULE_ID
        );

        if (isSome(op)) {
          const { zym: module, childRelativeCursor } = op.val;

          if (childRelativeCursor.length > 3) {
            const lineIndex = childRelativeCursor[0];

            const inlineInput = module.children[lineIndex] as InlineInput;

            if (inlineInput) {
              const zocketRelativeCursor = childRelativeCursor.slice(3);
              const zocket = inlineInput.inputFrame.baseZocket;

              let caseCovered = true;

              const zocketChild = zocket.children[zocketRelativeCursor[0]];

              if (
                zocketRelativeCursor.length === 1 ||
                !isTextZymbol(zocketChild)
              ) {
                const oldZocketNewChildren = zocket.children.slice(
                  0,
                  zocketRelativeCursor[0] + 1
                );
                const newZocketNewChildren = zocket.children.slice(
                  zocketRelativeCursor[0] + 1
                );

                zocket.children = oldZocketNewChildren;
                const newInlineInput = new InlineInput(0, module);

                newInlineInput.inputFrame.baseZocket.children =
                  newZocketNewChildren;

                module.children.splice(lineIndex + 1, 0, newInlineInput);
                module.recursivelyReIndexChildren();
              } else if (zocketRelativeCursor.length === 2) {
                const oldZocketNewChildren = zocket.children.slice(
                  0,
                  zocketRelativeCursor[0] + 1
                );
                const newZocketNewChildren = zocket.children.slice(
                  zocketRelativeCursor[0] + 1
                );

                const textChild = zocketChild as TextZymbol;
                const textIndex = zocketRelativeCursor[1];

                const chars = textChild.getCharacters();

                textChild.setCharacters(chars.slice(0, textIndex));

                const newInlineInput = new InlineInput(0, module);
                const newText = new TextZymbol(
                  newInlineInput.inputFrame,
                  0,
                  newInlineInput.inputFrame
                );
                newText.setCharacters(chars.slice(textIndex));

                newZocketNewChildren.unshift(newText);
                newInlineInput.inputFrame.baseZocket.children =
                  newZocketNewChildren;

                zocket.children = oldZocketNewChildren;

                module.children.splice(lineIndex + 1, 0, newInlineInput);
                module.recursivelyReIndexChildren();
              } else {
                caseCovered = false;
              }

              if (caseCovered) {
                const newFullCursor = [
                  ...module.getFullCursorPointer(),
                  lineIndex + 1,
                  0,
                  0,
                  0,
                ];

                await this.callZentinelMethod(
                  ZyGodMethod.takeCursor,
                  newFullCursor
                );
              }
            }
          }
        }
      },
    });
  }

  newBlankChild(): Zym<ZymbolModuleSchema, ZymbolModulePersistenceSchema> {
    return new ZymbolModule(0, undefined);
  }
}

export const zymbolModuleMaster = new ZymbolModuleMaster();

export type ModuleLine = InlineInput | ZymbolProgression;

export class ZymbolModule extends Zyact<
  ZymbolModuleSchema,
  ZymbolModulePersistenceSchema
> {
  zyMaster = zymbolModuleMaster;
  children: ModuleLine[];

  constructor(cursorIndex: CursorIndex, parent?: Zym<any, any, any>) {
    super(cursorIndex, parent);

    /* Start out with a single standard input as the first line */
    this.children = [new InlineInput(0, this)];
    // this.children = [new ZymbolProgression(0, this)];

    this.setPersistenceSchemaSymbols({
      children: "c",
    });
  }

  component: React.FC = () => {
    const ChildrenComponents = useZymponents(this.children);

    return (
      <>
        {ChildrenComponents.map((C, i) => (
          <C key={i} />
        ))}
      </>
    );
  };

  addLine = (inline: boolean) => {
    this.children.push(
      inline ? new InlineInput(0, this) : new ZymbolProgression(0, this)
    );

    this.reConnectParentChildren();

    return this.children.length - 1;
  };

  deleteLine = (cursor: CursorIndex) => {
    if (cursor > 0) {
      this.children.splice(cursor, 1);

      return cursor - 1;
    }

    return cursor;
  };

  moveCursorUp = async (
    cursor: Cursor,
    ctx: BasicContext
  ): Promise<CursorMoveResponse> => {
    const { nextCursorIndex, childRelativeCursor } = extractCursorInfo(cursor);

    if (nextCursorIndex >= 0) {
      const child: Zym<any, any> = this.children[nextCursorIndex];

      const childMove = unwrapTraitResponse(
        await child.callTraitMethod(KeyPressTrait.handleKeyPress, {
          cursor: childRelativeCursor,
          keyPressContext: ctx,
          keyPress: basicKeyPress(KeyPressBasicType.ArrowUp),
        })
      );

      if (childMove.success) {
        return chainMoveResponse(childMove, (nextCursor) => {
          return successfulMoveResponse(
            extendChildCursor(nextCursorIndex, nextCursor)
          );
        });
      } else {
        if (nextCursorIndex > 0) {
          const upChild = this.children[nextCursorIndex - 1];

          const childCursor = unwrapOption(
            unwrapTraitResponse(
              await upChild.callTraitMethod(
                CursorCommandTrait.getInitialCursor,
                undefined
              )
            )
          );

          return successfulMoveResponse([nextCursorIndex - 1, ...childCursor]);
        }
      }
    }

    return FAILED_CURSOR_MOVE_RESPONSE;
  };

  moveCursorDown = async (
    cursor: Cursor,
    ctx: BasicContext
  ): Promise<CursorMoveResponse> => {
    const { nextCursorIndex, childRelativeCursor } = extractCursorInfo(cursor);

    if (nextCursorIndex >= 0) {
      const child: Zym<any, any> = this.children[nextCursorIndex];

      const childMove = unwrapTraitResponse(
        await child.callTraitMethod(KeyPressTrait.handleKeyPress, {
          cursor: childRelativeCursor,
          keyPressContext: ctx,
          keyPress: basicKeyPress(KeyPressBasicType.ArrowDown),
        })
      );

      if (childMove.success) {
        return chainMoveResponse(childMove, (nextCursor) => {
          return successfulMoveResponse(
            extendChildCursor(nextCursorIndex, nextCursor)
          );
        });
      } else {
        if (nextCursorIndex < this.children.length - 1) {
          const upChild = this.children[nextCursorIndex + 1];

          const childCursor = unwrapOption(
            unwrapTraitResponse(
              await upChild.callTraitMethod(
                CursorCommandTrait.getInitialCursor,
                undefined
              )
            )
          );

          return successfulMoveResponse([nextCursorIndex + 1, ...childCursor]);
        }
      }
    }

    return FAILED_CURSOR_MOVE_RESPONSE;
  };

  persistData() {
    return {
      children: this.children.map((c) => c.persist()),
    };
  }

  async hydrateFromPartialPersist(
    p: Partial<
      ZyPartialPersist<ZymbolModuleSchema, ZymbolModulePersistenceSchema>
    >
  ): Promise<void> {
    await safeHydrate(p, {
      children: async (children) => {
        this.children = (await Promise.all(
          children.map((c) => hydrateChild<any, any>(this, c))
        )) as ModuleLine[];
      },
    });

    this.reConnectParentChildren();
  }
}

zymbolModuleMaster.implementTrait(KeyPressTrait, {
  handleKeyPress: async (zym, args) => {
    const module = zym as ZymbolModule;
    const { cursor, keyPressContext, keyPress } = args;
    const { nextCursorIndex, childRelativeCursor } = extractCursorInfo(cursor);

    if (nextCursorIndex >= 0) {
      const child: Zym<any, any> = zym.children[nextCursorIndex];

      if (
        keyPress.type === KeyPressComplexType.Key &&
        keyPress.key === "c" &&
        keyPress.modifiers?.includes(KeyPressModifier.Cmd)
      ) {
        let tex = "";
        for (const c of module.children) {
          tex += c.getCopyTex() + "\u000A";
        }

        navigator.clipboard.writeText(tex);

        return FAILED_CURSOR_MOVE_RESPONSE;
      }

      if (
        keyPress.type === KeyPressBasicType.Enter &&
        keyPress.modifiers?.includes(KeyPressModifier.Shift)
      ) {
        const lineIndex = module.addLine(false);

        const lineCursor = unwrapOption(
          unwrapTraitResponse(
            await module.children[lineIndex].callTraitMethod(
              CursorCommandTrait.getInitialCursor,
              undefined
            )
          )
        );

        return successfulMoveResponse([lineIndex, ...lineCursor]);
      }

      if (
        keyPressEqual(keyPress, {
          type: KeyPressBasicType.Delete,
          modifiers: [KeyPressModifier.Ctrl],
        })
      ) {
        if (nextCursorIndex > 0) {
          module.deleteLine(nextCursorIndex);

          const lineIndex = nextCursorIndex - 1;

          const lineCursor = unwrapOption(
            unwrapTraitResponse(
              await module.children[lineIndex].callTraitMethod(
                CursorCommandTrait.getInitialCursor,
                undefined
              )
            )
          );

          return successfulMoveResponse([lineIndex, ...lineCursor]);
        }
      }

      if (keyPress.type === KeyPressBasicType.ArrowDown) {
        return module.moveCursorDown(cursor, keyPressContext);
      } else if (keyPress.type === KeyPressBasicType.ArrowUp) {
        return module.moveCursorUp(cursor, keyPressContext);
      }

      const childMove = await child.callTraitMethod(
        KeyPressTrait.handleKeyPress,
        {
          cursor: childRelativeCursor,
          keyPressContext,
          keyPress,
        }
      );

      return chainMoveResponse(unwrapTraitResponse(childMove), (nextCursor) => {
        return successfulMoveResponse(
          extendChildCursor(nextCursorIndex, nextCursor)
        );
      });
    }

    return FAILED_CURSOR_MOVE_RESPONSE;
  },
});
