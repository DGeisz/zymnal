import { unwrapOption, unwrap } from "../../zy_commands/zy_command_types";
import { CreateZyGodMessage } from "../../zy_god/zy_god";
import { Zym, ZymPersist } from "../zym";

export async function hydrateChild(
  zym: Zym,
  childPersist: ZymPersist<any>
): Promise<Zym> {
  return unwrapOption(
    unwrap(await zym.callHermes(CreateZyGodMessage.hydrateZym(childPersist)))
  );
}
