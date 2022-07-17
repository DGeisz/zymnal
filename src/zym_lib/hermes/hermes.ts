import { Zentinel } from "../zentinel/zentinel";
import { UNIMPLEMENTED, ZyResult } from "../zy_commands/zy_command_types";
import { ZyId } from "../zy_types/basic_types";

export interface ZentinelMessage<T = any> {
  message: string | number;
  content: T;
}

export interface HermesMessage<T = any> extends ZentinelMessage<T> {
  zentinelId: ZyId;
}

/**
 * Hermes is the message passing system between different
 * architectural elements (specifically zentinels)
 */
export class Hermes {
  registerZentinel = (zentinel: Zentinel) => {
    /* TODO: Impl */
  };

  handleMessage = async (msg: HermesMessage): Promise<ZyResult<any>> => {
    /* TODO: IMPL */
    return UNIMPLEMENTED;
  };
}
