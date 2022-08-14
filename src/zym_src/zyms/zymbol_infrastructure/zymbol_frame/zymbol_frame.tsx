import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import Tex from "../../../../global_building_blocks/tex/tex";
import {
  HermesMessage,
  useHermesValue,
  ZentinelMessage,
} from "../../../../zym_lib/hermes/hermes";
import {
  GET_FULL_CURSOR,
  ZyGodMessage,
} from "../../../../zym_lib/zy_god/zy_god";
import {
  hydrateChild,
  safeHydrate,
} from "../../../../zym_lib/zym/utils/hydrate";
import { Zym, ZymPersist } from "../../../../zym_lib/zym/zym";
import { Zyact } from "../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../../zym_lib/zym/zy_master";
import {
  implementPartialCmdGroup,
  isSome,
  NONE,
  ok,
  UNIMPLEMENTED,
  unwrap,
  ZyBoolVal,
  ZyOption,
} from "../../../../zym_lib/zy_trait/zy_command_types";
import {
  chainMoveResponse,
  Cursor,
  CursorMoveResponse,
  extendChildCursor,
  extractCursorInfo,
  FAILED_CURSOR_MOVE_RESPONSE,
  getRelativeCursor,
  successfulMoveResponse,
} from "../../../../zym_lib/zy_god/cursor/cursor";
import { CursorCommand } from "../../../../zym_lib/zy_god/cursor/cursor_commands";
import {
  DEFAULT_SELECTOR,
  KeyPressArgs,
  KeyPressBasicType,
  KeyPressCommand,
  KeyPressComplexType,
  keyPressEqual,
  KeyPressModifier,
  keyPressModifierToSymbol,
  ZymKeyPress,
} from "../../../../zym_lib/zy_god/event_handler/key_press";
import {
  Zymbol,
  ZymbolHtmlClickInfo,
  ZymbolHtmlIdCommandGroup,
} from "../../zymbol/zymbol";
import { Zocket, ZocketPersist } from "../../zymbol/zymbols/zocket/zocket";
import { TeX } from "../../zymbol/zymbol_types";
import _ from "underscore";
import {
  addZymChangeLink,
  UndoRedoCommand,
} from "../../../../zym_lib/zy_god/undo_redo/undo_redo";
import { cursorToString } from "../../../../global_utils/latex_utils";
import { BasicContext } from "../../../../zym_lib/zy_god/types/context_types";
import clsx from "clsx";
import { palette } from "../../../../global_styles/palette";
import { vimiumHintKeys } from "../../../../global_utils/text_utils";

const ZFP_FIELDS: {
  BASE_ZOCKET: "b";
} = {
  BASE_ZOCKET: "b",
};

export interface ZymbolFramePersist {
  [ZFP_FIELDS.BASE_ZOCKET]: ZymPersist<ZocketPersist>;
}

/* === MASTER ===  */

export const ZymbolFrameMasterId = "zymbol_frame";

enum TransformerMessageType {
  RegisterTransformer = "rt",
  RegisterTransformerFactory = "rtf",
  GetTransformer = "gt",
}

export const TransformerMessage = {
  registerTransformer(transformer: SourcedTransformer): HermesMessage {
    return {
      zentinelId: ZymbolFrameMasterId,
      message: TransformerMessageType.RegisterTransformer,
      content: { transformer },
    };
  },
  registerTransformerFactory(factory: TransformerFactory): HermesMessage {
    return {
      zentinelId: ZymbolFrameMasterId,
      message: TransformerMessageType.RegisterTransformerFactory,
      content: { factory },
    };
  },
  getTransformer(cursor: Cursor, keyPress: ZymKeyPress): HermesMessage {
    return {
      zentinelId: ZymbolFrameMasterId,
      message: TransformerMessageType.GetTransformer,
      content: {
        cursor,
        keyPress,
      },
    };
  },
};

export interface GetTransformerContent {
  cursor: Cursor;
  keyPress: ZymKeyPress;
}

export enum ZymbolTransformRank {
  /* Means that the transform is immediately used to transform the input, 
  and the user has to change out in order to access something else */
  Suggest = 0,
  /* The transformation is included, but the user has to select the
  transform in order to access it
   */
  Include = 1,
}

export interface ZymbolTreeTransformationPriority {
  rank: ZymbolTransformRank;
  cost: number;
}

export abstract class ZymbolTreeTransformation {
  abstract priority: ZymbolTreeTransformationPriority;

  abstract getCurrentTransformation(): {
    newTreeRoot: Zocket;
    cursor: Cursor;
  };

  /* We use this to see if the keypress is allowed to
    be used to confirm the transformation (see in_place_symbols for 
    an example of when we don't do this)  */
  checkKeypressConfirms = (_keyPress: ZymKeyPress): boolean => true;

