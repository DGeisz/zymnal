import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { useHermesValue } from "../../../../zym_lib/hermes/hermes";
import {
  hydrateChild,
  safeHydrate,
} from "../../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../../zym_lib/zym/zym";
import { Zyact } from "../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../../zym_lib/zym/zy_master";
import { isSome, ZyOption } from "../../../../zym_lib/utils/zy_option";
import {
  chainMoveResponse,
  Cursor,
  CursorIndex,
  CursorMoveResponse,
  extendChildCursor,
  extractCursorInfo,
  FAILED_CURSOR_MOVE_RESPONSE,
  getRelativeCursor,
  successfulMoveResponse,
} from "../../../../zym_lib/zy_god/cursor/cursor";
import {
  KeyPressBasicType,
  KeyPressComplexType,
  KeyPressModifier,
  KeyPressTrait,
  ZymKeyPress,
} from "../../../../zym_lib/zy_god/event_handler/key_press";
import {
  setEnterUsedToConfirmTransform,
  Zymbol,
  ZymbolHtmlIdTrait,
} from "../../zymbol/zymbol";
import { Zocket } from "../../zymbol/zymbols/zocket/zocket";
import _ from "underscore";
import {
  addZymChangeLink,
  UndoRedoTrait,
} from "../../../../zym_lib/zy_god/undo_redo/undo_redo";
import { cursorToString } from "../../../../global_utils/latex_utils";
import { BasicContext } from "../../../../zym_lib/utils/basic_context";
import { vimiumHintKeys } from "../../../../global_utils/string_utils";
import { ZyGodMethod } from "../../../../zym_lib/zy_god/zy_god_schema";
import { unwrapTraitResponse } from "../../../../zym_lib/zy_trait/zy_trait";
import {
  CursorCommandTrait,
  VerticalNavigationHandleType,
} from "../../../../zym_lib/zy_god/cursor/cursor_commands";
import {
  ZymbolFrameMethod,
  ZymbolFrameMethodSchema,
  ZymbolFrameOpts,
  ZymbolFrameSchema,
  ZYMBOL_FRAME_MASTER_ID,
} from "./zymbol_frame_schema";
import {
  VimiumHint,
  VimiumMode,
} from "./building_blocks/vimium_mode/vimium_mode";
import {
  SourcedTransformer,
  TransformerFactory,
  TransformerTypeFilter,
  ZymbolTreeTransformation,
  ZymbolTreeTransformationAction,
} from "./transformer/transformer";
import { ZyPartialPersist } from "../../../../zym_lib/zy_schema/zy_schema";
import { zyMath } from "../../../../global_building_blocks/tex/autoRender";
import clsx from "clsx";
import { clearDomCursor, placeDomCursor } from "./cursor_helper";
import { isTextZymbol } from "../../zymbol/zymbols/text_zymbol/text_zymbol_schema";
import { STD_TRANSFORMER_TYPE_FILTERS } from "./transformer/std_transformers/std_transformer_type_filters";
import { displayEquationTypeFilters } from "../zymbol_module/module_lines/display_equation/display_equation_schema";
import Tex from "../../../../global_building_blocks/tex/tex";
import { ActionCommandTrait } from "./actions/action_commands";
import {
  ActionFactory,
  DefaultNoOpAction,
  FrameAction,
  FrameActionRank,
} from "./actions/actions";
import { SNIPPET_ID } from "../zymbol_module/snippets/snippet_schema";

const VIMIUM_HINT_PERIOD = 2;
class ZymbolFrameMaster extends ZyMaster<
  ZymbolFrameSchema,
  ZymbolFrameMethodSchema
