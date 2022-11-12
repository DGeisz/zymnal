import { FC } from "react";
import { Zym } from "../../../zym_lib/zym/zym";
import { Zyact } from "../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import { ZyPartialPersist } from "../../../zym_lib/zy_schema/zy_schema";
import { ZyFile } from "../../zentinels/file_server_client/file_server_client_schema";
import {
  FileEditorMethodSchema,
  FileEditorSchema,
  FILE_EDITOR_ID,
} from "./file_editor_schema";
import { FileHandler } from "./file_handler";

const EMPTY_FILE: ZyFile = { name: "" };

class FileEditorMaster extends ZyMaster<
  FileEditorSchema,
  FileEditorMethodSchema
> {
  zyId = FILE_EDITOR_ID;
  fileHandlerRegistry: Map<string, FileHandler> = new Map();

  constructor() {
    super();
    this.setMethodImplementation({
      registerFileHandler: async ({ extension, fileHandler }) => {
        this.fileHandlerRegistry.set(extension, fileHandler);
      },
    });
  }

  newBlankChild() {
    return new FileEditor(EMPTY_FILE, 0, undefined);
  }
}

export const fileEditorMaster = new FileEditorMaster();

export class FileEditor extends Zyact<FileEditorSchema> {
  zyMaster = fileEditorMaster;
  children = [];
  file: ZyFile;

  constructor(file: ZyFile, cursorIndex: number, parent: Zym | undefined) {
    super(cursorIndex, parent);
    this.file = file;
  }

  component: FC<{}> = () => <div>I'm a file editor!</div>;

  persistData(): ZyPartialPersist<FileEditorSchema> {
    throw new Error("Method not implemented.");
  }

  hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<FileEditorSchema>>
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  zyFile = (): ZyFile => {
    return this.file;
  };

  getRefreshedChildrenPointer(): Zym[] {
    return [];
  }
}
