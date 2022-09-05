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
  DEFAULT_SELECTOR,
  KeyPressBasicType,
  KeyPressComplexType,
  keyPressEqual,
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
import clsx from "clsx";
import { vimiumHintKeys } from "../../../../global_utils/string_utils";
import { ZyGodMethod } from "../../../../zym_lib/zy_god/zy_god_schema";
import { unwrapTraitResponse } from "../../../../zym_lib/zy_trait/zy_trait";
import { CursorCommandTrait } from "../../../../zym_lib/zy_god/cursor/cursor_commands";
import {
  ZymbolFrameMethod,
  ZymbolFrameMethodSchema,
  ZymbolFrameOpts,
  ZymbolFramePersistedSchema,
  ZymbolFrameSchema,
  ZYMBOL_FRAME_MASTER_ID,
} from "./zymbol_frame_schema";
import { TexTransform } from "./building_blocks/tex_transform";
import {
  VimiumHint,
  VimiumMode,
} from "./building_blocks/vimium_mode/vimium_mode";
import {
  SourcedTransformer,
  TransformerFactory,
  TransformerTypeFilter,
  ZymbolTransformRank,
  ZymbolTreeTransformation,
} from "./transformer/transformer";
import { ZyPartialPersist } from "../../../../zym_lib/zy_schema/zy_schema";

const VIMIUM_HINT_PERIOD = 2;
class ZymbolFrameMaster extends ZyMaster<
  ZymbolFrameSchema,
  ZymbolFramePersistedSchema,
  ZymbolFrameMethodSchema
