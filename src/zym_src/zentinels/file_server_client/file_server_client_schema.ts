import _ from "underscore";
import {
  createZentinelMethodList,
  CreateZentinelMethodSchema,
} from "../../../zym_lib/hermes/hermes";

export const FILE_SERVER_CLIENT = "file-server-client";

export interface ZyFile {
  name: string;
}

export function fileEquals(f1: ZyFile, f2: ZyFile): boolean {
  return _.isEqual(f2, f1);
}

export type FileServerClientSchema = CreateZentinelMethodSchema<{
  getDirectoryFiles: {
    args: undefined;
    return: ZyFile[];
  };
  getCurrentWorkingDirectory: {
    args: undefined;
    return: string;
  };
  createNewFile: {
    args: {
      name: string;
    };
    return: boolean;
  };
  getFile: {
    args: {
      file: ZyFile;
    };
    return: any;
  };
}>;

export const FileServerClientMethod =
  createZentinelMethodList<FileServerClientSchema>(FILE_SERVER_CLIENT, {
    getDirectoryFiles: 0,
    getCurrentWorkingDirectory: 0,
    createNewFile: 0,
    getFile: 0,
  });
