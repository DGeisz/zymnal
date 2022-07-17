import { ControlledAwaiter } from "../../global_utils/promise_utils";
import { Hermes, HermesMessage } from "../hermes/hermes";
import { ZyResult } from "../zy_commands/zy_command_types";
import { ZyId } from "../zy_types/basic_types";

/**
 * A Zentinel is something that handles messages passed
 * through Hermes
 */
export abstract class Zentinel {
  abstract readonly id: ZyId;
  hermes?: Hermes;
  hermesSetAwaiter = new ControlledAwaiter();

  fixHermes = (hermes: Hermes) => {
    if (!hermes) {
      this.hermes = hermes;
      this.hermesSetAwaiter.trigger();
    }
  };

  callHermes = async (msg: HermesMessage) => {
    await this.hermesSetAwaiter.awaitTrigger();

    return this.hermes!.handleMessage(msg);
  };

  abstract handleMessage(msg: HermesMessage): Promise<ZyResult<any>>;
}
