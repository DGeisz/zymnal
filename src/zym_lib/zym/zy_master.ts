import { Zentinel } from "../zentinel/zentinel";
import {
  call,
  ok,
  serializePath,
  UNIMPLEMENTED,
  validatePath,
  ZyCmdArgs,
  ZyCmdHandler,
  ZyCmdPath,
  ZyCmdSerialPath,
  ZyCommandRegistration,
  ZyResult,
} from "../zy_trait/zy_command_types";
import {
  impl,
  TraitMethodImplementation,
  TraitMethodResponse,
  UNIMPL,
  ZyTrait,
  ZyTraitPointer,
  ZyTraitSchema,
} from "../zy_trait/zy_trait";
import { ZyId } from "../zy_types/basic_types";
import { Zym } from "./zym";

export abstract class ZyMaster extends Zentinel {
  private cmdRegistry: Map<ZyCmdSerialPath, ZyCmdHandler<any>> = new Map();
  private traitMethodRegistry: Map<
    ZyTraitPointer<any, any>,
    TraitMethodImplementation<any, any>
  > = new Map();

  checkCmd = (path: ZyCmdPath) => this.cmdRegistry.has(serializePath(path));

  cmd = async <T>(
    zym: Zym,
    path: ZyCmdPath,
    args: ZyCmdArgs
  ): Promise<ZyResult<T>> => {
    const handler = this.cmdRegistry.get(serializePath(path));

    if (handler) {
      return ok(await call(handler, zym, args));
    } else {
      return UNIMPLEMENTED;
    }
  };

  callTraitMethod = async <
    Schema extends ZyTraitSchema,
    Method extends keyof Schema
  >(
    zym: Zym,
    pointer: ZyTraitPointer<Schema, Method>,
    ...args: Schema[Method]["args"] extends undefined
      ? [undefined?]
      : [Schema[Method]["args"]]
  ): Promise<TraitMethodResponse<Schema[Method]["return"]>> => {
    const method: TraitMethodImplementation<Schema, Method> | undefined =
      this.traitMethodRegistry.get(pointer);

    if (method) {
      return impl(method(zym, ...args));
    } else {
      return UNIMPL;
    }
  };

  implementTrait = <Schema extends ZyTraitSchema>(
    trait: ZyTrait<Schema>,
    implementation: Partial<{
      [key in keyof Schema]: TraitMethodImplementation<Schema, key>;
    }>
  ) => {
    for (const key in implementation) {
      this.traitMethodRegistry.set(trait[key], implementation[key]!);
    }
  };

  registerCmd = <T>(reg: ZyCommandRegistration<T>, override?: boolean) => {
    const { path, handler } = reg;

    if (validatePath(path)) {
      const sPath = serializePath(path);

      if (!this.cmdRegistry.has(sPath) || override) {
        this.cmdRegistry.set(sPath, handler);
      } else {
        throw new Error(`${sPath} already implemented!`);
      }
    } else {
      throw new Error("Invalid path!");
    }
  };

  registerCmds = (regs: ZyCommandRegistration<any>[]) => {
    regs.forEach((reg) => this.registerCmd(reg));
  };

  abstract newBlankChild(): Zym;

  async hydrate(persistData: any): Promise<Zym<any, any, any>> {
    const newZym = this.newBlankChild();
    await newZym.hydrate(persistData);

    return newZym;
  }

  abstract readonly zyId: ZyId;
}
