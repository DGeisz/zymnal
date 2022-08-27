import { isVariableDeclaration } from "typescript";

export type BasicContext = Map<string, any>;

export function newContext(): BasicContext {
  return new Map();
}

interface ContextVariableGetterSetter<T> {
  get(ctx: BasicContext): T | undefined;
  set(ctx: BasicContext, t: T): void;
}

export function createContextVariable<T>(
  variableName: string
): ContextVariableGetterSetter<T> {
  return {
    get(ctx) {
      return ctx.get(variableName);
    },
    set(ctx, val: T) {
      ctx.set(variableName, val);
    },
  };
}
