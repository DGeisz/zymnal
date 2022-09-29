import { CreateZentinelMethodSchema } from "../../../zym_lib/hermes/hermes";
import {
  CreateZySchema,
  IdentifiedBaseSchema,
  ZymPersist,
} from "../../../zym_lib/zy_schema/zy_schema";
import { ZyFile } from "../../zentinels/file_server_client/file_server_client_schema";
import { FileHandler } from "./file_handler";

export const FILE_EDITOR_ID = "file-editor";

export type FilePath = string[];

export type FileEditorMethodSchema = CreateZentinelMethodSchema<{
  registerFileHandler: {
    args: {
      extension: string;
      fileHandler: FileHandler;
    };
    return: void;
  };
}>;

export type FileEditorSchema = CreateZySchema<
  {
    file: ZyFile;
    fileHandler: IdentifiedBaseSchema<any>;
  },
  {
    file: "f";
    fileHandler: {
      persistenceSymbol: "h";
      persistenceType: ZymPersist<any>;
    };
  }
>;
