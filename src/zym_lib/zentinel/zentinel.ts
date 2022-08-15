import { ControlledAwaiter } from "../../global_utils/promise_utils";
import {
  Hermes,
  ZentinelMethodImplementation,
  ZentinelMethodPointer,
  ZentinelMethodSchema,
} from "../hermes/hermes";
import { ZyId } from "../zy_types/basic_types";

/**
 * A Zentinel is something that handles messages passed
 * through Hermes
 */
export abstract class Zentinel<Schema extends ZentinelMethodSchema> {
  abstract readonly zyId: ZyId;
  private hermes?: Hermes;
  hermesSetAwaiter = new ControlledAwaiter();

  methodImplementation?: {
    [key in keyof Schema]: ZentinelMethodImplementation<Schema, key>;
  };

  setMethodImplementation(impl: {
    [key in keyof Schema]: ZentinelMethodImplementation<Schema, key>;
  }) {
    this.methodImplementation = impl;
  }

  handleMethod = <Method extends keyof Schema>(
    pointer: ZentinelMethodPointer<Schema, Method>,
    args: Schema[Method]["args"]
  ) => {
    return this.methodImplementation![pointer.method](args);
  };

  fixHermes = (hermes: Hermes) => {
    if (!this.hermes) {
      this.hermes = hermes;
      this.hermesSetAwaiter.trigger();
    }
  };

  callZentinelMethod = async <
    OtherSchema extends ZentinelMethodSchema,
    Method extends keyof OtherSchema
  >(
    pointer: ZentinelMethodPointer<OtherSchema, Method>,
    args: OtherSchema[Method]["args"]
  ): Promise<OtherSchema[Method]["return"]> => {
    await this.hermesSetAwaiter.awaitTrigger();

    return this.hermes!.handleZentinelMethod(pointer, args);
  };

  /* ==== EVENT LISTENERS ====  */
  onRegistration = async () => {};
}
