import {
  UNIMPLEMENTED,
  ZyCmdArgs,
  ZyCmdPath,
  ZyResult,
} from "../zy_commands/zy_command_types";
import {
  Cursor,
  CursorIndex,
  extendParentCursor,
  extractCursorInfo,
} from "../zy_god/cursor/cursor";
import {
  checkGlobalImplementation,
  globalCmd,
} from "../zy_god/divine_api/zy_global_cmds";
import { KeyPressContext, ZymKeyPress } from "../zy_god/types/context_types";
import { RenderOptions } from "../zy_god/types/render_types";
import { ZyId } from "../zy_types/basic_types";
import {
  KeyPressResponse,
  TreeCommand,
  ZymCommand,
  ZymCommandResponse,
} from "./zym_types";
import { ZyMaster } from "./zy_master";

/**
 * A zym is a basic object that is stored in the zym hierarchy.  This is essentially
 * a piece of data that has a visual representation (which is accessed via the render methods).
 * Additionally, methods can be registered with either the zyGod, or the Zym's ZyMaster
 * that can be called that manipulate the zym's data, or potentially re-paint the zym on
 * the screen.
 *
 * This method of architecting zym allows us to have a minimal class implementation,
 * while additional methods can always be added with small architecture costs by registering commands
 * with ZyGod or ZyMasters
 * */
export abstract class Zym<T = any, P = any> {
  /* Allows us to determine zym's position amongst it's siblings */
  private cursorIndex: CursorIndex;

  /* Tree pointers */
  private parent?: Zym<any, any>;
  abstract children: Zym<any, any>[];

  /* Master */
  abstract readonly zyMaster: ZyMaster;

  constructor(
    cursorIndex: CursorIndex,
    parent: Zym<any, any> | undefined,
    persisted?: P
  ) {
    this.cursorIndex = cursorIndex;
    this.parent = parent;

    if (persisted) {
      this.hydrate(persisted);
    }
  }

  getCursorIndex = () => this.cursorIndex;

  getFullCursorPointer = (): Cursor => {
    if (this.parent) {
      return extendParentCursor(
        this.cursorIndex,
        this.parent.getFullCursorPointer()
      );
    } else {
      return [this.cursorIndex];
    }
  };

  /* ===== MAIN RENDER METHODS ===== */

  /**
   * Paints the content associated with this zym
   * on the screen, not effecting any other zym
   * */
  abstract render(opts?: RenderOptions): void;

  /**
   * Gets information that the parent requires
   * to render itself
   * */
  abstract getRenderContent(opts?: RenderOptions): T;

  renderAndGetRenderContent(opts?: RenderOptions): T {
    this.render(opts);
    return this.getRenderContent(opts);
  }

  /* ===== PERSISTENCE METHODS ===== */

  /* Persists the zym */
  abstract persist(): P;

  /* Hydrates the zym from persisted data */
  abstract hydrate(persisted: P): void;

  /* ===== COMMANDS ===== */
  cmd = <T>(path: ZyCmdPath, args?: ZyCmdArgs): ZyResult<T> => {
    /* First look if we have this function globally... */
    const global = globalCmd<T>(this, path, args);

    if (global.ok) return global;

    /* Now we look inside our master */
    const local = this.zyMaster.cmd<T>(this, path, args);

    if (local.ok) return local;

    return UNIMPLEMENTED;
  };

  checkCmdImplemented = (path: ZyCmdPath): boolean =>
    checkGlobalImplementation(path) || this.zyMaster.checkCmd(path);

  /* ===== KEY HANDLERS ===== */
  abstract handleKeyPress(
    keyPress: ZymKeyPress,
    ctx: KeyPressContext
  ): KeyPressResponse;
}
