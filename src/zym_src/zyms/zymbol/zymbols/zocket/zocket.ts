import { last } from "../../../../../global_utils/array_utils";
import { Zym } from "../../../../../zym_lib/zym/zym";
import {
  FAILED_KEY_PRESS_RESPONSE,
  KeyPressResponse,
  keyPressResponseFromCursorMoveResponse,
} from "../../../../../zym_lib/zym/zym_types";
import { Cursor, CursorIndex } from "../../../../../zym_lib/zy_god/cursor";
import {
  extractCursorInfoFromContext,
  KeyPressContext,
} from "../../../../../zym_lib/zy_god/types/basic_types";
import { ZymbolFrame } from "../../../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import {
  deflectDeleteBehavior,
  DeleteBehavior,
  DeleteBehaviorType,
  normalDeleteBehavior,
} from "../../delete_behavior";
import { Zymbol } from "../../zymbol";

export const ZOCKET_MASTER_ID = "zocket";

export class Zocket extends Zymbol<{}> {
  private zymbols: Zymbol[] = [];

  /* Indicates whether this is the zocket that's directly connected to the main controller, ie
  is at the base of the zymbol tree  */
  private isBaseZocket: boolean;

  constructor(
    isBaseZocket: boolean,
    parentFrame: ZymbolFrame,
    cursorIndex: CursorIndex,
    parent: Zym<any, any> | undefined,
    persisted?: {}
  ) {
    super(parentFrame, cursorIndex, parent, persisted);
    this.isBaseZocket = isBaseZocket;
  }

  /* USED ONLY FOR TESTS */
  getZymbols = () => this.zymbols;
  setZymbols = (zymbols: Zymbol[]) => (this.zymbols = zymbols);

  moveCursorLeft = (ctx: KeyPressContext): KeyPressResponse => {
    const { parentOfCursorElement, nextCursorIndex, newChildContext } =
      extractCursorInfoFromContext(ctx);

    if (parentOfCursorElement && nextCursorIndex === 0) {
      return FAILED_KEY_PRESS_RESPONSE;
    }

    if (parentOfCursorElement) {
      const {
        cursorMoveResponse: { moved, newRelativeCursor },
      } = this.zymbols[nextCursorIndex - 1].takeCursorFromRight();

      if (moved) {
        return {
          cursorMoveResponse: {
            moved: true,
            newRelativeCursor: [nextCursorIndex - 1, ...newRelativeCursor],
          },
        };
      } else {
        return {
          cursorMoveResponse: {
            moved: true,
            newRelativeCursor: [nextCursorIndex - 1],
          },
        };
      }
    } else {
      const {
        cursorMoveResponse: { moved, newRelativeCursor },
      } = this.zymbols[nextCursorIndex].moveCursorLeft(newChildContext);

      if (moved) {
        return {
          cursorMoveResponse: {
            moved: true,
            newRelativeCursor: [nextCursorIndex, ...newRelativeCursor],
          },
        };
      } else {
        return {
          cursorMoveResponse: {
            moved: true,

            newRelativeCursor: [nextCursorIndex],
          },
        };
      }
    }
  };

  takeCursorFromLeft = () => {
    /* This will behave differently if it's at the very base of everything */
    if (this.isBaseZocket) {
      return keyPressResponseFromCursorMoveResponse({
        moved: true,
        newRelativeCursor: [0],
      });
    } else {
      if (this.zymbols.length > 1) {
        return keyPressResponseFromCursorMoveResponse({
          moved: true,
          newRelativeCursor: [1],
        });
      } else {
        return FAILED_KEY_PRESS_RESPONSE;
      }
    }
  };

  moveCursorRight = (ctx: KeyPressContext): KeyPressResponse => {
    const { parentOfCursorElement, nextCursorIndex, newChildContext } =
      extractCursorInfoFromContext(ctx);

    /* If we're at the end of the list, we automatically return lack of success */
    if (parentOfCursorElement && nextCursorIndex === this.zymbols.length) {
      return FAILED_KEY_PRESS_RESPONSE;
    }

    const cursorZymbol = this.zymbols[nextCursorIndex];

    const {
      cursorMoveResponse: { moved, newRelativeCursor },
    } = parentOfCursorElement
      ? cursorZymbol.takeCursorFromLeft()
      : cursorZymbol.moveCursorRight(newChildContext);

    if (moved) {
      return keyPressResponseFromCursorMoveResponse({
        moved: true,
        newRelativeCursor: [nextCursorIndex, ...newRelativeCursor],
      });
    } else {
      return keyPressResponseFromCursorMoveResponse({
        moved: true,
        newRelativeCursor: [nextCursorIndex + 1],
      });
    }
  };

  takeCursorFromRight = (): KeyPressResponse => {
    /* Behaves differently if this is the base zocket */
    if (this.isBaseZocket) {
      return keyPressResponseFromCursorMoveResponse({
        moved: true,
        newRelativeCursor: [this.zymbols.length],
      });
    } else {
      if (this.zymbols.length > 1) {
        return keyPressResponseFromCursorMoveResponse({
          moved: true,
          newRelativeCursor: [this.zymbols.length - 1],
        });
      } else {
        return FAILED_KEY_PRESS_RESPONSE;
      }
    }
  };

  addCharacter: (character: string, ctx: KeyPressContext) => KeyPressResponse;
  getDeleteBehavior: () => DeleteBehavior = () => {
    if (this.zymbols.length > 0) {
      return deflectDeleteBehavior(last(this.zymbols).getDeleteBehavior());
    } else {
      return normalDeleteBehavior(DeleteBehaviorType.ALLOWED);
    }
  };

  renderTex = () => {
    const { parentOfCursorElement, nextCursorIndex, childRelativeCursor } =
      extractCursorInfo(cursor);

    let finalTex = "";

    if (parentOfCursorElement && this.zymbols.length === 0) {
      return CURSOR_LATEX;
    }

    for (let i = 0; i < this.zymbols.length; i++) {
      if (parentOfCursorElement) {
        if (i === nextCursorIndex) {
          finalTex += CURSOR_LATEX;
        }

        finalTex += this.zymbols[i].renderTex([]);
      } else {
        finalTex += this.zymbols[i].renderTex(
          i === nextCursorIndex ? childRelativeCursor : []
        );
      }
    }

    if (parentOfCursorElement && nextCursorIndex === this.zymbols.length) {
      finalTex += CURSOR_LATEX;
    }

    return finalTex;
  };
  };

  getInitialCursor(): Cursor {
    throw new Error("Method not implemented.");
  }

  persist(): {} {
    return {};
  }

  hydrate(_persisted: {}): void {}

  getZyMasterId(): string {
    return ZOCKET_MASTER_ID;
  }
}
