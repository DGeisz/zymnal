import { FC } from "react";
import { Zym } from "../../../zym_lib/zym/zym";
import { Zyact } from "../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import {
  IdentifiedBaseSchema,
  ZymPersist,
  ZyPartialPersist,
} from "../../../zym_lib/zy_schema/zy_schema";
import {
  PaneManagerOrientation,
  PaneManagerSchema,
  PANE_MANAGER_ID,
} from "./pane_manager_schema";

export class PaneManagerMaster extends ZyMaster<PaneManagerSchema> {
  zyId: string = PANE_MANAGER_ID;

  newBlankChild(): Zym<PaneManagerSchema, any, any> {
    throw new Error("Method not implemented.");
  }
}

export const paneManagerMaster = new PaneManagerMaster();

// export class PaneManager extends Zyact<PaneManagerSchema> {
//   component: FC<{}>;
//   children: Zym<any, any, any, any, any>[];
//   zyMaster: ZyMaster<PaneManagerSchema, {}, { children: IdentifiedBaseSchema<any, any, any>; orientation: PaneManagerOrientation; }, { ...; }>;
//   persistData(): ZyPartialPersist<PaneManagerSchema, { children: IdentifiedBaseSchema<any, any, any>; orientation: PaneManagerOrientation; }, { children: { persistenceSymbol: "c"; persistenceType: ZymPersist<any, any, any>[]; }; orientation: "o"; }> {
//     throw new Error("Method not implemented.");
//   }
//   hydrateFromPartialPersist(p: Partial<ZyPartialPersist<PaneManagerSchema, { children: IdentifiedBaseSchema<any, any, any>; orientation: PaneManagerOrientation; }, { children: { persistenceSymbol: "c"; persistenceType: ZymPersist<any, any, any>[]; }; orientation: "o"; }>>): Promise<void> {
//     throw new Error("Method not implemented.");
//   }
// }