> {
  zyId = ZYMBOL_FRAME_MASTER_ID;

  transformerFactories: TransformerFactory[] = [];
  transformers: SourcedTransformer[] = [];

  actionFactories: ActionFactory[] = [];

  constructor() {
    super();

    this.setMethodImplementation({
      registerActionFactory: async (actionFactory) => {
        this.registerActionFactory(actionFactory);
      },
      getFrameActions: async ({
        rootZymbol,
        zymbolCursor,
        parentFrame,
        cursor,
        keyPress,
        typeFilters,
      }) =>
        this.getFrameActions(
          rootZymbol,
          zymbolCursor,
          parentFrame,
          cursor,
          keyPress,
          typeFilters
        ),
      registerTransformer: async (sourcedTransformer) => {
        this.registerSourcedTransformer(sourcedTransformer);
      },
      registerTransformerFactory: async (factory) => {
        this.registerTransformerFactory(factory);
      },
      getTransformer: async ({ cursor, keyPress, typeFilters }) => {
        return this.getZymbolTransformer(cursor, keyPress, typeFilters);
      },
    });
  }

  newBlankChild() {
    return new ZymbolFrame(0, undefined);
  }

  registerSourcedTransformer = (trans: SourcedTransformer) => {
    this.transformers = this.transformers.filter(
      (f) => !(f.name === trans.name && f.source === trans.source)
    );

    this.transformers.push(trans);
  };

  registerTransformerFactory = (factory: TransformerFactory) => {
    /* Make sure to get rid of any existing factories of this type */
    this.transformerFactories = this.transformerFactories.filter(
      (f) => !(f.name === factory.name && f.source === factory.source)
    );

    this.transformerFactories.push(factory);
  };

  registerActionFactory = (factory: ActionFactory) => {
    this.actionFactories = this.actionFactories.filter(
      (f) => !(f.name === factory.name && f.source === factory.source)
    );

    this.actionFactories.push(factory);
  };

  getFrameActions = async (
    rootZymbol: Zymbol,
    zymbolCursor: Cursor,
    parentFrame: ZymbolFrame,
    cursor: Cursor,
    keyPress: ZymKeyPress,
    typeFilters: TransformerTypeFilter[]
  ): Promise<FrameAction[]> => {
    /* First fetch all transformers */
    const root = await this.callZ(ZyGodMethod.getZymRoot, undefined);

    const transformers = await _.flatten(
      await Promise.all(
        this.transformerFactories
          .filter((factory) =>
            factory.typeFilters.every((filter) => typeFilters.includes(filter))
          )
          .map((factory) => factory.factory(root, cursor))
      )
    );

    transformers.push(
      ...this.transformers
        .filter((transformer) =>
          transformer.typeFilters.every((filter) =>
            typeFilters.includes(filter)
          )
        )
        .map((t) => t.transform)
    );

    const transformerCopies = await rootZymbol.clone(transformers.length);

    const treeTransformations = _.flatten(
      await Promise.all(
        transformers.map((t, i) => {
          return t(transformerCopies[i] as Zymbol, zymbolCursor, keyPress);
        })
      )
    );

    const transformationActions = treeTransformations.map(
      (t) => new ZymbolTreeTransformationAction(t)
    );

    /* Now process the action factories */
    const actionFactories = this.actionFactories.filter((a) =>
      a.typeFilters.every((filter) => typeFilters.includes(filter))
    );

    const actionCopies = await rootZymbol.clone(actionFactories.length);

    const normalActions = _.flatten(
      actionFactories.map((f, i) =>
        f.getActions(root, cursor, actionCopies[i] as Zymbol, zymbolCursor)
      )
    );

    const actions = [...transformationActions, ...normalActions];

    actions.forEach((a) => a.setParentFrame(parentFrame));

    return actions;
  };

  getZymbolTransformer = async (
    cursor: Cursor,
    keyPress: ZymKeyPress,
    typeFilters: TransformerTypeFilter[]
  ) => {
    /* Get the zym root */
    const root = await this.callZ(ZyGodMethod.getZymRoot, undefined);

    const transformers = await _.flatten(
      await Promise.all(
        this.transformerFactories
          .filter((factory) =>
            factory.typeFilters.every((filter) => typeFilters.includes(filter))
          )
          .map((factory) => factory.factory(root, cursor))
      )
    );

    transformers.push(
      ...this.transformers
        .filter((transformer) =>
          transformer.typeFilters.every((filter) =>
            typeFilters.includes(filter)
          )
        )
        .map((t) => t.transform)
    );

    if (!transformers.length) {
      return () => [];
    }

    return async (
      zymbolRoot: Zymbol,
      zymbolCursor: Cursor
    ): Promise<ZymbolTreeTransformation[]> => {
      const copies = await zymbolRoot.clone(transformers.length);

      return _.flatten(
        await Promise.all(
          transformers.map((t, i) => {
            return t(copies[i] as Zymbol, zymbolCursor, keyPress);
          })
        )
      );
    };
  };
}

