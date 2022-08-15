import { ZyGodMethod } from "../../zy_god/zy_god_schema";
import { unwrapOption } from "../../utils/zy_option";
import { Zym } from "../zym";
import {
  ZymPersist,
  ZyPersistenceSchema,
  ZySchema,
} from "../../zy_schema/zy_schema";

export async function hydrateChild<
  Schema extends ZySchema,
  PersistenceSchema extends ZyPersistenceSchema<Schema>
>(
  zym: Zym<any, any>,
  childPersist: ZymPersist<Schema, PersistenceSchema>
): Promise<Zym<Schema, PersistenceSchema>> {
  return unwrapOption(
    await zym.callZentinelMethod(ZyGodMethod.hydratePersistedZym, childPersist)
  );
}

export async function safeHydrate<T extends object>(
  p: Partial<T>,
  resolver: { [key in keyof T]: (t: T[key]) => Promise<void> | void }
) {
  for (let key in p) {
    await resolver[key](p[key]!);
  }
}
