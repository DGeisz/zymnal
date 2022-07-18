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

interface PendingHermesMessage {
  msg: HermesMessage;
  resolve: (d: any) => void;
}

/**
 * Hermes is the message passing system between different
 * architectural elements (specifically zentinels)
 */
export class Hermes {
  zentinelRegistry: Map<ZyId, Zentinel> = new Map();
  /* These are messages sent to a zentinel that hasn't yet been initialized */
  pendingMessages: Map<ZyId, PendingHermesMessage[]> = new Map();

  registerZentinel = (zentinel: Zentinel) => {
    this.zentinelRegistry.set(zentinel.zyId, zentinel);
    zentinel.fixHermes(this);

    zentinel.onRegistration();

    /* Get rid of any pending messages */
    const pendingMessages = this.pendingMessages.get(zentinel.zyId);

    if (pendingMessages) {
      const promises = [];

      for (const msg of pendingMessages) {
        promises.push(this.handleMessage(msg.msg).then(msg.resolve));
      }

      Promise.all(promises).then(() => {
        this.pendingMessages.delete(zentinel.zyId);
      });
    }
  };

  handleMessage = async (msg: HermesMessage): Promise<ZyResult<any>> => {
    const { zentinelId, content, message } = msg;

    const zentinel = this.zentinelRegistry.get(zentinelId);

    if (zentinel) {
      return zentinel.handleMessage({ content, message });
    } else {
      return new Promise((resolve) => {
        const existingMessages = this.pendingMessages.get(zentinelId);

        const newMsg: PendingHermesMessage = {
          msg,
          resolve,
        };

        if (existingMessages) {
          this.pendingMessages.set(zentinelId, [...existingMessages, newMsg]);
        } else {
          this.pendingMessages.set(zentinelId, [newMsg]);
        }
      });
    }
  };
}
