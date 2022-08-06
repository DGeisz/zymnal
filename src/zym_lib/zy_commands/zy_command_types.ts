import { Zym } from "../zym/zym";
import { ZyId } from "../zy_types/basic_types";

/* PATH */
export type ZyGroupCmdPathNode = {
  groupId: ZyId;
  name: string;
};

export type ZyCmdPathNode = string | ZyGroupCmdPathNode;
export type ZyCmdPath = ZyCmdPathNode[];

export function groupPathFactory(groupId: string): (name: string) => ZyCmdPath {
  return (name: string) => [{ groupId, name }];
}

function validatePathString(str: string): boolean {
  return !str.includes(":") && !str.includes(";");
}

export function validatePath(path: ZyCmdPath): boolean {
  return path.every((node) => {
    if (typeof node == "string") {
      return validatePathString(node);
    } else {
      return Object.values(node).every(validatePathString);
    }
  });
}

function serializeNode(node: ZyCmdPathNode): string {
  if (typeof node == "string") {
    return node;
  } else {
    return `${node.groupId};${node.name}`;
  }
}

export function serializePath(path: ZyCmdPath): ZyCmdSerialPath {
  return path.map(serializeNode).join(":");
}

export type ZyCmdSerialPath = string;

/* Arguments */
export type ZyCmdArgs<A = any> = A;

type ZyCall<R = any, A = any> = (
  zym: Zym,
  args: ZyCmdArgs<A>
) => Promise<R> | R;
type ZyArgValidator = (args: ZyCmdArgs) => boolean;

/* Cmd handlers */
export interface ZyCmdHandler<T = any> {
  call: ZyCall<T>;
  validator?: ZyArgValidator;
}

export function call<T>(handler: ZyCmdHandler<T>, zym: Zym, args: ZyCmdArgs) {
  if (handler.validator && !handler.validator(args)) {
    throw new Error("Invalid ZyCommand Args");
  }

  return handler.call(zym, args);
}

export function justCaller<T>(call: ZyCall<T>): ZyCmdHandler<T> {
  return {
    call,
  };
}

/* Traits */
export interface ZyCommandGroupMember {
  path: ZyCmdPath;
  validator?: ZyArgValidator;
}

export type ZyCmdPointer = ZyCommandGroupMember | ZyCmdPath;

function isGroupMember(p: ZyCmdPointer): p is ZyCommandGroupMember {
  return Object.hasOwn(p, "path");
}

export function pointerToPath(pointer: ZyCmdPointer): ZyCmdPath {
  if (isGroupMember(pointer)) {
    return pointer.path;
  } else {
    return pointer;
  }
}

export function justPath(path: ZyCmdPath): ZyCommandGroupMember {
  return {
    path,
  };
}

export type ZyCommandGroupType = {
  [key: string]: {
    args: any;
    return: any;
  };
};

export type ZyCommandGroup<T extends ZyCommandGroupType = any> = {
  [key in keyof T]: ZyCommandGroupMember;
};

export function implementPartialCmdGroup<T extends ZyCommandGroupType = any>(
  group: ZyCommandGroup<T>,
  calls: Partial<{ [key in keyof T]: ZyCall<T[key]["return"], T[key]["args"]> }>
) {
  const registrations: ZyCommandRegistration[] = [];

  const keys = Object.keys(group) as (keyof T)[];

  for (const memberKey of keys) {
    const { path, validator } = group[memberKey];
    const call = calls[memberKey];

    if (call) {
      registrations.push({
        path,
        handler: {
          call,
          validator,
        },
      });
    }
  }

  return registrations;
}

export function implementTotalCmdGroup<T extends ZyCommandGroupType = any>(
  group: ZyCommandGroup<T>,
  calls: { [key in keyof T]: ZyCall<T[key]["return"], T[key]["args"]> }
) {
  return implementPartialCmdGroup(group, calls);
}

export function memberToRegistration<T>(
  member: ZyCommandGroupMember,
  call: ZyCall<T>
): ZyCommandRegistration<T> {
  const { path, validator } = member;

  return {
    path,
    handler: {
      call,
      validator,
    },
  };
}

export interface ZyCommandGroupRegistration {
  [key: string]: ZyCommandRegistration<any>;
}

export function toGroup(gReg: ZyCommandGroupRegistration): ZyCommandGroup {
  const cg: ZyCommandGroup = {};

  for (const [k, v] of Object.entries(gReg)) {
    const { path } = v;
    cg[k] = { path, validator: v.handler.validator };
  }

  return cg;
}

/* Registration */
export interface ZyCommandRegistration<T = any> {
  handler: ZyCmdHandler<T>;
  path: ZyCmdPath;
}

/* RESULTS 
This is different from Rust results.  Rust results are used for 
error handling.  Here, if `ok = false`, it means that a methods hasn't been 
implemented for a particular zym
*/
interface PositiveZyResult<T> {
  ok: true;
  val: T;
}

export function ok<T>(val: T): PositiveZyResult<T> {
  return {
    val,
    ok: true,
  };
}

interface NegativeZyResult {
  ok: false;
}

export type ZyResult<T> = PositiveZyResult<T> | NegativeZyResult;

export function unwrap<T>(result: ZyResult<T>): T {
  if (result.ok) {
    return result.val;
  } else {
    throw new Error("Command not implemented!");
  }
}

export const UNIMPLEMENTED: NegativeZyResult = { ok: false };

/* OPTIONS */
interface Some<T> {
  some: true;
  val: T;
}

export function some<T>(val: T): Some<T> {
  return {
    some: true,
    val,
  };
}

interface None {
  some: false;
}

export const NONE: None = { some: false };

export type ZyOption<T> = Some<T> | None;

export function isSome<T>(opt: ZyOption<T>): opt is Some<T> {
  return opt.some;
}

export function unwrapOption<T>(opt: ZyOption<T>): T {
  if (isSome(opt)) {
    return opt.val;
  } else {
    console.trace("op not some");
    throw new Error("Option was not some!");
  }
}
