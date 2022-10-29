import { useEffect } from "react";
import { hydrateChild, safeHydrate } from "../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../zym_lib/zym/zym";
import { useZymponent } from "../../../zym_lib/zym/zymplementations/zyact/hooks";
import { Zyact } from "../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import { CursorIndex } from "../../../zym_lib/zy_god/cursor/cursor";
import { ZageSchema, ZAGE_ID } from "./zage_schema";
import { ZyPartialPersist } from "../../../zym_lib/zy_schema/zy_schema";
import { EditorSidebar } from "../../editor_infrastructure/sidebar/sidebar";
import { PaneManager } from "../../editor_infrastructure/pane_manager/pane_manager";
import { SidebarSchema } from "../../editor_infrastructure/sidebar/sidebar_schema";
import { Allotment } from "allotment";
import { DarkModeReactive } from "./building_blocks/dark_mode/dark_mode_var";
import { useReactiveVariable } from "../../../zym_lib/utils/reactive_variables";
import clsx from "clsx";
import { ZyFile } from "../../zentinels/file_server_client/file_server_client_schema";
import { ZymbolModule } from "../zymbol_infrastructure/zymbol_module/zymbol_module";
import { ZymbolModuleSchema } from "../zymbol_infrastructure/zymbol_module/zymbol_module_schema";

/* ==== MASTER ====  */
class ZageMaster extends ZyMaster<ZageSchema> {
  zyId = ZAGE_ID;

  newBlankChild() {
    return new Zage(0);
  }
}

export const zageMaster = new ZageMaster();

// /* For the time being, a zage will just hold a central context */
// export class Zage extends Zyact<ZageSchema> {
//   zyMaster = zageMaster;

//   sideBar: EditorSidebar = new EditorSidebar(0, this);
//   rootPaneManager: PaneManager = new PaneManager(1, this);
//   children = [this.sideBar, this.rootPaneManager];

//   constructor(cursorIndex: CursorIndex, parent?: Zym<any, any, any>) {
//     super(cursorIndex, parent);

//     this.setPersistenceSchemaSymbols({
//       sideBar: "s",
//       rootPaneManager: "p",
//     });
//   }

//   component = () => {
//     const Sidebar = useZymponent(this.sideBar);
//     const RootPaneManager = useZymponent(this.rootPaneManager);
//     const [darkMode] = useReactiveVariable(DarkModeReactive);

//     return (
//       <div className={clsx("w-full h-full", darkMode && "dark")}>
//         <div className={clsx("w-full h-full", "dark:bg-stone-900")}>
//           <div className="w-full h-full">
//             <Allotment>
//               <Allotment.Pane preferredSize={320} minSize={80}>
//                 <Sidebar />
//               </Allotment.Pane>
//               <RootPaneManager />
//             </Allotment>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   persistData() {
//     return {
//       sideBar: this.sideBar.persist(),
//       rootPaneManager: this.rootPaneManager.persist(),
//     };
//   }

//   hydrateFromPartialPersist = async (
//     p: Partial<ZyPartialPersist<ZageSchema>>
//   ): Promise<void> => {
//     await safeHydrate(p, {
//       sideBar: async (s) => {
//         this.sideBar = (await hydrateChild<SidebarSchema>(
//           this,
//           s
//         )) as EditorSidebar;
//       },
//       rootPaneManager: async (r) => {
//         this.rootPaneManager = (await hydrateChild(this, r)) as PaneManager;
//       },
//     });
//     this.children = [this.sideBar, this.rootPaneManager];

//     this.reConnectParentChildren();
//   };
// }

/* ==== ZYM ====  */

/* For the time being, a zage will just hold a central context */
export class Zage extends Zyact<ZageSchema> {
  zyMaster = zageMaster;

  module: ZymbolModule = new ZymbolModule(0, this);
  children = [this.module];

  constructor(cursorIndex: CursorIndex, parent?: Zym<any, any, any>) {
    super(cursorIndex, parent);

    this.setPersistenceSchemaSymbols({
      module: "m",
    });
  }

  component = () => {
    const Module = useZymponent(this.module);

    return (
      <div className="w-full flex justify-center">
        <div className="w-full max-w-3xl mt-16">
          <Module />
        </div>
      </div>
    );
  };

  persistData() {
    return {
      module: this.module.persist(),
    };
  }

  hydrateFromPartialPersist = async (
    p: Partial<ZyPartialPersist<ZageSchema>>
  ) => {
    await safeHydrate(p, {
      module: async (m) => {
        this.module = (await hydrateChild<ZymbolModuleSchema>(
          this,
          m
        )) as ZymbolModule;
      },
    });
  };
}

export const BASE_ZAGE = new Zage(0);
