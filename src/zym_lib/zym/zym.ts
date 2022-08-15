import { ZentinelMethodPointer, ZentinelMethodSchema } from "../hermes/hermes";
import { unwrapOption, ZyOption } from "../utils/zy_option";
import {
  Cursor,
  CursorIndex,
  extendParentCursor,
} from "../zy_god/cursor/cursor";
import {
  ZyFullPersist,
  zymPersist,
  ZymPersist,
  ZyPartialPersist,
  ZyPersistedSchemaSymbols,
  ZyPersistenceSchema,
  ZySchema,
} from "../zy_schema/zy_schema";
import { ZyMaster } from "./zy_master";
import {
  TraitMethodResponse,
  ZyTraitPointer,
  ZyTraitSchema,
} from "../zy_trait/zy_trait";
import { defaultTraitZentinelMethodList } from "../zy_trait/default_trait_zentinel/default_trait_zentinel_schema";
import { ZyGodMethod } from "../zy_god/zy_god_schema";

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
export abstract class Zym<
  Schema extends ZySchema,
  PersistenceSchema extends ZyPersistenceSchema<Schema>,
  RenderContentType = any,
  RenderOptions = any
> {
  /* Allows us to determine zym's position amongst it's siblings */
  private cursorIndex: CursorIndex;

  /* Tree pointers */
  parent?: Zym<any, any>;
  abstract children: Zym<any, any>[];

  /* Master */
  abstract readonly zyMaster: ZyMaster<Schema, PersistenceSchema, any>;

  /* Persistence Schema */
  private persistedSchemaSymbols?: ZyPersistedSchemaSymbols<
    Schema,
    PersistenceSchema
  >;
  private invertedSchemaSymbols?: { [key: string]: string };

  /* Instance id (used for re-rendering...) */
  iid = Math.random();

  constructor(cursorIndex: CursorIndex, parent: Zym<any, any> | undefined) {
    this.cursorIndex = cursorIndex;
    this.parent = parent;
  }

  /* We always need to call this in the constructor */
  setPersistenceSchemaSymbols(
    persistedSchema: ZyPersistedSchemaSymbols<Schema, PersistenceSchema>
  ) {
    this.persistedSchemaSymbols = persistedSchema;
    const inverted: any = {};

    for (const [key, value] of Object.entries(persistedSchema)) {
      inverted[value] = key;
    }

    this.invertedSchemaSymbols = inverted;
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
  abstract getRenderContent(opts?: RenderOptions): RenderContentType;

  renderAndGetRenderContent(opts?: RenderOptions): RenderContentType {
    this.render(opts);
    return this.getRenderContent(opts);
  }

  /* ===== PERSISTENCE METHODS ===== */

  errorMessage = () =>
    `You haven't set Persisted Symbols for ${this.getMasterId()}! Be sure to do this in the constructor!`;

  /* Persists the zym */
  persist = (): ZymPersist<Schema, PersistenceSchema> => {
    let fullPersist: any = {};

    if (!this.persistedSchemaSymbols) {
      throw new Error(this.errorMessage());
    }

    for (const [key, value] of Object.entries(this.persistData())) {
      fullPersist[this.persistedSchemaSymbols![key]] = value;
    }

    return zymPersist(this.getMasterId(), fullPersist);
  };

  abstract persistData(): ZyPartialPersist<Schema, PersistenceSchema>;

  hydrate(p: Partial<ZyFullPersist<Schema, PersistenceSchema>>): Promise<void> {
    const partialPersist: any = {};

    if (!this.invertedSchemaSymbols) {
      throw new Error(this.errorMessage());
    }

    for (const [key, value] of Object.entries(p)) {
      partialPersist[this.invertedSchemaSymbols![key]] = value;
    }

    return this.hydrateFromPartialPersist(partialPersist);
  }

  abstract hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<Schema, PersistenceSchema>>
  ): Promise<void>;

  /* ===== TREE METHODS ===== */
  clone = async (
    copies = 1,
    newParent?: Zym<any, any>
  ): Promise<
    Zym<Schema, PersistenceSchema, RenderContentType, RenderOptions>[]
  > => {
    const p = this.persist();

    let all: Promise<
      ZyOption<Zym<Schema, PersistenceSchema, RenderContentType, RenderOptions>>
    >[] = [];

    for (let i = 0; i < copies; i++) {
      all.push(this.callZentinelMethod(ZyGodMethod.hydratePersistedZym, p));
    }

    const finalCopies = (await Promise.all(all)).map(unwrapOption);

    if (newParent) {
      finalCopies.forEach((f) => (f.parent = newParent));
    }

    return finalCopies;
  };

  getMasterId = () => this.zyMaster.zyId;

  /* ===== COMMANDS ===== */
  callTraitMethod = async <
    Schema extends ZyTraitSchema,
    Method extends keyof Schema
  >(
    pointer: ZyTraitPointer<Schema, Method>,
    args: Schema[Method]["args"]
  ): Promise<TraitMethodResponse<Schema[Method]["return"]>> => {
    const local = await this.zyMaster.callTraitMethod(this, pointer, args);

    if (local.implemented) {
      return local;
    }

    /* Use a magic hermes call to get an implementation from either god or the default trait zentinel */
    return await this.callZentinelMethod(
      defaultTraitZentinelMethodList.callTraitMethod,
      {
        zym: this,
        pointer,
        args,
      }
    );
  };

  callZentinelMethod = async <
    OtherSchema extends ZentinelMethodSchema,
    Method extends keyof OtherSchema
  >(
    pointer: ZentinelMethodPointer<OtherSchema, Method>,
    args: OtherSchema[Method]["args"]
  ): Promise<OtherSchema[Method]["return"]> => {
    return this.zyMaster.callZentinelMethod(pointer, args);
  };
}