export const zymbolFrameMaster = new ZymbolFrameMaster();

interface FrameRenderProps {
  texClass?: string;
  cursor?: ZyOption<Cursor>;
}

/* Helper class */
const Styles = {
  // FrameContainer: "items-start bg-blue-500",
  FrameContainer: "",
  MainFrameContainer: "mt-3",
  SelectedTransContainer: "bg-gray-200 rounded-md",
};

/* Helper components */
/* === Zym ====  */
export class ZymbolFrame extends Zyact<ZymbolFrameSchema, FrameRenderProps> {
  zyMaster: ZyMaster = zymbolFrameMaster;

  baseZocket: Zocket;
  children: Zym<any, any>[];
  defaultText?: string;

  actions: FrameAction[] = [];
  actionIndex = -1;

  vimiumMode = new VimiumMode();

  private useActionLock = false;
  private actionLockEnabled = false;

  getTypeFilters: (cursor: Cursor) => TransformerTypeFilter[];
  usingDefaultTypeFilters = false;
  inlineTex: boolean;

  constructor(
    cursorIndex: CursorIndex,
    parent: Zym<any, any> | undefined,
    opts?: Partial<ZymbolFrameOpts>
  ) {
    super(cursorIndex, parent);

    if (!opts?.getTypeFilters) {
      this.usingDefaultTypeFilters = true;
    }

    const { getTypeFilters, inlineTex, defaultText } = _.defaults(opts, {
      getTypeFilters: (cursor: Cursor) => {
        if (this.inlineTex) {
          return this.inlineTypeFilters(cursor);
        } else {
          return displayEquationTypeFilters();
        }
      },
      inlineTex: false,
      defaultText: undefined,
    });

    this.defaultText = defaultText;
    this.inlineTex = inlineTex;

    this.baseZocket = new Zocket(this, 0, this, this.inlineTex);
    this.children = [this.baseZocket];

    this.getTypeFilters = getTypeFilters;
    this.setPersistenceSchemaSymbols({
      baseZocket: "b",
      inlineTex: "i",
    });
  }

  setDefaultText(text: string) {
    this.defaultText = text;
  }

  toggleUseActionLock = (useLock: boolean) => {
    if (!this.useActionLock && useLock) {
      this.useActionLock = true;
      this.actionLockEnabled = true;
    } else if (this.useActionLock && !useLock) {
      this.useActionLock = false;
      this.actionLockEnabled = false;
    }
  };

  setActionLock = (lock: boolean) => {
    if (this.useActionLock) {
      this.actionLockEnabled = lock;
    }
  };

  getActionsLocked = () => this.useActionLock && this.actionLockEnabled;

  inlineTypeFilters = (cursor: Cursor) => {
    const potentialText = this.baseZocket.children[cursor[1]];

    if (
      cursor.length <= 2 ||
      (!!potentialText && isTextZymbol(potentialText))
    ) {
      return [STD_TRANSFORMER_TYPE_FILTERS.INPUT];
    } else {
      return [STD_TRANSFORMER_TYPE_FILTERS.EQUATION];
    }
  };

  setBaseZocket = (baseZocket: Zocket) => {
    this.baseZocket = baseZocket;
    this.baseZocket.parent = this;

    this.baseZocket.setParentFrame(this);

    this.children = [this.baseZocket];
  };

