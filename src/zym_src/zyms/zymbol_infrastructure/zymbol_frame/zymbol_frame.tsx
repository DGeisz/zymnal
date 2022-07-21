import React, { FC } from "react";
import { getDefaultFormatCodeSettings } from "typescript";
import Tex from "../../../../global_building_blocks/tex/tex";
import { Zym } from "../../../../zym_lib/zym/zym";
import { Zyact } from "../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../../zym_lib/zym/zy_master";
import {
  implementPartialCmdGroup,
  isSome,
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
  KeyPressModifier,
  keyPressModifierToSymbol,
  SECONDARY_SELECTOR,
  ZymKeyPress,
} from "../../../../zym_lib/zy_god/event_handler/key_press";
import {
  CreateTransformerMessage,
  ZymbolTransformer,
  ZymbolTreeTransformation,
} from "../../../zentinels/transformer/transformer";
import { Zocket } from "../../zymbol/zymbols/zocket/zocket";
import { TeX } from "../../zymbol/zymbol_types";
import { ZymbolFramePersist } from "./zf_persist";

/* === MASTER ===  */

class ZymbolFrameMaster extends ZyMaster {
  zyId = "zymbol_frame";
}

export const zymbolFrameMaster = new ZymbolFrameMaster();

interface FrameRenderProps {
  relativeCursor?: ZyOption<Cursor>;
}

enum TransformationCursorLocationType {
  Exact,
  End,
}

interface TransformationCursorLocation {
  cursor: Cursor;
  location: TransformationCursorLocationType;
}

/* Helper class */
const Styles = {
  FrameContainer: "items-start",
  SelectionKey:
    "bg-green-200 rounded-md px-2 py-1 text-sm font-semibold text-green-600 shadow-sm shadow-gray",
  MainFrameContainer: "m-4 mt-0",
};

/* Helper Utils */
function getDefaultSelector(mainSelector?: ZymKeyPress): ZymKeyPress {
  if (mainSelector) {
    if (keyPressEqual(mainSelector, DEFAULT_SELECTOR)) {
      return SECONDARY_SELECTOR;
    } else {
      return DEFAULT_SELECTOR;
    }
  } else {
    return DEFAULT_SELECTOR;
  }
}

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
            {(selector?.modifiers ?? []).map((m) => (
              <>
                <span className={Styles.SelectionKey}>
                  {keyPressModifierToSymbol(m)}
                </span>
                <span className="mx-1">+</span>
              </>
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

  baseZocket: Zocket = new Zocket(true, this, 0, this);
  children: Zym<any, any>[] = [this.baseZocket];

  showTransformations = false;
  transformations: ZymbolTreeTransformation[] = [];

  setBaseZocket = (baseZocket: Zocket) => {
    this.baseZocket = baseZocket;
    this.children = [this.baseZocket];
  };

  clone = (newParent?: Zym) => {
    const newFrame = new ZymbolFrame(
      this.getCursorIndex(),
      newParent ?? this.parent
    );

    newFrame.baseZocket = this.baseZocket.clone() as Zocket;
    newFrame.children = [newFrame.baseZocket];

    return newFrame;
  };

  component: FC<FrameRenderProps> = (props) => {
    let cursorOpt;

    // console.log("comp", this);

    if (props.relativeCursor) {
      cursorOpt = props.relativeCursor;
    } else {
      cursorOpt = getRelativeCursor(this.baseZocket);
    }

    const relativeCursor = isSome(cursorOpt) ? cursorOpt.val : [];

    const frameTex = this.baseZocket.renderTex({
      cursor: relativeCursor,
    });

    const topTrans = this.getTopTransformation();

    if (topTrans) {
      const defaultSelector = getDefaultSelector(topTrans.selector);

      return (
        <div className={Styles.FrameContainer}>
          <div className={Styles.MainFrameContainer}>
            <TexTransform
              tex={topTrans.newTreeRoot.renderTex({ cursor: topTrans.cursor })}
              showSelector
              selector={topTrans.selector}
            />
          </div>
          <div className="shadow-lg shadow-gray-400 p-4 rounded-lg bg-gray-100">
            <TexTransform
              tex={frameTex}
              showSelector
              selector={defaultSelector}
            />
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

  persist(): ZymbolFramePersist {
    return {};
  }

  hydrate(_persisted: ZymbolFramePersist): void {}

  /* This is called typically after a character has been added, 
  and it indicates that we want to take the current zymbol tree and 
  transform it into a new desired form */
  prepareTransformation = (loc: TransformationCursorLocation) => {};

  setTransformations = (transformations: ZymbolTreeTransformation[]) => {
    if (transformations.length > 0) {
      this.transformations = transformations;
      this.showTransformations = true;
    } else {
      this.showTransformations = false;
      this.transformations = [];
    }
  };

  setTransformationsVisible = (show: boolean) => {
    this.showTransformations = show;
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
        return b.priority.value - a.priority.value;
      } else {
        return b.priority.rank - a.priority.rank;
      }
    });
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

        /* Check if we have active transformations */
        if (frame.transformations.length > 0) {
          const topTrans = frame.getTopTransformation()!;
          const defaultSelector = getDefaultSelector(topTrans.selector);
          let selectTrans = false;

          if (topTrans.selector) {
            if (keyPressEqual(keyPress, topTrans.selector)) {
              selectTrans = true;
            } else if (keyPressEqual(defaultSelector, keyPress)) {
              frame.setTransformations([]);
              return successfulMoveResponse(cursor);
            } else {
              /* If it doesn't match either, then we fail */
              return FAILED_CURSOR_MOVE_RESPONSE;
            }
          } else {
            /* Check if we've selected any key or the default selector */
            if (keyPressEqual(keyPress, defaultSelector)) {
              frame.setTransformations([]);
              return successfulMoveResponse(cursor);
            } else {
              selectTrans = true;
            }
          }

          if (selectTrans) {
            frame.setBaseZocket(topTrans.newTreeRoot);

            cursor = [0, ...topTrans.cursor];

            const { nextCursorIndex: n, childRelativeCursor: c } =
              extractCursorInfo(cursor);

            /* Reset mutable vars */
            nextCursorIndex = n;
            childRelativeCursor = c;
          }
        }
      }

      frame.setTransformations([]);

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

      console.log("childMove", childMove.newRelativeCursor);

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

        /* 2. Apply the transformer to get a list of potential transformations */
        const transformations = transformer(
          frame.baseZocket,
          childMove.newRelativeCursor
        );

        /* 3. Set setting that indicates that we have a transformation for the next render event */
        frame.setTransformations(transformations);
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

zymbolFrameMaster.registerCmds([...frameCursorImpl, ...keyPressImpl]);
