import _ from "underscore";
import { last } from "../../../global_utils/array_utils";
import { Zym } from "../../../zym_lib/zym/zym";
import {
  groupPathFactory,
  implementPartialCmdGroup,
  justPath,
  unwrap,
  ZyCommandGroup,
  ZyCommandGroupType,
} from "../../../zym_lib/zy_commands/zy_command_types";
import {
  Cursor,
  CursorIndex,
  CursorMoveResponse,
  extractCursorInfo,
  FAILED_CURSOR_MOVE_RESPONSE,
  wrapChildCursorResponse,
} from "../../../zym_lib/zy_god/cursor/cursor";
import {
  KeyPressBasicType,
  KeyPressComplexType,
  KeyPressModifier,
  ZymbolDirection,
  ZymKeyPress,
} from "../../../zym_lib/zy_god/event_handler/key_press";
import { BasicContext } from "../../../zym_lib/zy_god/types/context_types";
import { CreateZyGodMessage } from "../../../zym_lib/zy_god/zy_god";
import { ZymbolFrame } from "../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import { DeleteBehavior } from "./delete_behavior";
import { TeX } from "./zymbol_types";

/* Help */
export interface ZymbolRenderArgs {
  cursor: Cursor;
  excludeHtmlIds?: boolean;
}

export const KEYPRESS_ZYMBOL = "keypress";

export function getKeyPress(ctx: BasicContext): ZymKeyPress {
  return ctx.get(KEYPRESS_ZYMBOL);
}

export function keyPressHasModifier(
  ctx: BasicContext,
  mod: KeyPressModifier
): boolean {
  const { modifiers } = getKeyPress(ctx);

  return !!modifiers && modifiers.includes(mod);
}

export interface SpliceDeleteResponse {
  zymbols: Zymbol[];
  putCursorAtEnd: boolean;
}

export abstract class Zymbol<P = any> extends Zym<TeX, P> {
  parentFrame: ZymbolFrame;
  abstract children: Zymbol[];

  constructor(
    parentFrame: ZymbolFrame,
    cursorIndex: CursorIndex,
    parent: Zym<any, any> | undefined
  ) {
    super(cursorIndex, parent);
    this.parentFrame = parentFrame;
  }

  render = () => {
    this.parentFrame.render();
  };

  /* Override this if you want any special cleanup methods applied after a keypress */
  onHandleKeyPress = (
    res: CursorMoveResponse,
    _keyPress: ZymKeyPress
  ): CursorMoveResponse => {
    return res;
  };

  handleKeyPress = (
    keyPress: ZymKeyPress,
    cursor: Cursor,
    ctx: BasicContext
  ): CursorMoveResponse => {
    ctx.set(KEYPRESS_ZYMBOL, keyPress);
    this.reIndexChildren();

    let res: CursorMoveResponse;
    switch (keyPress.type) {
      case KeyPressBasicType.ArrowLeft:
        res = this.moveCursorLeft(cursor, ctx);
        break;
      case KeyPressBasicType.ArrowRight:
        res = this.moveCursorRight(cursor, ctx);
        break;
      case KeyPressBasicType.ArrowUp:
        res = this.moveCursorUp(cursor, ctx);
        break;
      case KeyPressBasicType.ArrowDown:
        res = this.moveCursorDown(cursor, ctx);
        break;
      case KeyPressBasicType.Delete:
        res = this.delete(cursor, ctx);
        break;
      case KeyPressComplexType.Key: {
        res = this.addCharacter(keyPress.key, cursor, ctx);
        break;
      }
      default: {
        res = this.defaultKeyPressHandler(keyPress, cursor, ctx);
        break;
      }
    }

    return this.onHandleKeyPress(res, keyPress);
  };

  defaultKeyPressHandler = (
    keyPress: ZymKeyPress,
    cursor: Cursor,
    ctx: BasicContext
  ): CursorMoveResponse => {
    const { childRelativeCursor, nextCursorIndex } = extractCursorInfo(cursor);

    if (
      keyPress.type === KeyPressBasicType.Enter &&
      (cursor.length === 0 ||
        nextCursorIndex <= -1 ||
        nextCursorIndex >= this.children.length)
    ) {
      this.callHermes(
        CreateZyGodMessage.queueSimulatedKeyPress({
          type: KeyPressBasicType.ArrowRight,
        })
      );

      return FAILED_CURSOR_MOVE_RESPONSE;
    } else {
      return wrapChildCursorResponse(
        this.children[nextCursorIndex].defaultKeyPressHandler(
          keyPress,
          childRelativeCursor,
          ctx
        ),
        nextCursorIndex
      );
    }
  };

