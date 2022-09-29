import {
  createZentinelMethodList,
  CreateZentinelMethodSchema,
} from "../../../zym_lib/hermes/hermes";
import { Cursor } from "../../../zym_lib/zy_god/cursor/cursor";
import { CreateZySchema } from "../../../zym_lib/zy_schema/zy_schema";
import { ZyFile } from "../../zentinels/file_server_client/file_server_client_schema";

export const EDITOR_PANE_ID = "editor-pane";

export type EditorPaneMethodSchema = CreateZentinelMethodSchema<{
  openFile: {
    args: { paneCursor: Cursor; file: ZyFile };
    return: void;
  };
}>;

export const EditorPaneMethod =
  createZentinelMethodList<EditorPaneMethodSchema>(EDITOR_PANE_ID, {
    openFile: 0,
  });

export type EditorPaneSchema = CreateZySchema<{}, {}>;
