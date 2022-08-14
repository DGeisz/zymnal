import { MenuHTMLAttributes, useEffect, useState } from "react";
import { Zentinel } from "../zentinel/zentinel";
import { Zym } from "../zym/zym";
import { Zyact } from "../zym/zymplementations/zyact/zyact";
import { unwrap, ZyResult } from "../zy_trait/zy_command_types";
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

interface PendingHermesMessage<
  Schema extends ZentinelMethodSchema,
  Method extends keyof Schema
> {
  msg: HermesZentinelMethodMessage<any, any>;
  pointer: ZentinelMethodPointer<Schema, Method>;
  args: Schema[Method]["args"] extends undefined
    ? [undefined?]
    : [Schema[Method]["args"]];
  resolve: (d: any) => void;
}

/**
 * Hermes is the message passing system between different
 * architectural elements (specifically zentinels)
 */
export class Hermes {
  zentinelRegistry: Map<ZyId, Zentinel<any>> = new Map();
  /* These are messages sent to a zentinel that hasn't yet been initialized */
  pendingMessages: Map<ZyId, PendingHermesMessage<any, any>[]> = new Map();

  registerZentinel = (zentinel: Zentinel<any>) => {
    this.zentinelRegistry.set(zentinel.zyId, zentinel);
    zentinel.fixHermes(this);

    zentinel.onRegistration();

    /* Get rid of any pending messages */
    const pendingMessages = this.pendingMessages.get(zentinel.zyId);

    if (pendingMessages) {
      const promises = [];

      for (const msg of pendingMessages) {
        promises.push(
          this.handleZentinelInstruction(msg.msg).then(msg.resolve)
        );
      }

      Promise.all(promises).then(() => {
        this.pendingMessages.delete(zentinel.zyId);
      });
    }
  };

  handleZentinelInstruction = async <
    Schema extends ZentinelMethodSchema,
    Method extends keyof Schema
  >(
    msg: HermesZentinelMethodMessage<Schema, Method>
  ): Promise<ZyResult<any>> => {
    const { zentinelId, method, args } = msg;

    const zentinel = this.zentinelRegistry.get(zentinelId);

    if (zentinel) {
      return zentinel.handleMethodInstruction({ method, args });
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

  handleZentinelMethod = async <
    Schema extends ZentinelMethodSchema,
    Method extends keyof Schema
  >(
    pointer: ZentinelMethodPointer<Schema, Method>,
    ...args: Schema[Method]["args"] extends undefined
      ? [undefined?]
      : [Schema[Method]["args"]]
  ) => {
    const { zentinelId } = pointer;

    const zentinel = this.zentinelRegistry.get(zentinelId);

    if (zentinel) {
      return zentinel.handleMethod(pointer, args);
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

export function useHermesValue<T, G extends boolean>(
  zyact: Zyact,
  message: HermesMessage<T>,
  unwrapValue: G,
  depArray?: any[]
): (typeof unwrapValue extends true ? T : ZyResult<T>) | undefined {
  type superType = typeof unwrapValue extends true ? T : ZyResult<T>;

  const [value, setValue] = useState<superType>();

  const renderCount = zyact.getRenderCount();

  useEffect(() => {
    (async () => {
      if (unwrapValue) {
        setValue(unwrap(await zyact.callHermes(message)) as superType);
      } else {
        setValue((await zyact.callHermes(message)) as superType);
      }
    })();
  }, [renderCount, ...(depArray ? depArray : [])]);

  return value;
}

/* NEW ========================================================================================================= */
export type ZentinelMethodSchema = {
  [key: string]: {
    args: any;
    return: any;
  };
};

export type ZentinelMethodPointer<
  Schema extends ZentinelMethodSchema,
  Method extends keyof Schema
> = {
  method: Method;
  zentinelId: ZyId;
};

export type ZentinelMethodList<Schema extends ZentinelMethodSchema> = {
  [key in keyof Schema]: ZentinelMethodPointer<Schema, key>;
};

export function createZentinelMethodList<Schema extends ZentinelMethodSchema>(
  zentinelId: ZyId,
  schema: { [key in keyof Schema]: true }
): ZentinelMethodList<Schema> {
  const trait: Partial<ZentinelMethodList<Schema>> = {};

  for (const key in schema) {
    trait[key] = {
      zentinelId,
      method: key,
    };
  }

  return trait as ZentinelMethodList<Schema>;
}

export type ZentinelMethodImplementation<
  Schema extends ZentinelMethodSchema,
  Method extends keyof Schema
> = (
  ...args: Schema[Method]["args"] extends undefined
    ? [undefined?]
    : [Schema[Method]["args"]]
) => Promise<Schema[Method]["return"]>;

export type ZentinelMethodInstruction<
  Schema extends ZentinelMethodSchema,
  Method extends keyof Schema
> = {
  method: Method;
  args: Schema[Method]["args"] extends undefined
    ? [undefined?]
    : [Schema[Method]["args"]];
};

export interface HermesZentinelMethodMessage<
  Schema extends ZentinelMethodSchema,
  Method extends keyof Schema
> extends ZentinelMethodInstruction<Schema, Method> {
  zentinelId: ZyId;
}

interface a extends ZentinelMethodSchema {
  a: {
    args: number;
    return: string;
  };
}
