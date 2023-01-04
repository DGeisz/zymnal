import { ZyGodMethod } from "../../zy_god/zy_god_schema";
import { Zym } from "../zym";
import {
  ZyBaseSchema,
  ZymPersist,
  ZyPersistenceSchema,
  ZySchema,
} from "../../zy_schema/zy_schema";

export async function hydrateChild<
  Schema extends ZySchema<BSchema, PSchema>,
  BSchema extends ZyBaseSchema = Schema["base"],
  PSchema extends ZyPersistenceSchema<BSchema> = Schema["persistence"]
>(zym: Zym<any, any>, childPersist: ZymPersist<Schema>): Promise<Zym<Schema>> {
  return zym.callZentinelMethod(ZyGodMethod.hydratePersistedZym, childPersist);
}

export async function hydrateChildren<Z extends Zym = Zym>(
  zym: Zym,
  children: ZymPersist<any>[]
) {
  return (await Promise.all(
    children.map((c) => hydrateChild<any, any>(zym, c))
  )) as Z[];
}

export async function safeHydrate<T extends object>(
  p: Partial<T>,
  resolver: { [key in keyof T]: (t: T[key]) => Promise<void> | void }
) {
  for (let key in p) {
    await resolver[key](p[key]!);
  }
}
