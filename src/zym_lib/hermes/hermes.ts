import { Zentinel } from "../zentinel/zentinel";
import { UNIMPLEMENTED, ZyResult } from "../zy_commands/zy_command_types";
import { ZyId } from "../zy_types/basic_types";

export interface ZentinelMessage<T = any> {
  message: string | number;
  content?: T;
}

export interface HermesMessage<T = any> extends ZentinelMessage<T> {
  zentinelId: ZyId;
}

export interface HermesMessageCreator {
  [key: string]: (data: any) => HermesMessage;
}

/**
 * Hermes is the message passing system between different
 * architectural elements (specifically zentinels)
 */
export class Hermes {
  zentinelRegistry: Map<ZyId, Zentinel> = new Map();

  registerZentinel = (zentinel: Zentinel) => {
    this.zentinelRegistry.set(zentinel.zyId, zentinel);
  };

  handleMessage = async (msg: HermesMessage): Promise<ZyResult<any>> => {
    const { zentinelId, content, message } = msg;

    const zentinel = this.zentinelRegistry.get(zentinelId);

    if (zentinel) {
      return zentinel.handleMessage({ content, message });
    } else {
      return UNIMPLEMENTED;
    }
  };
}
