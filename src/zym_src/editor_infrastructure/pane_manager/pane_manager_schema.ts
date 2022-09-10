import {
  CreateZySchema,
  IdentifiedBaseSchema,
  ZymPersist,
} from "../../../zym_lib/zy_schema/zy_schema";
import { EditorPaneSchema } from "../editor_pane/editor_pane_schema";

export const PANE_MANAGER_ID = "pane-manager";

export enum PaneManagerOrientation {
  Vertical = 0,
  Horizontal = 1,
}

export type PaneManagerChildSchema = PaneManagerSchema | EditorPaneSchema;

export type PaneManagerSchema = CreateZySchema<
  {
    children: IdentifiedBaseSchema<PaneManagerChildSchema>;
    orientation: PaneManagerOrientation;
  },
  {
    children: {
      persistenceSymbol: "c";
      persistenceType: ZymPersist<PaneManagerChildSchema>[];
    };
    orientation: "o";
  }
>;
