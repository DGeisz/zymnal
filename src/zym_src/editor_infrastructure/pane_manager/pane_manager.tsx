import { Zym } from "../../../zym_lib/zym/zym";
import { Zyact } from "../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import { ZyPartialPersist } from "../../../zym_lib/zy_schema/zy_schema";
import { PaneManagerSchema, PANE_MANAGER_ID } from "./pane_manager_schema";

export class PaneManagerMaster extends ZyMaster<PaneManagerSchema> {
  zyId: string = PANE_MANAGER_ID;

  newBlankChild(): Zym<PaneManagerSchema, any, any> {
    throw new Error("Method not implemented.");
  }
}

export const paneManagerMaster = new PaneManagerMaster();

export class PaneManager extends Zyact<PaneManagerSchema> {
  zyMaster = paneManagerMaster;
  children: Zym<any, any, any, any, any>[] = [];

  component: React.FC = () => <div>Pane Manager</div>;

  persistData(): ZyPartialPersist<PaneManagerSchema> {
    throw new Error("Method not implemented.");
  }

  hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<PaneManagerSchema>>
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