  abstract moveCursorLeft(
    cursor: Cursor,
    ctx: BasicContext
  ): CursorMoveResponse;
  abstract takeCursorFromLeft(ctx: BasicContext): CursorMoveResponse;

  abstract moveCursorRight(
    cursor: Cursor,
    ctx: BasicContext
  ): CursorMoveResponse;
  abstract takeCursorFromRight(ctx: BasicContext): CursorMoveResponse;

  absorbCursor = (ctx: BasicContext) => this.takeCursorFromRight(ctx);

  abstract moveCursorUp(cursor: Cursor, ctx: BasicContext): CursorMoveResponse;

  abstract captureArrowUp(
    fromSide: ZymbolDirection,
    ctx: BasicContext
  ): CursorMoveResponse;

  abstract moveCursorDown(
    cursor: Cursor,
    ctx: BasicContext
  ): CursorMoveResponse;

  abstract captureArrowDown(
    fromSide: ZymbolDirection,
    ctx: BasicContext
  ): CursorMoveResponse;

  abstract addCharacter(
    character: string,
    cursor: Cursor,
    ctx: BasicContext
  ): CursorMoveResponse;

  abstract getDeleteBehavior(): DeleteBehavior;

  /* This needs to be overloaded for any more complex zymbol */
  abstract delete(cursor: Cursor, ctx: BasicContext): CursorMoveResponse;

  /* This needs to be overloaded if the zymbol allows deflect deletes.
  @return: Indicates whether the deflect delete was successful */
  deflectDelete = (_ctx: BasicContext): boolean => false;

  spliceDelete = (
    _cursor: Cursor,
    _ctx: BasicContext
  ): SpliceDeleteResponse | undefined => ({
    zymbols: [],
    putCursorAtEnd: true,
  });

  /** 
  If this returns something defined, it indicates
  we want to delete the zymbol using the given delete behavior 
  */
  letParentDeleteWithDeleteBehavior = (
    _cursor: Cursor,
    _ctx: BasicContext
  ): DeleteBehavior | undefined => undefined;

  abstract renderTex(opts: ZymbolRenderArgs): TeX;

  getRenderContent = (opts: ZymbolRenderArgs) => this.renderTex(opts);

  setParentFrame = (frame: ZymbolFrame) => {
    this.parentFrame = frame;
    this.children.forEach((c) => (c as Zymbol).setParentFrame(frame));
  };

  recursivelyReIndexChildren = () => {
    this.reIndexChildren();
    this.reConnectParentChildren();

    this.children.forEach((c) => (c as Zymbol).recursivelyReIndexChildren());
  };
}

export const ZYMBOL_HTML_ID_COMMANDS = "zymbol-html-id-com";

export interface ZymbolHtmlClickInfo {
  loc: Cursor;
  /* Where the cursor should go after it's clicked */
  clickCursor: Cursor;
}

interface ZymbolHtmlIdCommandGroupType extends ZyCommandGroupType {
  getAllDescendentHTMLIds: {
    args: undefined;
    return: ZymbolHtmlClickInfo[];
  };
}

const hcc = groupPathFactory(ZYMBOL_HTML_ID_COMMANDS);

export const ZymbolHtmlIdCommandGroup: ZyCommandGroup<ZymbolHtmlIdCommandGroupType> =
  {
    getAllDescendentHTMLIds: justPath(hcc("gadh")),
  };

export const defaultZymbolHtmlIdImpl = implementPartialCmdGroup(
  ZymbolHtmlIdCommandGroup,
  {
    async getAllDescendentHTMLIds(zym) {
      return _.flatten(
        await Promise.all(
          zym.children.map(async (c) =>
            unwrap(
              await c.cmd<ZymbolHtmlClickInfo[]>(
                ZymbolHtmlIdCommandGroup.getAllDescendentHTMLIds
              )
            )
          )
        ),
        1
      );
    },
  }
);

export const basicZymbolHtmlIdImpl = implementPartialCmdGroup(
  ZymbolHtmlIdCommandGroup,
  {
    async getAllDescendentHTMLIds(zym) {
      const pointer = zym.getFullCursorPointer();

      const nextPointer = [...pointer];
      nextPointer.splice(nextPointer.length - 1, 1, last(nextPointer) + 1);

      return [
        {
          loc: pointer,
          clickCursor: nextPointer,
        },
      ];
    },
  }
);