  /* Indicates whether the transformation did something with the keypress */
  handleKeyPress = (_keyPress: ZymKeyPress): boolean => false;

  abstract setRootParent(parent: Zym): void;
}

export type KeyPressValidator = (keyPress: ZymKeyPress) => boolean;

export class BasicZymbolTreeTransformation extends ZymbolTreeTransformation {
  newTreeRoot;
  cursor: Cursor;
  priority: ZymbolTreeTransformationPriority;

  keyPressValidator?: KeyPressValidator;

  constructor(
    s: {
      newTreeRoot: Zocket;
      cursor: Cursor;
      priority: ZymbolTreeTransformationPriority;
    },
    keyPressValidator?: KeyPressValidator
  ) {
    const { newTreeRoot, cursor, priority } = s;
    super();
    this.newTreeRoot = newTreeRoot;
    this.cursor = cursor;
    this.priority = priority;
    this.keyPressValidator = keyPressValidator;
  }

  getCurrentTransformation(): { newTreeRoot: Zocket; cursor: Cursor } {
    return {
      ...this,
    };
  }
  setRootParent(parent: Zym<any, any, any>): void {
    this.newTreeRoot.parent = parent;
  }

  checkKeypressConfirms = (keyPress: ZymKeyPress): boolean => {
    if (!!this.keyPressValidator) {
      return this.keyPressValidator(keyPress);
    } else {
      return true;
    }
  };
}

export type ZymbolTransformer = (
  rootZymbol: Zymbol,
  cursor: Cursor,
  keyPress: ZymKeyPress
) => Promise<ZymbolTreeTransformation[]> | ZymbolTreeTransformation[];

export interface SourcedTransformer {
  source: string;
  name: string;
  transform: ZymbolTransformer;
}

export interface TransformerFactory {
  source: string;
  name: string;
  factory: (
    root: Zym,
    cursor: Cursor
  ) => Promise<ZymbolTransformer[]> | ZymbolTransformer[];
}

enum VimiumState {
  None,
  Active,
}

export const VimiumHint: React.FC<{ hint: string; str: string }> = ({
  hint,
  str,
}) => {
  return (
    <span
      className={clsx(
        "bg-green-200",
        "px-[3px]",
        "rounded-sm",
        "text-sm font-semibold text-green-600",
        "z-50"
      )}
    >
      {hint.startsWith(str) ? (
        <>
          <span className="text-gray-300">{str}</span>
          {hint.substring(str.length)}
        </>
      ) : (
        hint
      )}
    </span>
  );
};

const HINT_PERIOD = 2;

export class VimiumMode {
  private chars = "";
  private state = VimiumState.None;

  /* Return true if the keypress was intercepted and handled*/
  handleKeyPress = (keyPress: ZymKeyPress): boolean => {
    switch (this.state) {
      case VimiumState.None: {
        if (
          keyPressEqual(keyPress, {
            type: KeyPressComplexType.Key,
            key: "f",
            modifiers: [KeyPressModifier.Cmd],
          })
        ) {
          this.state = VimiumState.Active;
          this.chars = "";
          return true;
        }

        break;
      }
      case VimiumState.Active: {
        if (keyPress.type === KeyPressComplexType.Key) {
          if (/^[a-zA-Z]$/.test(keyPress.key)) {
            this.chars += keyPress.key;
            return true;
          }
        } else if (keyPress.type === KeyPressBasicType.Escape) {
          this.escapeVimiumMode();
          return false;
        }

        break;
      }
    }

    return false;
  };

  escapeVimiumMode = () => {
    this.state = VimiumState.None;
    this.chars = "";
  };

  isActive = () => this.state === VimiumState.Active;
  getChars = () => this.chars;
}

class ZymbolFrameMaster extends ZyMaster {
  zyId = "zymbol_frame";

  newBlankChild(): Zym<any, any, any> {
    return new ZymbolFrame(0, undefined);
  }

  transformerFactories: TransformerFactory[] = [];
  transformers: SourcedTransformer[] = [];

  handleMessage = async (msg: ZentinelMessage) => {
    switch (msg.message) {
      case TransformerMessageType.RegisterTransformerFactory: {
        this.registerTransformerFactory(msg.content.factory);

        return ok(true);
      }
      case TransformerMessageType.RegisterTransformer: {
        this.registerSourcedTransformer(msg.content.transformer);

        return ok(true);
      }
      case TransformerMessageType.GetTransformer: {
        const { cursor, keyPress } = msg.content as GetTransformerContent;

        return ok(await this.getZymbolTransformer(cursor, keyPress));
      }
      default: {
        /* Zentinel defaults to unimplemented for unhandled messages */
        return UNIMPLEMENTED;
      }
    }
  };

