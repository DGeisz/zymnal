import React, { FC } from "react";
import Tex from "../../../../global_building_blocks/tex/tex";
import {
  HermesMessage,
  ZentinelMessage,
} from "../../../../zym_lib/hermes/hermes";
import { GET_ZYM_ROOT } from "../../../../zym_lib/zy_god/zy_god";
import { hydrateChild } from "../../../../zym_lib/zym/utils/hydrate";
import { Zym, ZymPersist } from "../../../../zym_lib/zym/zym";
import { Zyact } from "../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../../zym_lib/zym/zy_master";
import {
  implementPartialCmdGroup,
  isSome,
  ok,
  UNIMPLEMENTED,
  unwrap,
  ZyOption,
} from "../../../../zym_lib/zy_commands/zy_command_types";
import {
  chainMoveResponse,
  Cursor,
  CursorMoveResponse,
  extendChildCursor,
  extractCursorInfo,
  FAILED_CURSOR_MOVE_RESPONSE,
  successfulMoveResponse,
} from "../../../../zym_lib/zy_god/cursor/cursor";
import { CursorCommand } from "../../../../zym_lib/zy_god/cursor/cursor_commands";
import { getRelativeCursor } from "../../../../zym_lib/zy_god/divine_api/divine_accessors";
import {
  DEFAULT_SELECTOR,
  KeyPressArgs,
  KeyPressBasicType,
  KeyPressCommand,
  KeyPressComplexType,
  keyPressEqual,
  keyPressModifierToSymbol,
  ZymKeyPress,
} from "../../../../zym_lib/zy_god/event_handler/key_press";
import { Zymbol } from "../../zymbol/zymbol";
import { Zocket } from "../../zymbol/zymbols/zocket/zocket";
import { TeX } from "../../zymbol/zymbol_types";
import _ from "underscore";

const ZFP_FIELDS: {
  BASE_ZOCKET: "b";
} = {
  BASE_ZOCKET: "b",
};

export interface ZymbolFramePersist {
  /* TODO: Add base zocket */
  [ZFP_FIELDS.BASE_ZOCKET]: ZymPersist<any>;
}

/* === MASTER ===  */

export const ZymbolFrameMasterId = "zymbol_frame";

enum TransformerMessage {
  RegisterTransformer = "rt",
  RegisterTransformerFactory = "rtf",
  GetTransformer = "gt",
}

export const CreateTransformerMessage = {
  registerTransformer(transformer: SourcedTransformer): HermesMessage {
    return {
      zentinelId: ZymbolFrameMasterId,
      message: TransformerMessage.RegisterTransformer,
      content: { transformer },
    };
  },
  registerTransformerFactory(factory: TransformerFactory): HermesMessage {
    return {
      zentinelId: ZymbolFrameMasterId,
      message: TransformerMessage.RegisterTransformerFactory,
      content: { factory },
    };
  },
  getTransformer(cursor: Cursor): HermesMessage {
    return {
      zentinelId: ZymbolFrameMasterId,
      message: TransformerMessage.GetTransformer,
      content: {
        cursor,
      },
    };
  },
};

export interface GetTransformerContent {
  cursor: Cursor;
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
}

export class BasicZymbolTreeTransformation extends ZymbolTreeTransformation {
  newTreeRoot;
  cursor: Cursor;
  priority: ZymbolTreeTransformationPriority;

  constructor(s: {
    newTreeRoot: Zocket;
    cursor: Cursor;
    priority: ZymbolTreeTransformationPriority;
  }) {
    const { newTreeRoot, cursor, priority } = s;
    super();
    this.newTreeRoot = newTreeRoot;
    this.cursor = cursor;
    this.priority = priority;
  }

  getCurrentTransformation(): { newTreeRoot: Zocket; cursor: Cursor } {
    return {
      ...this,
    };
  }
}

export type ZymbolTransformer = (
  rootZymbol: Zymbol,
  cursor: Cursor
) => Promise<ZymbolTreeTransformation[]> | ZymbolTreeTransformation[];

export interface SourcedTransformer {
  source: string;
  name: string;
  transform: ZymbolTransformer;
}

export interface TransformerFactory {
  source: string;
  name: string;
  factory: (root: Zym, cursor: Cursor) => ZymbolTransformer[];
}

class ZymbolFrameMaster extends ZyMaster<ZymbolFramePersist> {
  zyId = "zymbol_frame";

  newBlankChild(): Zym<any, any, any> {
    return new ZymbolFrame(0, undefined);
  }

  transformerFactories: TransformerFactory[] = [];
  transformers: SourcedTransformer[] = [];

