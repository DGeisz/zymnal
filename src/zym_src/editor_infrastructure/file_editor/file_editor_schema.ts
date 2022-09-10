import {
  CreateZySchema,
  IdentifiedBaseSchema,
  zyIdentifierFactory,
  ZymPersist,
} from "../../../zym_lib/zy_schema/zy_schema";

export const FILE_EDITOR_ID = "file-editor";

export type FilePath = string[];

export type FileEditorSchema = CreateZySchema<
  {
    filePath: FilePath;
    fileHandler: IdentifiedBaseSchema<any>;
  },
  {
    filePath: "f";
    fileHandler: {
      persistenceSymbol: "h";
      persistenceType: ZymPersist<any>;
    };
  }
>;

// const isFileEditor = zyIdentifierFactory<File
