import React from "react";
import clsx from "clsx";
import { Zym } from "../../../zym_lib/zym/zym";
import { Zyact } from "../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import { Cursor } from "../../../zym_lib/zy_god/cursor/cursor";
import { ZyPartialPersist } from "../../../zym_lib/zy_schema/zy_schema";
import { ZyFile } from "../../zentinels/file_server_client/file_server_client_schema";
import { EditorPane } from "../editor_pane/editor_pane";
import { PaneManagerSchema, PANE_MANAGER_ID } from "./pane_manager_schema";
import katex from "katex";

const Z = katex.renderToString("\\mathbb{Z}");

export class PaneManagerMaster extends ZyMaster<PaneManagerSchema> {
  zyId: string = PANE_MANAGER_ID;

  newBlankChild(): Zym<PaneManagerSchema, any, any> {
    throw new Error("Method not implemented.");
  }
}

export const paneManagerMaster = new PaneManagerMaster();

type PaneManagerChild = PaneManager | EditorPane;

export class PaneManager extends Zyact<PaneManagerSchema> {
  zyMaster = paneManagerMaster;
  children: PaneManagerChild[] = [];

  component: React.FC = () => {
    return (
      <div
        className={clsx(
          "w-full h-full",
          "flex flex-col flex-1 justify-center items-center",
          "text-2xl font-semibold dark:text-neutral-400"
        )}
      >
        <div
          className={clsx("text-8xl")}
          dangerouslySetInnerHTML={{ __html: Z }}
        />
        Create or open a file to begin
      </div>
    );
  };

  persistData(): ZyPartialPersist<PaneManagerSchema> {
    throw new Error("Method not implemented.");
  }

  hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<PaneManagerSchema>>
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  checkForOpenFileHandler = (file: ZyFile): Cursor | undefined => {
    for (const child of this.children) {
      const cursor = child.checkForOpenFileHandler(file);

      if (cursor) return cursor;
    }
  };
}
