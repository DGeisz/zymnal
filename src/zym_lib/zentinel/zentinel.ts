import { ControlledAwaiter } from "../../global_utils/promise_utils";
import {
  Hermes,
  HermesMessage,
  ZentinelMessage,
  ZentinelMethodImplementation,
  ZentinelMethodInstruction,
  ZentinelMethodList,
  ZentinelMethodPointer,
  ZentinelMethodSchema,
} from "../hermes/hermes";
import { UNIMPLEMENTED, ZyResult } from "../zy_trait/zy_command_types";
import { ZyId } from "../zy_types/basic_types";

/**
 * A Zentinel is something that handles messages passed
 * through Hermes
 */
export abstract class Zentinel<Schema extends ZentinelMethodSchema> {
  abstract readonly zyId: ZyId;
  private hermes?: Hermes;
  hermesSetAwaiter = new ControlledAwaiter();

  // methodList: ZentinelMethodList<Schema>;
  // private inverseMethodList: {[key: string]: keyof Schema};

  abstract methodImplementation: {
    [key in keyof Schema]: ZentinelMethodImplementation<Schema, key>;
  };

  // constructor(
  // methodList: ZentinelMethodList<Schema>
  // ) {
  //   this.inverseMethodList = {};

  //   for (const [key, value] of Object.entries(methodList)) {
  //     this.inverseMethodList[value.method] = key;
  //   }
  // }

  /* NEW ++++ */
  handleMethod = <Method extends keyof Schema>(
    pointer: ZentinelMethodPointer<Schema, Method>,
    ...args: Schema[Method]["args"] extends undefined
      ? [undefined?]
      : [Schema[Method]["args"]]
  ) => {
    return this.methodImplementation[pointer.method](...args);
  };

  fixHermes = (hermes: Hermes) => {
    if (!this.hermes) {
      this.hermes = hermes;
      this.hermesSetAwaiter.trigger();
    }
  };

  callHermes = async (msg: HermesMessage) => {
    await this.hermesSetAwaiter.awaitTrigger();

    return this.hermes!.handleMessage(msg);
  };

  callZentinelMethod = async <
    OtherSchema extends ZentinelMethodSchema,
    Method extends keyof OtherSchema
  >(
    pointer: ZentinelMethodPointer<OtherSchema, Method>,
    ...args: OtherSchema[Method]["args"] extends undefined
      ? [undefined?]
      : [OtherSchema[Method]["args"]]
  ) => {};

  /* ==== MESSAGE HANDLERS ==== */
  /* Only has default impl for basic zy masters that don't function as zentinels */
  handleMessage = async (msg: ZentinelMessage): Promise<ZyResult<any>> => {
    return UNIMPLEMENTED;
  };

  /* ==== EVENT LISTENERS ====  */
  onRegistration = async () => {};
}
