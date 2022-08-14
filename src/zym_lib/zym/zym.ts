import { HermesMessage } from "../hermes/hermes";
import {
  pointerToPath,
  UNIMPLEMENTED,
  unwrapOption,
  unwrap,
  ZyCmdPointer,
  ZyResult,
} from "../zy_trait/zy_command_types";
import {
  Cursor,
  CursorIndex,
  extendParentCursor,
} from "../zy_god/cursor/cursor";
import {
  checkGlobalImplementation,
  defaultCmd,
} from "../zy_god/divine_api/zy_global_cmds";
import { ZyGodMessage } from "../zy_god/zy_god";
import { ZyId } from "../zy_types/basic_types";
import { ZyMaster } from "./zy_master";
import {
  TraitMethodResponse,
  UNIMPL,
  ZyTraitPointer,
  ZyTraitSchema,
} from "../zy_trait/zy_trait";

export const ZYM_PERSIST_FIELDS: {
  MASTER_ID: "m";
  DATA: "d";
} = {
  MASTER_ID: "m",
  DATA: "d",
};

export interface ZymPersist<P> {
  [ZYM_PERSIST_FIELDS.MASTER_ID]: ZyId;
  [ZYM_PERSIST_FIELDS.DATA]: P;
}

export function zymPersist<P>(masterId: ZyId, data: P): ZymPersist<P> {
  return {
    [ZYM_PERSIST_FIELDS.MASTER_ID]: masterId,
    [ZYM_PERSIST_FIELDS.DATA]: data,
  };
}

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
  parent?: Zym<any, any>;
  abstract children: Zym<any, any>[];

  /* Master */
  abstract readonly zyMaster: ZyMaster;

  /* Instance id (used for re-rendering...) */
  iid = Math.random();

  constructor(cursorIndex: CursorIndex, parent: Zym<any, any> | undefined) {
    this.cursorIndex = cursorIndex;
    this.parent = parent;
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

  reConnectParentChildren = () => {
    this.reIndexChildren();

    for (let i = 0; i < this.children.length; i++) {
      this.children[i].parent = this;
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
  persist = (): ZymPersist<P> => {
    return zymPersist(this.getMasterId(), this.persistData());
  };

  abstract persistData(): P;

  abstract hydrate(p: Partial<P>): Promise<void>;

  /* ===== TREE METHODS ===== */
  clone = async (copies = 1, newParent?: Zym): Promise<Zym<T, P>[]> => {
    const p = this.persist();

    let finalCopies: Zym<T, P>[] = [];

    for (let i = 0; i < copies; i++) {
      finalCopies.push(
        unwrapOption(
          unwrap(await this.callHermes(ZyGodMessage.hydrateZym(p)))
        ) as Zym
      );
    }

    if (newParent) {
      finalCopies.forEach((f) => (f.parent = newParent));
    }

    return finalCopies;
  };

  /* ===== COMMANDS ===== */
  cmd = async <T, A = any>(
    pointer: ZyCmdPointer,
    args?: A
  ): Promise<ZyResult<T>> => {
    const path = pointerToPath(pointer);

    /* Look for a local implementation */
    const local = await this.zyMaster.cmd<T>(this, path, args);

    if (local.ok) return local;

    /* Now look for a default implementation */
    const global = await defaultCmd<T>(this, path, args);

    if (global.ok) return global;

    return UNIMPLEMENTED;
  };

  callTraitMethod = async <
    Schema extends ZyTraitSchema,
    Method extends keyof Schema
  >(
    pointer: ZyTraitPointer<Schema, Method>,
    ...args: Schema[Method]["args"] extends undefined
      ? [undefined?]
      : [Schema[Method]["args"]]
  ): Promise<TraitMethodResponse<Schema[Method]["return"]>> => {
    const local = await this.zyMaster.callTraitMethod(this, pointer, ...args);

    if (local.implemented) return local;

    /* Use a magic hermes call to get an implementation from either god or the default trait zentinel */

    return UNIMPL;
  };

  checkCmdImplemented = (pointer: ZyCmdPointer): boolean => {
    const path = pointerToPath(pointer);
    return checkGlobalImplementation(path) || this.zyMaster.checkCmd(path);
  };

  getMasterId = () => this.zyMaster.zyId;

  /* ===== HERMES CALL ======  */
  callHermes = async (msg: HermesMessage) => {
    return this.zyMaster.callHermes(msg);
  };
}