> {
  zyId = ZYMBOL_FRAME_MASTER_ID;

  transformerFactories: TransformerFactory[] = [];
  transformers: SourcedTransformer[] = [];

  constructor() {
    super();

    this.setMethodImplementation({
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

  newBlankChild(): Zym<ZymbolFrameSchema, ZymbolFramePersistedSchema, any> {
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

  getZymbolTransformer = async (
    cursor: Cursor,
    keyPress: ZymKeyPress,
    typeFilters: TransformerTypeFilter[]
  ) => {
    /* Get the zym root */
    const root = await this.callZentinelMethod(
      ZyGodMethod.getZymRoot,
      undefined
    );

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
  cursor?: ZyOption<Cursor>;
}

/* Helper class */
const Styles = {
  FrameContainer: "items-start",
  MainFrameContainer: "m-4 mt-0",
  SelectedTransContainer: "bg-gray-200 rounded-md",
};

/* Helper components */
/* === Zym ====  */
export class ZymbolFrame extends Zyact<
  ZymbolFrameSchema,
  ZymbolFramePersistedSchema,
  FrameRenderProps
> {
  zyMaster: ZyMaster = zymbolFrameMaster;

  baseZocket: Zocket;
  children: Zym<any, any>[];

  transformations: ZymbolTreeTransformation[] = [];
  transformIndex = -1;

  vimiumMode = new VimiumMode();

  getTypeFilters: (cursor: Cursor) => TransformerTypeFilter[];
  readonly inlineTex: boolean;

  constructor(
    cursorIndex: CursorIndex,
    parent: Zym<any, any> | undefined,
    opts?: Partial<ZymbolFrameOpts>
  ) {
    super(cursorIndex, parent);

    const { getTypeFilters, inlineTex } = _.defaults(opts, {
      getTypeFilters: (cursor: Cursor) => [],
      inlineTex: false,
    });

    this.inlineTex = inlineTex;

    this.baseZocket = new Zocket(this, 0, this, this.inlineTex);
    this.children = [this.baseZocket];

    this.getTypeFilters = getTypeFilters;
    this.setPersistenceSchemaSymbols({
      baseZocket: "b",
    });
  }

  setBaseZocket = (baseZocket: Zocket) => {
    this.baseZocket = baseZocket;
    this.baseZocket.parent = this;

    this.baseZocket.setParentFrame(this);

    this.children = [this.baseZocket];
  };

  component: React.FC<FrameRenderProps> = () => {
    let zocketCursor: Cursor = [];

    const fullCursorResult = useHermesValue(
      this,
      ZyGodMethod.getFullCursor,
      undefined
    );

    if (fullCursorResult) {
      const opt = getRelativeCursor(
        this.getFullCursorPointer(),
        fullCursorResult
      );

      if (isSome(opt)) {
        const { childRelativeCursor, nextCursorIndex } = extractCursorInfo(
          opt.val
        );

        if (nextCursorIndex === 0) {
          zocketCursor = childRelativeCursor;
        }
      }
    }

    const frameTex = this.baseZocket.renderTex({
      cursor: zocketCursor,
      inlineTex: this.inlineTex,
    });

    const vimiumActive = this.vimiumMode.isActive();
    const vimiumChars = this.vimiumMode.getChars();

    useEffect(() => {
      (async () => {
        let baseZocket;
        let usingTransformation = false;

        if (
          this.transformations.length > 0 &&
          this.transformIndex > -1 &&
          this.transformIndex < this.transformations.length
        ) {
          const selectedTrans =
            this.transformations[
              this.transformIndex
            ].getCurrentTransformation();

          baseZocket = selectedTrans.newTreeRoot;

          usingTransformation = true;
        } else {
          baseZocket = this.baseZocket;
        }

        /* First get all the ids in the sub tree */
        const subTreePointers = unwrapTraitResponse(
          await baseZocket.callTraitMethod(
            ZymbolHtmlIdTrait.getAllDescendentHTMLIds,
            undefined
          )
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
                usingTransformation && this.takeSelectedTransformation();

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
              usingTransformation && this.takeSelectedTransformation();
              const textPointer = window.getSelection()?.anchorOffset;

              element.blur();

              if (pointer.isSelectableText && textPointer !== undefined) {
                if (textPointer > 0) {
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

    if (this.transformations.length > 0) {
      let selectedTex: string;

      if (
        this.transformIndex > -1 &&
        this.transformIndex < this.transformations.length
      ) {
        const selectedTrans =
          this.transformations[this.transformIndex].getCurrentTransformation();
        selectedTex = selectedTrans.newTreeRoot.renderTex({
          cursor: selectedTrans.cursor,
          inlineTex: this.inlineTex,
        });
      } else {
        selectedTex = frameTex;
      }

      const allTex = this.transformations.map((t) => {
        const tr = t.getCurrentTransformation();
        return tr.newTreeRoot.renderTex({
          cursor: tr.cursor,
          inlineTex: this.inlineTex,
          excludeHtmlIds: true,
        });
      });

      allTex.unshift(
        this.baseZocket.renderTex({
          cursor: zocketCursor,
          inlineTex: this.inlineTex,
          excludeHtmlIds: true,
        })
      );

      return (
        <div className={Styles.FrameContainer}>
          <div className={Styles.MainFrameContainer}>
            <TexTransform
              tex={selectedTex}
              showSelector
              inlineTex={this.inlineTex}
            />
          </div>
          <div className="shadow-lg shadow-gray-400 py-4 px-2 rounded-lg bg-gray-100">
            {allTex.map((t, i) => (
              <div
                className={clsx(
                  "p-2",
                  this.transformIndex + 1 === i && Styles.SelectedTransContainer
                )}
                key={`tt::${i}`}
                onMouseEnter={() => {
                  this.transformIndex = i - 1;
                  this.render();
                }}
                onClick={() => {
                  this.callZentinelMethod(ZyGodMethod.simulateKeyPress, {
                    type: KeyPressBasicType.Enter,
                  });
                }}
              >
                <TexTransform
                  tex={t}
                  showSelector={i === 0}
                  selector={i === 0 ? DEFAULT_SELECTOR : undefined}
                  inlineTex={this.inlineTex}
                />
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      return (
        <div className={Styles.FrameContainer}>
          <div className={Styles.MainFrameContainer}>
            <TexTransform tex={frameTex} inlineTex={this.inlineTex} />
          </div>
        </div>
      );
    }
  };

  persistData() {
    return {
      baseZocket: this.baseZocket.persist(),
    };
  }

  async hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<ZymbolFrameSchema, ZymbolFramePersistedSchema>>
  ): Promise<void> {
    await safeHydrate(p, {
      baseZocket: async (bz) => {
        this.baseZocket = (await hydrateChild(this, bz)) as Zocket;
      },
    });
    this.children = [this.baseZocket];

    this.baseZocket.setParentFrame(this);

    this.reConnectParentChildren();
  }

  takeSelectedTransformation = (keyPressContext?: BasicContext): Cursor => {
    const trans = this.transformations[this.transformIndex];

    const t = trans.getCurrentTransformation();

    const beforeState = this.baseZocket.persist();

    this.setBaseZocket(t.newTreeRoot);
    const framePointer = this.getFullCursorPointer();

    /* We can probably get undo/redo info directly from the transformation */
    if (keyPressContext)
      addZymChangeLink<ZymbolFrameSchema, ZymbolFramePersistedSchema>(
        keyPressContext,
        {
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
        }
      );

    this.setNewTransformations([]);

    return [0, ...t.cursor];
  };

  setNewTransformations = (transformations: ZymbolTreeTransformation[]) => {
    this.transformations = transformations;

    this.rankTransactions();
    const topTrans = this.transformations[0];

    this.transformations.forEach((t) => {
      t.setRootParentFrame(this);
    });

    if (topTrans && topTrans.priority.rank === ZymbolTransformRank.Suggest) {
      this.transformIndex = 0;
    } else {
      this.transformIndex = -1;
    }
  };

  getTopTransformation = () => {
    if (this.transformations.length > 0) {
      this.rankTransactions();

      return this.transformations[0];
    }
  };

  private rankTransactions = () => {
    this.transformations.sort((a, b) => {
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

    if (
      keyPress.type === KeyPressComplexType.Key &&
      keyPress.key === "c" &&
      keyPress.modifiers?.includes(KeyPressModifier.Cmd)
    ) {
      const tex = frame.baseZocket.renderTex({
        cursor: [],
        excludeHtmlIds: true,
        inlineTex: frame.inlineTex,
      });

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

      /* Check if we have active transformations */
      if (frame.transformations.length > 0) {
        if (
          keyPress.type === KeyPressBasicType.ArrowDown ||
          keyPress.type === KeyPressBasicType.ArrowUp
        ) {
          frame.transformIndex =
            ((frame.transformIndex +
              1 +
              (keyPress.type === KeyPressBasicType.ArrowDown ? 1 : -1) +
              frame.transformations.length +
              1) %
              (frame.transformations.length + 1)) -
            1;

          return successfulMoveResponse(cursor);
        } else if (keyPressEqual(DEFAULT_SELECTOR, keyPress)) {
          frame.setNewTransformations([]);
          return successfulMoveResponse(cursor);
        } else if (frame.transformIndex > -1) {
          const trans = frame.transformations[frame.transformIndex];

          if (trans) {
            if (trans.handleKeyPress(keyPress)) {
              return successfulMoveResponse(cursor);
            } else if (trans.checkKeypressConfirms(keyPress)) {
              cursor = frame.takeSelectedTransformation(keyPressContext);

              const { nextCursorIndex: n, childRelativeCursor: c } =
                extractCursorInfo(cursor);

              /* Reset mutable vars */
              nextCursorIndex = n;
              childRelativeCursor = c;
            }
          }
        }

        if (keyPress.type === KeyPressBasicType.Enter) {
          frame.setNewTransformations([]);

          setEnterUsedToConfirmTransform(keyPressContext, true);

          unwrapTraitResponse(
            await zym.children[nextCursorIndex].callTraitMethod(
              KeyPressTrait.handleKeyPress,
              {
                cursor: childRelativeCursor,
                keyPressContext,
                keyPress,
              }
            )
          );

          return successfulMoveResponse(cursor);
        }
      }

      frame.setNewTransformations([]);

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

        console.log("f g tf", frame.getTypeFilters(labelCursor));

        /* Handle potential transformation */
        /* 1. Ask Hermes for the Transformer */
        const transformer = await frame.callZentinelMethod(
          ZymbolFrameMethod.getTransformer,
          {
            cursor: frame.getFullCursorPointer(),
            keyPress,
            typeFilters: frame.getTypeFilters(labelCursor),
          }
        );
        /* 2. Apply the transformer to get a list of potential transformations */
        const transformations = await transformer(
          frame.baseZocket,
          childMove.newRelativeCursor,
          keyPress
        );

        /* 3. Set setting that indicates that we have a transformation for the next render event */
        frame.setNewTransformations(transformations);
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
});

zymbolFrameMaster.implementTrait(UndoRedoTrait, {
  prepUndoRedo: async (zym) => {
    const frame = zym as ZymbolFrame;
    frame.setNewTransformations([]);

    zym.children.forEach((c) =>
      c.callTraitMethod(UndoRedoTrait.prepUndoRedo, undefined)
    );
  },
});

/* USED FOR HYDRATION */
export const DUMMY_FRAME = new ZymbolFrame(0, undefined);