  /*
  --- NOTE ---
  We allow overriding transformer implementations by default
  */

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

  getZymbolTransformer = async (cursor: Cursor, keyPress: ZymKeyPress) => {
    /* Get the zym root */
    const root = unwrap(await this.callHermes(ZyGodMessage.getZymRoot)) as Zym;

    const transformers = await _.flatten(
      await Promise.all(
        this.transformerFactories.map((factory) =>
          factory.factory(root, cursor)
        )
      )
    );

    transformers.push(...this.transformers.map((t) => t.transform));

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
  SelectionKey: clsx(
    "bg-green-200",
    "rounded-md px-2 py-1",
    "text-sm font-semibold text-green-600",
    "shadow-sm shadow-gray"
  ),
  MainFrameContainer: "m-4 mt-0",
  TransContainer: "p-2 border-b ",
  SelectedTransContainer: "bg-gray-200 rounded-md",
};

/* Helper components */
interface TexTransformProps {
  tex: TeX;
  showSelector?: boolean;
  selector?: ZymKeyPress;
}

const TexTransform: React.FC<TexTransformProps> = (props) => {
  let finalKey = "Any Key";

  const { selector } = props;

  if (selector) {
    switch (selector.type) {
      case KeyPressComplexType.Key: {
        finalKey = selector.key;

        if (finalKey === " ") {
          finalKey = "Space";
        }

        break;
      }
      case KeyPressBasicType.Enter: {
        finalKey = "Enter";
        break;
      }
    }
  }

  return (
    <div className="flex flex-row self-stretch">
      <div className="flex flex-row flex-1">
        <div>
          <Tex tex={props.tex} />
        </div>
      </div>
      {props.showSelector && (
        <div className="flex self-end">
          <span>
            {(selector?.modifiers ?? []).map((m, i) => (
              <span key={i}>
                <span className={Styles.SelectionKey}>
                  {keyPressModifierToSymbol(m)}
                </span>
                <span className="mx-1">+</span>
              </span>
            ))}
            <span className={Styles.SelectionKey}>{finalKey}</span>
          </span>
        </div>
      )}
    </div>
  );
};

/* === Zym ====  */
export class ZymbolFrame extends Zyact<ZymbolFramePersist, FrameRenderProps> {
  zyMaster: ZyMaster = zymbolFrameMaster;

  baseZocket: Zocket = new Zocket(this, 0, this);
  children: Zym<any, any>[] = [this.baseZocket];

  transformations: ZymbolTreeTransformation[] = [];
  transformIndex = -1;

  vimiumMode = new VimiumMode();

  setBaseZocket = (baseZocket: Zocket) => {
    this.baseZocket = baseZocket;
    this.baseZocket.parent = this;
    this.children = [this.baseZocket];
  };

