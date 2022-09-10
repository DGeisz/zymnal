import {
  CreateZySchema,
  IdentifiedBaseSchema,
  ZymPersist,
} from "../../../zym_lib/zy_schema/zy_schema";

export const PANE_MANAGER_ID = "pane-manager";

export enum PaneManagerOrientation {
  Vertical = 0,
  Horizontal = 1,
}

// TODO: Add special indication for type of children
export type PaneManagerChildSchema = PaneManagerSchema | any;

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
