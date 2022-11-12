import { FC } from "react";
import { isSome } from "../../../zym_lib/utils/zy_option";
import { safeHydrate } from "../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../zym_lib/zym/zym";
import { Zyact } from "../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import { ZyGodMethod } from "../../../zym_lib/zy_god/zy_god_schema";
import { ZyPartialPersist } from "../../../zym_lib/zy_schema/zy_schema";
import { ZyFile } from "../../zentinels/file_server_client/file_server_client_schema";
import {
  FileHandlerMethodSchema,
  FileHandlerSchema,
  FILE_HANDLER_ID,
} from "./file_handler_schema";

class FileHandlerMaster extends ZyMaster<
  FileHandlerSchema,
  FileHandlerMethodSchema
> {
  zyId: string = FILE_HANDLER_ID;

  constructor() {
    super();

    this.setMethodImplementation({
      focusFileHandler: async (cursor) => {
        const fileHandlerOption = await this.callZentinelMethod(
          ZyGodMethod.getZymAtCursor,
          cursor
        );

        if (isSome(fileHandlerOption)) {
          const fileHandler = fileHandlerOption.val as FileHandler;

          // TODO: Create a method to focus on the pane
        } else {
          console.error("Bad cursor provided to file handler");
        }
      },
    });
  }

  newBlankChild(): Zym<FileHandlerSchema, any, any, {}, {}> {
    throw new Error("Method not implemented.");
  }
}

export const fileHandlerMaster = new FileHandlerMaster();

export class FileHandler extends Zyact<FileHandlerSchema> {
  zyMaster = fileHandlerMaster;
  children = [];
  private zyFile: ZyFile;

  constructor(file: ZyFile, cursorIndex: number, parent: Zym | undefined) {
    super(cursorIndex, parent);

    this.zyFile = file;

    /* 
    Dispatch the file handler immediately
    */
  }

  fetchFile = async () => {};

  component: FC<{}> = () => {
    return <div>Hello</div>;
  };

  persistData() {
    return {
      zyFile: { ...this.zyFile },
    };
  }

  async hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<FileHandlerSchema>>
  ): Promise<void> {
    await safeHydrate(p, {
      zyFile: async (f) => {
        this.zyFile = f;
      },
    });
  }

  getZyFile = (): ZyFile => {
    return this.zyFile;
  };

  getRefreshedChildrenPointer(): Zym[] {
    return [];
  }
}
