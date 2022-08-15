import { ZyGodMethod } from "../../zy_god/zy_god_schema";
import { unwrapOption } from "../../zy_trait/zy_command_types";
import { Zym, ZymPersist } from "../zym";

export async function hydrateChild(
  zym: Zym,
  childPersist: ZymPersist<any>
): Promise<Zym> {
  return unwrapOption(
    await zym.callZentinelMethod(ZyGodMethod.hydratePersistedZym, childPersist)
  );
}

export async function safeHydrate<T extends object>(
  p: Partial<T>,
  resolver: { [key in keyof T]: (t: T[key]) => Promise<void> | void }
) {
  for (let key in p) {
    await resolver[key](p[key]!);
  }
}