  component: React.FC<FrameRenderProps> = ({ texClass }) => {
    let zocketCursor: Cursor = [];

    const fullCursor = useHermesValue(
      this,
      ZyGodMethod.getFullCursor,
      undefined
    );

    if (fullCursor) {
      const opt = getRelativeCursor(this.getFullCursorPointer(), fullCursor);

      if (isSome(opt)) {
        const { childRelativeCursor, nextCursorIndex } = extractCursorInfo(
          opt.val
        );

        if (nextCursorIndex === 0) {
          zocketCursor = childRelativeCursor;
        }
      }
    }

    const relativeString = cursorToString(zocketCursor);

    /* Whenever we change the cursor change the location of the dom caret */
    useEffect(() => {
      if (zocketCursor.length > 0) {
        if (this.actions.length === 0) {
          if (this.baseZocket.checkForDomCursor(zocketCursor) && fullCursor) {
            placeDomCursor(fullCursor);
          } else {
            clearDomCursor();
          }
        } else {
          clearDomCursor();
        }
      }
    }, [relativeString]);

    let frameTex = this.baseZocket.renderTex({
      cursor: zocketCursor,
      baseZocketRelativeCursor: zocketCursor,
      inlineTex: this.inlineTex,
    });

    const vimiumActive = this.vimiumMode.isActive();
    const vimiumChars = this.vimiumMode.getChars();

    useEffect(() => {
      (async () => {
        let baseZocket;
        let usingTransformation = false;

        if (
          this.actions.length > 0 &&
          this.actionIndex > -1 &&
          this.actionIndex < this.actions.length
        ) {
          const framePreview = this.actions[this.actionIndex].getFramePreview();

          if (framePreview) {
            baseZocket = framePreview.newTreeRoot;
            usingTransformation = true;
          } else {
            baseZocket = this.baseZocket;
          }
        } else {
          baseZocket = this.baseZocket;
        }

        /* First get all the ids in the sub tree */
        const subTreePointers = await baseZocket.call(
          ZymbolHtmlIdTrait.getAllDescendentHTMLIds,
          undefined
        );

        let vimiumHints: string[] = [];

        if (vimiumActive) {
          vimiumHints = vimiumHintKeys(
            Math.floor(subTreePointers.length / VIMIUM_HINT_PERIOD) + 1
          );
        }

        for (let i = 0; i < subTreePointers.length; i++) {
          const pointer = subTreePointers[i];

          const id = cursorToString(pointer.loc);
          const element = document.getElementById(id);

          if (element) {
            element.style.position = "relative";

            const hintElementId = id + "v";
            const oldHint = document.getElementById(hintElementId);

            oldHint && oldHint.remove();

            if (vimiumActive && i % VIMIUM_HINT_PERIOD === 0) {
              const hint = vimiumHints[Math.floor(i / VIMIUM_HINT_PERIOD)];

              if (hint === vimiumChars) {
                this.vimiumMode.handleTermSelected();
                usingTransformation && this.runSelectedAction();

                this.callZentinelMethod(
                  ZyGodMethod.takeCursor,
                  pointer.clickCursor
                );
              } else if (hint.startsWith(vimiumChars)) {
                const d = document.createElement("span");
                d.classList.add("vimium-container");
                d.id = hintElementId;

                ReactDOM.createRoot(d).render(
                  <VimiumHint hint={hint} str={vimiumChars} />
                );
                element.appendChild(d);
              }
            }

            element.style.pointerEvents = "auto";
            element.style.cursor = "text";

            if (pointer.isSelectableText) {
              element.contentEditable = "true";
            }

            element.onclick = () => {
              usingTransformation && this.runSelectedAction();

              if (pointer.isSelectableText) {
                const textPointer = window.getSelection()?.anchorOffset;

                element.blur();
                if (textPointer !== undefined && textPointer > 0) {
                  this.callZentinelMethod(ZyGodMethod.takeCursor, [
                    ...pointer.clickCursor,
                    textPointer + (pointer.selectableOffset ?? 0),
                  ]);
                } else {
                  this.callZentinelMethod(
                    ZyGodMethod.takeCursor,
                    pointer.clickCursor
                  );
                }
              } else {
                this.callZentinelMethod(
                  ZyGodMethod.takeCursor,
                  pointer.clickCursor
                );
              }
            };
          }
        }
      })();
    }, [frameTex, vimiumActive, vimiumChars]);

    const selectEmptyZocket = () => {
      this.callZ(ZyGodMethod.takeCursor, [
        ...this.baseZocket.getFullCursorPointer(),
        0,
      ]);
    };

    if (this.actions.length > 0) {
      let selectedTex: string;

      frameTex = this.baseZocket.renderTex({
        cursor: zocketCursor,
        baseZocketRelativeCursor: zocketCursor,
        inlineTex: this.inlineTex,
        onlyUseLatexCaret: true,
      });

      if (this.actionIndex > -1 && this.actionIndex < this.actions.length) {
        const actionPreview = this.actions[this.actionIndex].getFramePreview();

        if (actionPreview) {
          const newRoot = actionPreview.newTreeRoot;
          newRoot.setParentFrame(this);
          newRoot.parent = this;

          selectedTex = newRoot.renderTex({
            cursor: actionPreview.cursor,
            baseZocketRelativeCursor: actionPreview.cursor,
            inlineTex: this.inlineTex,
          });
        } else {
          selectedTex = frameTex;
        }
      } else {
        selectedTex = frameTex;
      }

      const actionsInner = this.actions.map((action, i) => {
        const Comp = action.getActionPreviewComponent();

        return (
          <div
            className={clsx(
              "px-2",
              this.actionIndex === i && Styles.SelectedTransContainer
            )}
            key={`tt::${i}`}
            onMouseMove={() => {
              this.actionIndex = i;
              this.render();
            }}
            onClick={() => {
              this.callZentinelMethod(ZyGodMethod.simulateKeyPress, {
                type: KeyPressBasicType.Enter,
              });
            }}
          >
            <div
              className={clsx(
                "py-2",
                i > 0 &&
                  !(this.actionIndex === i || this.actionIndex === i - 1) &&
                  "border-t border-solid border-gray-100"
              )}
            >
              <Comp selected={this.actionIndex === i} />
            </div>
          </div>
        );
      });

      return (
        <div className={Styles.FrameContainer}>
          <div className={Styles.MainFrameContainer}>
            <Tex
              tex={selectedTex}
              inlineTex={this.inlineTex}
              className={texClass ?? undefined}
              defaultText={this.defaultText}
              onEmptyClick={selectEmptyZocket}
            />
          </div>
          <div className="relative">
            <div
              className={clsx(
                "z-50",
                "absolute left-[-12px] top-1",
                "min-w-[360px]",
                "shadow-lg shadow-gray-400",
                "py-4 px-2",
                "rounded-lg bg-gray-100"
              )}
            >
              {this.getActionsLocked() ? (
                <>
                  <div
                    className={clsx("font-semibold", "text-sm", "pl-1 pb-2")}
                  >
                    Press "ESC" to unlock actions
                  </div>
                  <div className={clsx("opacity-50")}>{actionsInner}</div>
                </>
              ) : (
                actionsInner
              )}
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className={Styles.FrameContainer}>
          <div className={Styles.MainFrameContainer}>
            <Tex
              tex={frameTex}
              inlineTex={this.inlineTex}
              className={texClass ?? undefined}
              defaultText={this.defaultText}
              onEmptyClick={selectEmptyZocket}
            />
          </div>
        </div>
      );
    }
  };

