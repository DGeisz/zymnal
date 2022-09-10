import { FC } from "react";
import { Zym } from "../../../zym_lib/zym/zym";
import { Zyact } from "../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import { ZyPartialPersist } from "../../../zym_lib/zy_schema/zy_schema";
import { SidebarSchema, SIDEBAR_ID } from "./sidebar_schema";

class SidebarMaster extends ZyMaster<SidebarSchema> {
  zyId = SIDEBAR_ID;
  newBlankChild(): Zym<SidebarSchema, any, any, {}, {}> {
    throw new Error("Method not implemented.");
  }
}

export const sidebarMaster = new SidebarMaster();

export class EditorSidebar extends Zyact<SidebarSchema> {
  zyMaster = sidebarMaster;
  children: Zym<any, any, any, any, any>[] = [];

  component: FC<{}> = () => <div>I'm a sidebar</div>;

  persistData(): ZyPartialPersist<SidebarSchema, {}, {}> {
    throw new Error("Method not implemented.");
  }
  hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<SidebarSchema, {}, {}>>
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
