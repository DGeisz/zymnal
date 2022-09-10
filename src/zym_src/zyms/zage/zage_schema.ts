import {
  CreateZySchema,
  IdentifiedBaseSchema,
  ZymPersist,
} from "../../../zym_lib/zy_schema/zy_schema";
import { PaneManagerSchema } from "../../editor_infrastructure/pane_manager/pane_manager_schema";
import { SidebarSchema } from "../../editor_infrastructure/sidebar/sidebar_schema";

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
