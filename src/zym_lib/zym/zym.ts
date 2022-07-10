import {
  pointerToPath,
  UNIMPLEMENTED,
  ZyCmdPointer,
  ZyResult,
} from "../zy_commands/zy_command_types";
import {
  Cursor,
  CursorIndex,
  extendParentCursor,
} from "../zy_god/cursor/cursor";
import {
  checkGlobalImplementation,
  globalCmd,
} from "../zy_god/divine_api/zy_global_cmds";
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
export abstract class Zym<T = any, P = any, RenderOptions = any> {
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

  setCursorIndex = (cursorIndex: CursorIndex) => {
    this.cursorIndex = cursorIndex;
  };

  reIndexChildren = () => {
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].setCursorIndex(i);
    }
  };

  getFullCursorPointer = (): Cursor => {
    if (this.parent) {
      return extendParentCursor(
        this.cursorIndex,
        this.parent.getFullCursorPointer()
      );
    } else {
      return [];
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
  cmd = <T, A = any>(pointer: ZyCmdPointer, args?: A): ZyResult<T> => {
    const path = pointerToPath(pointer);

    /* Look for a local implementation */
    const local = this.zyMaster.cmd<T>(this, path, args);

    if (local.ok) return local;

    /* Now look for a default implementation */
    const global = globalCmd<T>(this, path, args);

    if (global.ok) return global;

    return UNIMPLEMENTED;
  };

  checkCmdImplemented = (pointer: ZyCmdPointer): boolean => {
    const path = pointerToPath(pointer);
    return checkGlobalImplementation(path) || this.zyMaster.checkCmd(path);
  };

  getMasterId = () => this.zyMaster.zyId;
}
