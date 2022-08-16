import {
  CreatePersistenceSchema,
  CreateZySchema,
  IdentifiedSchema,
  ZymPersist,
} from "../../../../../zym_lib/zy_schema/zy_schema";
import type { Zymbol } from "../../zymbol";
import type { SuperSubZymbol } from "./super_sub";

export const SUPER_SUB_ID = "super-sub";

export enum SuperSubStatus {
  Neither,
  OnlySub,
  OnlySuper,
  Both,
}

export enum SuperSubPosition {
  None,
  Super,
  Sub,
}

export enum SuperSubBothIndex {
  Super = 0,
  Sub = 1,
}

export type SuperSubSchema = CreateZySchema<{
  children: IdentifiedSchema<any>[];
  status: SuperSubStatus;
  standalone: boolean;
}>;

export type SuperSubPersistedSchema = CreatePersistenceSchema<
  SuperSubSchema,
  {
    children: {
      persistenceSymbol: "c";
      persistenceType: ZymPersist<any, any>[];
    };
    status: "s";
    standalone: "a";
  }
>;

export function isSuperSub(zymbol: Zymbol): zymbol is SuperSubZymbol {
  return zymbol.getMasterId() === SUPER_SUB_ID;
}
