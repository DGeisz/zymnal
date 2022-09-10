import { useEffect } from "react";
import { hydrateChild, safeHydrate } from "../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../zym_lib/zym/zym";
import { useZymponent } from "../../../zym_lib/zym/zymplementations/zyact/hooks";
import { Zyact } from "../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import { enable as enableDarkMode } from "darkreader";
import { CursorIndex } from "../../../zym_lib/zy_god/cursor/cursor";
import { ZageSchema } from "./zage_schema";
import { ZyPartialPersist } from "../../../zym_lib/zy_schema/zy_schema";
import { EditorSidebar } from "../../editor_infrastructure/sidebar/sidebar";
import { PaneManager } from "../../editor_infrastructure/pane_manager/pane_manager";
import { SidebarSchema } from "../../editor_infrastructure/sidebar/sidebar_schema";
import { Allotment } from "allotment";

const DARK_MODE = true;

/* ==== MASTER ====  */
class ZageMaster extends ZyMaster<ZageSchema> {
  zyId = "zage";

  newBlankChild() {
    return new Zage(0);
  }
}

export const zageMaster = new ZageMaster();

/* ==== ZYM ====  */

/* For the time being, a zage will just hold a central context */
export class Zage extends Zyact<ZageSchema> {
  zyMaster = zageMaster;

  sideBar: EditorSidebar = new EditorSidebar(0, this);
  rootPaneManager: PaneManager = new PaneManager(1, this);
  children = [this.sideBar, this.rootPaneManager];

  constructor(cursorIndex: CursorIndex, parent?: Zym<any, any, any>) {
    super(cursorIndex, parent);

    this.setPersistenceSchemaSymbols({
      sideBar: "s",
      rootPaneManager: "p",
    });
  }

  component = () => {
    const Sidebar = useZymponent(this.sideBar);
    const RootPaneManager = useZymponent(this.rootPaneManager);

    useEffect(() => {
      DARK_MODE &&
        enableDarkMode({
          brightness: 100,
          contrast: 100,
          sepia: 10,
        });
    }, []);

    return (
      <div className="w-full h-full">
        <Allotment>
          <Allotment.Pane preferredSize={350} minSize={80}>
            <Sidebar />
          </Allotment.Pane>
          <RootPaneManager />
        </Allotment>
      </div>
    );
  };

  persistData() {
    return {
      sideBar: this.sideBar.persist(),
      rootPaneManager: this.rootPaneManager.persist(),
    };
  }

  hydrateFromPartialPersist = async (
    p: Partial<ZyPartialPersist<ZageSchema>>
  ): Promise<void> => {
    await safeHydrate(p, {
      sideBar: async (s) => {
        this.sideBar = (await hydrateChild<SidebarSchema>(
          this,
          s
        )) as EditorSidebar;
      },
      rootPaneManager: async (r) => {
        this.sideBar = (await hydrateChild(this, r)) as PaneManager;
      },
    });
    this.children = [this.sideBar, this.rootPaneManager];

    this.reConnectParentChildren();
  };
}
