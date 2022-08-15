export type BasicContext = Map<string, any>;

export function newContext(): BasicContext {
  return new Map();
}