  component: React.FC<FrameRenderProps> = () => {
    let zocketCursor: Cursor = [];

    const fullCursorResult = useHermesValue(this, GET_FULL_CURSOR, true);

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
        const subTreePointers = unwrap(
          await baseZocket.cmd<ZymbolHtmlClickInfo[]>(
            ZymbolHtmlIdCommandGroup.getAllDescendentHTMLIds
          )
        );

        let vimiumHints: string[] = [];

        if (vimiumActive) {
          vimiumHints = vimiumHintKeys(
            Math.floor(subTreePointers.length / HINT_PERIOD) + 1
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

            if (vimiumActive && i % HINT_PERIOD === 0) {
              const hint = vimiumHints[Math.floor(i / HINT_PERIOD)];

              if (hint === vimiumChars) {
                this.vimiumMode.escapeVimiumMode();
                usingTransformation && this.takeSelectedTransformation();

                this.callHermes(ZyGodMessage.takeCursor(pointer.clickCursor));
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
            element.style.transitionDuration = "0.1s";
            element.style.cursor = "pointer";

            element.onmouseover = () => {
              element.style.color = palette.mediumForestGreen;
            };

            element.onmouseout = () => {
              element.style.color = "";
            };

            element.onclick = () => {
              usingTransformation && this.takeSelectedTransformation();

              this.callHermes(ZyGodMessage.takeCursor(pointer.clickCursor));
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
        });
      } else {
        selectedTex = frameTex;
      }

      const allTex = this.transformations.map((t) => {
        const tr = t.getCurrentTransformation();
        return tr.newTreeRoot.renderTex({
          cursor: tr.cursor,
          excludeHtmlIds: true,
        });
      });

      allTex.unshift(
        this.baseZocket.renderTex({
          cursor: zocketCursor,
          excludeHtmlIds: true,
        })
      );

      return (
        <div className={Styles.FrameContainer}>
          <div className={Styles.MainFrameContainer}>
            <TexTransform tex={selectedTex} showSelector />
            {/* <div>{selectedTex}</div> */}
          </div>
          <div className="shadow-lg shadow-gray-400 py-4 px-2 rounded-lg bg-gray-100">
            {allTex.map((t, i) => (
              <div
                className={clsx(
                  "p-2",
                  this.transformIndex + 1 === i && Styles.SelectedTransContainer
                )}
                key={`tt::${i}`}
              >
                <TexTransform
                  tex={t}
                  showSelector={i === 0}
                  selector={i === 0 ? DEFAULT_SELECTOR : undefined}
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
            <TexTransform tex={frameTex} />
            {/* <div>{frameTex}</div> */}
          </div>
        </div>
      );
    }
  };

  persistData() {
    return {
      [ZFP_FIELDS.BASE_ZOCKET]: this.baseZocket.persist(),
    };
  }

  takeSelectedTransformation = (keyPressContext?: BasicContext): Cursor => {
    const trans = this.transformations[this.transformIndex];

    const t = trans.getCurrentTransformation();

    const beforeState = this.baseZocket.persist();

    this.setBaseZocket(t.newTreeRoot);
    const framePointer = this.getFullCursorPointer();

    if (keyPressContext)
      addZymChangeLink(keyPressContext, {
        zymLocation: framePointer,
        beforeChange: {
          zymState: {
            [ZFP_FIELDS.BASE_ZOCKET]: beforeState,
          },
        },
        afterChange: {
          zymState: {
            [ZFP_FIELDS.BASE_ZOCKET]: this.baseZocket.persist(),
          },
        },
      });

    this.setNewTransformations([]);

    return [0, ...t.cursor];
  };

  setNewTransformations = (transformations: ZymbolTreeTransformation[]) => {
    this.transformations = transformations;

    this.rankTransactions();
    const topTrans = this.transformations[0];

    this.transformations.forEach((t) => {
      t.setRootParent(this);
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

  hydrate = async (p: Partial<ZymbolFramePersist>): Promise<void> => {
    await safeHydrate(p, {
      [ZFP_FIELDS.BASE_ZOCKET]: async (bz) => {
        this.baseZocket = (await hydrateChild(this, bz)) as Zocket;
      },
    });
    this.children = [this.baseZocket];

    this.baseZocket.setParentFrame(this);

    this.reConnectParentChildren();
  };
}

/* ==== CMD Implementations ==== */

/* Key Press */
const keyPressImpl = implementPartialCmdGroup(KeyPressCommand, {
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
      });

      navigator.clipboard.writeText(tex);

      return FAILED_CURSOR_MOVE_RESPONSE;
    }

    let { nextCursorIndex, childRelativeCursor } = extractCursorInfo(cursor);

    /* We only have one child */
    if (nextCursorIndex === 0) {
      let isInputKey = false;

      /* Start out by checking if this is a key, and if we need to handle a special condition based on a potential transform */
      if (keyPress.type === KeyPressComplexType.Key) {
        isInputKey = true;
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

          unwrap(
            await zym.children[nextCursorIndex].cmd<
              CursorMoveResponse,
              KeyPressArgs
            >(KeyPressCommand.handleKeyPress, {
              cursor: childRelativeCursor,
              keyPressContext,
              keyPress,
            })
          );

          return successfulMoveResponse(cursor);
        }
      }

      frame.setNewTransformations([]);

      /* Otherwise, we handle everything as normal */

      const child: Zym = zym.children[nextCursorIndex];

      const childMove = unwrap(
        await child.cmd<CursorMoveResponse, KeyPressArgs>(
          KeyPressCommand.handleKeyPress,
          {
            cursor: childRelativeCursor,
            keyPressContext,
            keyPress,
          }
        )
      );

      if (isInputKey) {
        /* Handle potential transformation */
        /* 1. Ask Hermes for the Transformer */
        const transformer = unwrap(
          await frame.callHermes(
            TransformerMessage.getTransformer(
              frame.getFullCursorPointer(),
              keyPress
            )
          )
        ) as ZymbolTransformer;

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

const frameCursorImpl = implementPartialCmdGroup(CursorCommand, {
  /* The frame handles rendering all the TeX */
  canHandleCursorBranchRender: () => true,
});

const undoRedoImpl = implementPartialCmdGroup(UndoRedoCommand, {
  prepUndoRedo: async (zym) => {
    const frame = zym as ZymbolFrame;
    frame.setNewTransformations([]);

    zym.children.forEach((c) => c.cmd(UndoRedoCommand.prepUndoRedo));
  },
});

zymbolFrameMaster.registerCmds([
  ...frameCursorImpl,
  ...keyPressImpl,
  ...undoRedoImpl,
]);

/* USED FOR HYDRATION */
export const DUMMY_FRAME = new ZymbolFrame(0, undefined);
