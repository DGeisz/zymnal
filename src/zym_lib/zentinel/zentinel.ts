import { ControlledAwaiter } from "../../global_utils/promise_utils";
import { Hermes, HermesMessage, ZentinelMessage } from "../hermes/hermes";
import { UNIMPLEMENTED, ZyResult } from "../zy_commands/zy_command_types";
import { ZyId } from "../zy_types/basic_types";

/**
 * A Zentinel is something that handles messages passed
 * through Hermes
 */
export abstract class Zentinel {
  abstract readonly zyId: ZyId;
  private hermes?: Hermes;
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

  /* ==== NEEDS TO BE OVERRIDDEN ==== */
  /* Only has default impl for basic zy masters that don't function as zentinels */
  handleMessage = async (msg: ZentinelMessage): Promise<ZyResult<any>> => {
    return UNIMPLEMENTED;
  };
}
