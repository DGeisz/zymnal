import { unwrapOption, unwrap } from "../../zy_trait/zy_command_types";
import { ZyGodMessage } from "../../zy_god/zy_god";
import { Zym, ZymPersist } from "../zym";

export async function hydrateChild(
  zym: Zym,
  childPersist: ZymPersist<any>
): Promise<Zym> {
  return unwrapOption(
    unwrap(await zym.callHermes(ZyGodMessage.hydrateZym(childPersist)))
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
