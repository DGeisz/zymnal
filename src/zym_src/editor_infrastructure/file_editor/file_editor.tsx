import { FC } from "react";
import { Zym } from "../../../zym_lib/zym/zym";
import { Zyact } from "../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import { ZyPartialPersist } from "../../../zym_lib/zy_schema/zy_schema";
import { FileEditorSchema, FILE_EDITOR_ID } from "./file_editor_schema";

class FileEditorMaster extends ZyMaster<FileEditorSchema> {
  zyId = FILE_EDITOR_ID;

  newBlankChild() {
    return new FileEditor(0, undefined);
  }
}

export const fileEditorMaster = new FileEditorMaster();

class FileEditor extends Zyact<FileEditorSchema> {
  zyMaster = fileEditorMaster;
  children: Zym<any, any, any, any, any>[] = [];

  component: FC<{}> = () => <div>I'm a file editor!</div>;

  persistData(): ZyPartialPersist<FileEditorSchema> {
    throw new Error("Method not implemented.");
  }
  hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<FileEditorSchema>>
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
