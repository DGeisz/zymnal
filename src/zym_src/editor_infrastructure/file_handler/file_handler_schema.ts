import {
  createZentinelMethodList,
  CreateZentinelMethodSchema,
} from "../../../zym_lib/hermes/hermes";
import { Cursor } from "../../../zym_lib/zy_god/cursor/cursor";
import { CreateZySchema } from "../../../zym_lib/zy_schema/zy_schema";
import { ZyFile } from "../../zentinels/file_server_client/file_server_client_schema";

export const FILE_HANDLER_ID = "file-handler";

export type FileHandlerMethodSchema = CreateZentinelMethodSchema<{
  focusFileHandler: {
    args: Cursor;
    return: void;
  };
}>;

export const FileHandlerMethod =
  createZentinelMethodList<FileHandlerMethodSchema>(FILE_HANDLER_ID, {
    focusFileHandler: 0,
  });

export type FileHandlerSchema = CreateZySchema<
  {
    zyFile: ZyFile;
  },
  {
    zyFile: "z";
  }
>;
