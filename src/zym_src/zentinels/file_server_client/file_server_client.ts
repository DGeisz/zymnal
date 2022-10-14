import { Zentinel } from "../../../zym_lib/zentinel/zentinel";
import {
  FileServerClientSchema,
  FILE_SERVER_CLIENT,
} from "./file_server_client_schema";
import axios from "axios";
import { resourceLimits } from "worker_threads";

const SERVER_URL = "http://localhost:4200";

export function url(...args: string[]): string {
  return args.join("/");
}

class FileServerClient extends Zentinel<FileServerClientSchema> {
  zyId: string = FILE_SERVER_CLIENT;

  constructor() {
    super();

    this.setMethodImplementation({
      getDirectoryFiles: async () => {
        /* Make axios call to the express server */
        const result = await axios.get(url(SERVER_URL, "directory-files"));

        if (result.data) {
          return result.data.map((n: string) => ({
            name: n,
          }));
        } else {
          return [];
        }
      },
      getCurrentWorkingDirectory: async () => {
        const result = await axios.get(url(SERVER_URL, "cwd"));

        if (result.data) {
          return result.data;
        } else {
          return "";
        }
      },
      createNewFile: async ({ name }) => {
        const result = await axios.post(url(SERVER_URL, "new_file"), { name });

        if (result.data === "Created") {
          return true;
        } else {
          return false;
        }
      },
      getFile: async ({ file }) => {
        const res = await axios.post(url(SERVER_URL, "get_file"), {
          file,
        });

        if (res.data) {
          return res.data;
        } else {
          throw new Error(`Didn't find file: ${file.name}`);
        }
      },
    });
  }
}

export const fileServerClientZentinel = new FileServerClient();