  handleMessage = async (msg: ZentinelMessage) => {
    switch (msg.message) {
      case TransformerMessage.RegisterTransformerFactory: {
        this.registerTransformerFactory(msg.content.factory);

        return ok(true);
      }
      case TransformerMessage.RegisterTransformer: {
        this.registerSourcedTransformer(msg.content.transformer);

        return ok(true);
      }
      case TransformerMessage.GetTransformer: {
        const { cursor } = msg.content as GetTransformerContent;

        return ok(await this.getZymbolTransformer(cursor));
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

  getZymbolTransformer = async (cursor: Cursor) => {
    /* Get the zym root */
    const root = unwrap(await this.callHermes(GET_ZYM_ROOT)) as Zym;

    const transformers = _.flatten(
      this.transformerFactories.map((factory) => factory.factory(root, cursor))
    );

    transformers.push(...this.transformers.map((t) => t.transform));

    if (!transformers.length) {
      return () => [];
    }

    return async (zymbolRoot: Zymbol, zymbolCursor: Cursor) => {
      const copies = await zymbolRoot.clone(transformers.length);

      return _.flatten(
        transformers.map((t, i) => {
          return t(copies[i] as Zymbol, zymbolCursor);
        })
      );
    };
  };
}

export const zymbolFrameMaster = new ZymbolFrameMaster();

interface FrameRenderProps {
  relativeCursor?: ZyOption<Cursor>;
}

/* Helper class */
const Styles = {
  FrameContainer: "items-start",
  SelectionKey:
    "bg-green-200 rounded-md px-2 py-1 text-sm font-semibold text-green-600 shadow-sm shadow-gray",
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

  setBaseZocket = (baseZocket: Zocket) => {
    this.baseZocket = baseZocket;
    this.baseZocket.parent = this;
    this.children = [this.baseZocket];
  };

  component: FC<FrameRenderProps> = (props) => {
    let cursorOpt;

    if (props.relativeCursor) {
      cursorOpt = props.relativeCursor;
    } else {
      cursorOpt = getRelativeCursor(this.baseZocket);
    }

    const relativeCursor = isSome(cursorOpt) ? cursorOpt.val : [];

    const frameTex = this.baseZocket.renderTex({
      cursor: relativeCursor,
    });

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
        return tr.newTreeRoot.renderTex({ cursor: tr.cursor });
      });
      allTex.unshift(frameTex);

      return (
        <div className={Styles.FrameContainer}>
          <div className={Styles.MainFrameContainer}>
            <TexTransform tex={selectedTex} showSelector />
          </div>
          <div className="shadow-lg shadow-gray-400 py-4 px-2 rounded-lg bg-gray-100">
            {allTex.map((t, i) => (
              <div
                className={
                  "p-2" +
                  " " +
                  (this.transformIndex + 1 === i
                    ? Styles.SelectedTransContainer
                    : "") +
                  " " +
                  (!(
                    this.transformIndex + 1 === i ||
                    this.transformIndex === i ||
                    i === allTex.length - 1
                  )
                    ? "border-b"
                    : "")
                }
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

  setNewTransformations = (transformations: ZymbolTreeTransformation[]) => {
    this.transformations = transformations;

    this.rankTransactions();
    const topTrans = this.transformations[0];

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

  hydrate = async (p: ZymbolFramePersist): Promise<void> => {
    this.baseZocket = (await hydrateChild(
      this,
      p[ZFP_FIELDS.BASE_ZOCKET]
    )) as Zocket;
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

    const { keyPressContext, keyPress } = args as KeyPressArgs;
    let { cursor } = args as KeyPressArgs;

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
            const t = trans.getCurrentTransformation();

            frame.setBaseZocket(t.newTreeRoot);

            cursor = [0, ...t.cursor];

            const { nextCursorIndex: n, childRelativeCursor: c } =
              extractCursorInfo(cursor);

            /* Reset mutable vars */
            nextCursorIndex = n;
            childRelativeCursor = c;
          }
        }

        if (keyPress.type === KeyPressBasicType.Enter) {
          frame.setNewTransformations([]);
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
            CreateTransformerMessage.getTransformer(
              frame.getFullCursorPointer()
            )
          )
        ) as ZymbolTransformer;

        // if (
        //   frame.baseZocket.children[0]?.getMasterId() === MODIFIER_ZYMBOL_ID
        // ) {
        //   debugger;
        // }

        /* 2. Apply the transformer to get a list of potential transformations */
        const transformations = await transformer(
          frame.baseZocket,
          childMove.newRelativeCursor
        );

        if (transformations.length > 0) {
          // debugger;
        }

        /* 3. Set setting that indicates that we have a transformation for the next render event */
        frame.setNewTransformations(transformations);
      }

      console.log("beat", frame.children[0]);

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

zymbolFrameMaster.registerCmds([...frameCursorImpl, ...keyPressImpl]);

/* USED FOR HYDRATION */
export const DUMMY_FRAME = new ZymbolFrame(0, undefined);