  persistData() {
    return {
      baseZocket: this.baseZocket.persist(),
      inlineTex: this.inlineTex,
    };
  }

  async hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<ZymbolFrameSchema>>
  ): Promise<void> {
    await safeHydrate(p, {
      baseZocket: async (bz) => {
        this.baseZocket = (await hydrateChild(this, bz)) as Zocket;
      },
      inlineTex: (i) => {
        this.inlineTex = i;
      },
    });
    this.baseZocket.setParentFrame(this);

    if (this.usingDefaultTypeFilters) {
      if (this.inlineTex) {
        this.getTypeFilters = this.inlineTypeFilters;
      } else {
        this.getTypeFilters = displayEquationTypeFilters;
      }
    }
  }

  getRefreshedChildrenPointer(): Zym[] {
    return [this.baseZocket];
  }

  runSelectedAction = (keyPressContext?: BasicContext): CursorMoveResponse => {
    const action = this.actions[this.actionIndex];

    if (action) {
      return action.runAction(keyPressContext);
    } else {
      return FAILED_CURSOR_MOVE_RESPONSE;
    }
  };

  enactTransformation = (
    transformation: ZymbolTreeTransformation,
    keyPressContext?: BasicContext
  ): Cursor => {
    const trans = transformation;

    const t = trans.getCurrentTransformation();

    const beforeState = this.baseZocket.persist();

    this.setBaseZocket(t.newTreeRoot);
    const framePointer = this.getFullCursorPointer();

    /* We can probably get undo/redo info directly from the transformation */
    if (keyPressContext) {
      addZymChangeLink<ZymbolFrameSchema>(keyPressContext, {
        zymLocation: framePointer,
        beforeChange: {
          zymState: {
            baseZocket: beforeState,
          },
        },
        afterChange: {
          zymState: {
            baseZocket: this.baseZocket.persist(),
          },
        },
      });
    }

    this.setNewActions([]);

    return [0, ...t.cursor];
  };

  setNewActions = (actions: FrameAction[]) => {
    this.actions = actions;

    this.rankActions();
    const topAction = this.actions[0];

    if (this.actions.length > 0) {
      this.actions.push(new DefaultNoOpAction(this));
    }

    this.actions.forEach((a) => {
      a.setRootParentFrame(this);
    });

    if (topAction && topAction.priority.rank === FrameActionRank.Suggest) {
      this.actionIndex = 0;
    } else {
      this.actionIndex = this.actions.length - 1;
    }
  };

  private rankActions = () => {
    this.actions.sort((a, b) => {
      if (a.priority.rank === b.priority.rank) {
        return a.priority.cost - b.priority.cost;
      } else {
        return a.priority.rank - b.priority.rank;
      }
    });
  };
}

