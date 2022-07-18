import { FC } from "react";
import { isInferTypeNode } from "typescript";
import Tex from "../../../../global_building_blocks/tex/tex";
import { ZentinelMessage } from "../../../../zym_lib/hermes/hermes";
import { Zym } from "../../../../zym_lib/zym/zym";
import { Zyact } from "../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../../zym_lib/zym/zy_master";
import {
  implementPartialCmdGroup,
  isSome,
  unwrap,
  ZyOption,
  ZyResult,
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
import { getRelativeCursor } from "../../../../zym_lib/zy_god/divine_api/divine_accessors";
import {
  KeyPressArgs,
  KeyPressCommand,
  KeyPressComplexType,
} from "../../../../zym_lib/zy_god/event_handler/key_press";
import {
  CreateTransformerMessage,
  ZymbolTransformer,
  ZymbolTreeTransformation,
} from "../../../zentinels/transformer/transformer";
import { Zocket } from "../../zymbol/zymbols/zocket/zocket";
import { frameCursorImpl } from "./cmd/zf_cursor";
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

/* === Zym ====  */
export class ZymbolFrame extends Zyact<ZymbolFramePersist, FrameRenderProps> {
  zyMaster: ZyMaster = zymbolFrameMaster;

  baseZocket: Zocket = new Zocket(true, this, 0, this);
  children: Zym<any, any>[] = [this.baseZocket];

  showTransformations = false;
  transformations: ZymbolTreeTransformation[] = [];

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

    console.log("frame text", JSON.stringify(frameTex));

    return <Tex tex={frameTex} />;
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

  private getTopTransformationSuggestion = () => {
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
    const { cursor, keyPressContext, keyPress } = args as KeyPressArgs;

    const { nextCursorIndex, childRelativeCursor } = extractCursorInfo(cursor);

    /* We only have one child */
    if (nextCursorIndex === 0) {
      let isInputKey = false;

      /* Start out by checking if this is a key, and if we need to handle a special condition based on a potential transform */
      if (keyPress.type === KeyPressComplexType.Key) {
        /* TODO: Implement this */
        isInputKey = true;
      }

      /* Otherwise, we handle everything as normal */

      const child: Zym = zym.children[nextCursorIndex];

      const childMove = unwrap(
        child.cmd<CursorMoveResponse, KeyPressArgs>(
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

        /* 2. Apply the transformer to get a list of potential transformations */
        const transformations = transformer(frame.baseZocket);

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

zymbolFrameMaster.registerCmds([...frameCursorImpl, ...keyPressImpl]);
