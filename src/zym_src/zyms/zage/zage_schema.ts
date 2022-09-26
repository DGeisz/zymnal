import {
  createZentinelMethodList,
  CreateZentinelMethodSchema,
} from "../../../zym_lib/hermes/hermes";
import {
  CreateZySchema,
  IdentifiedBaseSchema,
  ZymPersist,
} from "../../../zym_lib/zy_schema/zy_schema";
import { PaneManagerSchema } from "../../editor_infrastructure/pane_manager/pane_manager_schema";
import { SidebarSchema } from "../../editor_infrastructure/sidebar/sidebar_schema";
import { ZyFile } from "../../zentinels/file_server_client/file_server_client_schema";

export const ZAGE_ID = "zage";

export type ZageZentinelMethodSchema = CreateZentinelMethodSchema<{
  openFile: {
    args: ZyFile;
    return: void;
  };
}>;

export const ZageMethod = createZentinelMethodList<ZageZentinelMethodSchema>(
  ZAGE_ID,
  {
    openFile: 0,
  }
);

export type ZageSchema = CreateZySchema<
  {
    sideBar: IdentifiedBaseSchema<SidebarSchema>;
    rootPaneManager: IdentifiedBaseSchema<PaneManagerSchema>;
  },
  {
    sideBar: {
      persistenceSymbol: "s";
      persistenceType: ZymPersist<SidebarSchema>;
    };
    rootPaneManager: {
      persistenceSymbol: "p";
      persistenceType: ZymPersist<PaneManagerSchema>;
    };
  }
>;

// export type ZageSchema = CreateZySchema<
//   {
//     module: IdentifiedBaseSchema<ZymbolModuleSchema>;
//   },
//   {
//     module: {
//       persistenceSymbol: "m";
//       persistenceType: ZymPersist<ZymbolModuleSchema>;
//     };
//   }
// >;