/* ==== CMD Implementations ==== */

zymbolFrameMaster.implementTrait(KeyPressTrait, {
  handleKeyPress: async (zym, args) => {
    const frame = zym as ZymbolFrame;

    const { keyPressContext, keyPress } = args;
    let { cursor } = args;

    if (frame.vimiumMode.handleKeyPress(keyPress)) {
      return successfulMoveResponse(cursor);
    }

    /* Copy tex to keyboard */
    if (
      keyPress.type === KeyPressComplexType.Key &&
      keyPress.key === "c" &&
      keyPress.modifiers?.includes(KeyPressModifier.Cmd)
    ) {
      let tex = frame.baseZocket.renderTex({
        cursor: [],
        baseZocketRelativeCursor: [],
        excludeHtmlIds: true,
        inlineTex: frame.inlineTex,
      });

      if (!frame.inlineTex) {
        tex = zyMath(tex);
      }

      navigator.clipboard.writeText(tex);

      return FAILED_CURSOR_MOVE_RESPONSE;
    }

    let { nextCursorIndex, childRelativeCursor } = extractCursorInfo(cursor);

    /* We only have one child */
    if (nextCursorIndex === 0) {
      let isTransformationKey = false;

      /* Start out by checking if this is a key, and if we need to handle a special condition based on a potential transform */
      if (
        keyPress.type === KeyPressComplexType.Key ||
        keyPress.type === KeyPressBasicType.Delete
      ) {
        isTransformationKey = true;
      }

      /* Check if we lock the actions */
      frame.toggleUseActionLock(
        await frame.call(ActionCommandTrait.checkActionLock, cursor)
      );

      if (
        frame.getActionsLocked() &&
        keyPress.type === KeyPressBasicType.Escape
      ) {
        frame.setActionLock(false);
        return successfulMoveResponse(cursor);
      }

      /* Check if we have available actions */
      if (frame.actions.length > 0) {
        if (
          !frame.getActionsLocked() &&
          (keyPress.type === KeyPressBasicType.ArrowDown ||
            keyPress.type === KeyPressBasicType.ArrowUp) &&
          !(
            keyPress.modifiers &&
            keyPress.modifiers.includes(KeyPressModifier.Shift)
          )
        ) {
          frame.actionIndex =
            (frame.actionIndex +
              (keyPress.type === KeyPressBasicType.ArrowDown ? 1 : -1) +
              frame.actions.length) %
            frame.actions.length;

          return successfulMoveResponse(cursor);
        }

        frame.setActionLock(true);

        if (frame.actionIndex > -1) {
          const action = frame.actions[frame.actionIndex];

          if (action) {
            if (action.handleKeyPress(keyPress)) {
              return successfulMoveResponse(cursor);
            } else if (action.checkKeypressConfirms(keyPress)) {
              // @ts-ignore
              if (window.w) {
                debugger;
              }

              const move = frame.runSelectedAction(keyPressContext);

              if (move.success) {
                cursor = move.newRelativeCursor;

                if (action.finishActionWithoutHandlingKeypress)
                  return successfulMoveResponse(cursor);
              }

              const { nextCursorIndex: n, childRelativeCursor: c } =
                extractCursorInfo(cursor);

              /* Reset mutable vars */
              nextCursorIndex = n;
              childRelativeCursor = c;
            }
          }
        }

        if (keyPress.type === KeyPressBasicType.Enter) {
          frame.setNewActions([]);

          setEnterUsedToConfirmTransform(keyPressContext, true);

          await zym.children[nextCursorIndex].call(
            KeyPressTrait.handleKeyPress,
            {
              cursor: childRelativeCursor,
              keyPressContext,
              keyPress,
            }
          );

          return successfulMoveResponse(cursor);
        }
      }

      frame.setNewActions([]);

      /* Otherwise, we handle everything as normal */

      const child: Zym = zym.children[nextCursorIndex];

      const childMove = unwrapTraitResponse(
        await child.callTraitMethod(KeyPressTrait.handleKeyPress, {
          cursor: childRelativeCursor,
          keyPressContext,
          keyPress,
        })
      ) as CursorMoveResponse;

      if (isTransformationKey) {
        let labelCursor = cursor;

        if (childMove.success) {
          labelCursor = [0, ...childMove.newRelativeCursor];
        }

        frame.setNewActions(
          await frame.callZ(ZymbolFrameMethod.getFrameActions, {
            rootZymbol: frame.baseZocket,
            keyPress,
            parentFrame: frame,
            zymbolCursor: childMove.newRelativeCursor,
            cursor: frame.getFullCursorPointer(),
            typeFilters: frame.getTypeFilters(labelCursor),
          })
        );
      }

      return chainMoveResponse(childMove, (nextCursor) => {
        return successfulMoveResponse(
          extendChildCursor(nextCursorIndex, nextCursor)
        );
      });
    } else {
      return FAILED_CURSOR_MOVE_RESPONSE;
    }
  },
});

zymbolFrameMaster.implementTrait(CursorCommandTrait, {
  /* The frame handles rendering all the TeX */
  canHandleCursorBranchRender: async () => true,

  checkVerticalNavigationType: async (zym, cursor) => {
    const frame = zym as ZymbolFrame;

    if (!frame.inlineTex) return VerticalNavigationHandleType.ZyManaged;

    const { nextCursorIndex, childRelativeCursor } = extractCursorInfo(cursor);
    const child = frame.children[nextCursorIndex];

    if (child) {
      return await child.call(
        CursorCommandTrait.checkVerticalNavigationType,
        childRelativeCursor
      );
    }

    return VerticalNavigationHandleType.DomManaged;
  },
});

zymbolFrameMaster.implementTrait(UndoRedoTrait, {
  prepUndoRedo: async (zym) => {
    const frame = zym as ZymbolFrame;
    frame.setNewActions([]);

    zym.children.forEach((c) =>
      c.callTraitMethod(UndoRedoTrait.prepUndoRedo, undefined)
    );
  },
});

/* USED FOR HYDRATION */
export const DUMMY_FRAME = new ZymbolFrame(0, undefined);
