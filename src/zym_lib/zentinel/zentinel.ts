import { ControlledAwaiter } from "../../global_utils/promise_utils";
import {
  Hermes,
  ZentinelFullMethodImplementation,
  ZentinelMethodPointer,
  ZentinelMethodSchema,
} from "../hermes/hermes";
import { ZyId } from "../zy_schema/zy_schema";

/**
 * A Zentinel is something that handles messages passed
 * through Hermes
 */
export abstract class Zentinel<Schema extends ZentinelMethodSchema = any> {
  abstract readonly zyId: ZyId;
  private hermes?: Hermes;
  hermesSetAwaiter = new ControlledAwaiter();

  methodImplementation?: ZentinelFullMethodImplementation<Schema>;

  setMethodImplementation(impl: ZentinelFullMethodImplementation<Schema>) {
    this.methodImplementation = impl;
  }

  handleMethod = <Method extends keyof Schema>(
    pointer: ZentinelMethodPointer<Schema, Method>,
    args: Schema[Method]["args"]
  ) => {
    if (!this.methodImplementation) {
      throw new Error(
        `Methods not implemented in ${this.zyId}!  Make sure to invoke setMethodImplementation in the constructor!`
      );
    }

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

  // alias for callZentinelMethod
  callZ = this.callZentinelMethod;

  /* ==== EVENT LISTENERS ====  */
  onRegistration = async () => {};
}
