import { Zym } from "../zym/zym";
import { ZyId } from "../zy_types/basic_types";

/* PATH */
export type ZyGroupCmdPathNode = {
  groupId: ZyId;
  name: string;
};

export type ZyCmdPathNode = string | ZyGroupCmdPathNode;
export type ZyCmdPath = ZyCmdPathNode[];

function validatePathString(str: string): boolean {
  return str.includes(":") || str.includes(";");
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
export type ZyCmdArgs = any;

type ZyCall<T> = (zym: Zym, args: ZyCmdArgs) => T;
type ZyArgValidator = (args: ZyCmdArgs) => boolean;

/* Cmd handlers */
export interface ZyCmdHandler<T> {
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

export function justPath(path: ZyCmdPath): ZyCommandGroupMember {
  return {
    path,
  };
}

export type ZyCommandGroup = { [key: string]: ZyCommandGroupMember };

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
export interface ZyCommandRegistration<T> {
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
