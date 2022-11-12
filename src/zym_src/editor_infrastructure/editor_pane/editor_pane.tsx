import { FC } from "react";
import { unwrapOption, ZyOption } from "../../../zym_lib/utils/zy_option";
import { Zym } from "../../../zym_lib/zym/zym";
import { Zyact } from "../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import { Cursor } from "../../../zym_lib/zy_god/cursor/cursor";
import { ZyGodMethod } from "../../../zym_lib/zy_god/zy_god_schema";
import { ZyPartialPersist } from "../../../zym_lib/zy_schema/zy_schema";
import {
  fileEquals,
  ZyFile,
} from "../../zentinels/file_server_client/file_server_client_schema";
import { FileEditor } from "../file_editor/file_editor";
import { FileHandler } from "../file_handler/file_handler";
import {
  EditorPaneMethodSchema,
  EditorPaneSchema,
  EDITOR_PANE_ID,
} from "./editor_pane_schema";

class EditorPaneMaster extends ZyMaster<
  EditorPaneSchema,
  EditorPaneMethodSchema
> {
  zyId = EDITOR_PANE_ID;

  constructor() {
    super();
    this.setMethodImplementation({
      openFile: async ({ paneCursor, file }) => {
        const editorPaneOption = (await this.callZentinelMethod(
          ZyGodMethod.getZymAtCursor,
          paneCursor
        )) as ZyOption<EditorPane>;

        if (editorPaneOption.some) {
          const editorPane = editorPaneOption.val;

          editorPane.openOrCreateFileHandler(file);
        }
      },
    });
  }

  newBlankChild() {
    return new EditorPane(0, undefined);
  }
}

export const editorPaneMaster = new EditorPaneMaster();

export class EditorPane extends Zyact<EditorPaneSchema> {
  getRefreshedChildrenPointer(): Zym[] {
    return [];
  }

  children: FileHandler[] = [];
  zyMaster: ZyMaster<EditorPaneSchema, {}, {}, {}> = editorPaneMaster;

  openOrCreateFileHandler = (file: ZyFile) => {
    const handler = this.children.find((fHandler) =>
      fileEquals(fHandler.getZyFile(), file)
    );

    if (handler) {
    } else {
      const newHandler = new FileHandler(file, 0, this);
      this.children.unshift(newHandler);
    }
  };

  component: FC = () => {
    return <div>I'm a pane!</div>;
  };

  persistData(): ZyPartialPersist<EditorPaneSchema> {
    throw new Error("Method not implemented.");
  }

  hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<EditorPaneSchema>>
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  checkForOpenFileHandler = (file: ZyFile): Cursor | undefined => {
    if (this.children.some((editor) => fileEquals(editor.getZyFile(), file))) {
      return this.getFullCursorPointer();
    }
  };
}
