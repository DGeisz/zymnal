import { ZyMaster } from "../../zym_lib/zym/zy_master";
import { editorPaneMaster } from "./editor_pane/editor_pane";
import { fileEditorMaster } from "./file_editor/file_editor";
import { paneManagerMaster } from "./pane_manager/pane_manager";
import { sidebarMaster } from "./sidebar/sidebar";

export const editorInfrastructureMasters: ZyMaster[] = [
  sidebarMaster,
  editorPaneMaster,
  fileEditorMaster,
  paneManagerMaster,
];
