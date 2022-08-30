import { useEffect, useState } from "react";
import _ from "underscore";
import { VIMIUM_MODE_ID } from "../../zym_src/zyms/zymbol_infrastructure/zymbol_frame/building_blocks/vimium_mode/vimium_mode_zen_schema";
import { Zentinel } from "../zentinel/zentinel";
import { Zyact } from "../zym/zymplementations/zyact/zyact";
import { ZyId } from "../zy_schema/zy_schema";

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
  pointer: ZentinelMethodPointer<Schema, Method>;
  args: Schema[Method]["args"] extends undefined
    ? [undefined?]
    : [Schema[Method]["args"]];
  resolve: (d: Schema[Method]["return"]) => void;
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
          this.handleZentinelMethod(msg.pointer, msg.args).then(msg.resolve)
        );
      }

      Promise.all(promises).then(() => {
        this.pendingMessages.delete(zentinel.zyId);
      });
    }
  };

  handleZentinelMethod = async <
    Schema extends ZentinelMethodSchema,
    Method extends keyof Schema
  >(
    pointer: ZentinelMethodPointer<Schema, Method>,
    args: Schema[Method]["args"]
  ) => {
    const { zentinelId } = pointer;
    const zentinel = this.zentinelRegistry.get(zentinelId);

    if (zentinel) {
      return zentinel.handleMethod(pointer, args);
    } else {
      return new Promise<Schema[Method]["return"]>((resolve) => {
        const existingMessages = this.pendingMessages.get(zentinelId);

        const newMsg: PendingHermesMessage<Schema, Method> = {
          pointer,
          args,
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

export function useHermesValue<
  Schema extends ZentinelMethodSchema,
  Method extends keyof Schema,
  Return = Schema[Method]["return"]
>(
  zyact: Zyact<any, any>,
  pointer: ZentinelMethodPointer<Schema, Method>,
  args: Schema[Method]["args"],
  depArray?: any[]
): Return | undefined {
  const [value, setValue] = useState<Return>();

  const renderCount = zyact.getRenderCount();

  useEffect(() => {
    (async () => {
      setValue(await zyact.callZentinelMethod(pointer, args));
    })();
    // Put args in dep array if you want it to be a dependency
  }, [renderCount, ...(depArray ? depArray : [])]);

  return value;
}

type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N;
type IsAny<T> = IfAny<T, true, false>;

/* NEW ========================================================================================================= */
export type ZentinelMethodSchema = {
  [key: string]: {
    args: any;
    return: any;
  };
};

export type CreateZentinelMethodSchema<Schema extends ZentinelMethodSchema> =
  Schema;

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
  schema: { [key in keyof Schema]: 0 }
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
> = (args: Schema[Method]["args"]) => Promise<Schema[Method]["return"]>;

export type ZentinelFullMethodImplementation<
  Schema extends ZentinelMethodSchema
> = {
  [key in keyof Schema]: IsAny<Schema> extends true
    ? any
    : ZentinelMethodImplementation<Schema, key>;
};
