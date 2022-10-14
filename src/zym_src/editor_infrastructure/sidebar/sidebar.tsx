import clsx from "clsx";
import { FC, useEffect, useState } from "react";
import { Zym } from "../../../zym_lib/zym/zym";
import { Zyact } from "../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import { KeyEventHandlerMethod } from "../../../zym_lib/zy_god/zentinels/key_event_handler/key_event_handler_schema";
import { ZyGodMethod } from "../../../zym_lib/zy_god/zy_god_schema";
import { ZyPartialPersist } from "../../../zym_lib/zy_schema/zy_schema";
import {
  FileServerClientMethod,
  ZyFile,
} from "../../zentinels/file_server_client/file_server_client_schema";
// import { ZageMethod } from "../../zyms/zage/zage_schema";
import FileNameDisplay from "./building_blocks/file_name_display";
import NewFileInput from "./building_blocks/new_file_input";
import { SidebarSchema, SIDEBAR_ID } from "./sidebar_schema";
import { BsFileEarmarkPlus } from "react-icons/bs";

const dummyFiles: ZyFile[] = [
  { name: "hi there" },
  { name: "hi there" },
  { name: "hi there" },
];

function fileTypeTest(fileName: string): boolean {
  return /\.bzym$/.test(fileName);
}

class SidebarMaster extends ZyMaster<SidebarSchema> {
  zyId = SIDEBAR_ID;
  newBlankChild(): Zym<SidebarSchema, any, any, {}, {}> {
    throw new Error("Method not implemented.");
  }
}

export const sidebarMaster = new SidebarMaster();

export class EditorSidebar extends Zyact<SidebarSchema> {
  zyMaster = sidebarMaster;
  children: Zym<any, any, any, any, any>[] = [];

  takeCursor = () => {
    this.callZentinelMethod(
      ZyGodMethod.takeCursor,
      this.getFullCursorPointer()
    );
  };

  component: FC<{}> = () => {
    const [files, setFiles] = useState<ZyFile[]>([]);
    const [cwd, setCwd] = useState<string>("");

    const [newFile, setNewFile] = useState<boolean>(false);
    const [newFileError, setNewFileError] = useState<string>("");

    useEffect(() => {
      if (newFile) {
        this.callZentinelMethod(
          KeyEventHandlerMethod.suppressKeyHandling,
          undefined
        );
      } else {
        this.callZentinelMethod(
          KeyEventHandlerMethod.allowKeyHandling,
          undefined
        );
      }
    }, [newFile]);

    useEffect(() => {
      const getFiles = async () => {
        const newFiles = await this.callZentinelMethod(
          FileServerClientMethod.getDirectoryFiles,
          undefined
        );

        setFiles(newFiles);
      };

      const getCwd = async () => {
        const newCwd = await this.callZentinelMethod(
          FileServerClientMethod.getCurrentWorkingDirectory,
          undefined
        );

        setCwd(newCwd);
      };

      const getAll = () => {
        getFiles();
        getCwd();
      };

      getAll();

      const interval = setInterval(getAll, 1000);

      return () => {
        clearInterval(interval);
      };
    }, []);

    /* Only get zym files */
    const finalFiles = files.filter((f) => fileTypeTest(f.name));
    const showFiles = finalFiles.length > 0 || newFile;

    const onSubmitFile = (fileName: string) => {
      if (!fileName.includes(".")) {
        fileName += ".bzym";
      }

      if (!fileTypeTest(fileName)) {
        return setNewFileError("Only *.bzym files allowed!");
      }

      if (finalFiles.map((f) => f.name).includes(fileName)) {
        return setNewFileError("File already exists!");
      }

      (async () => {
        /* First tell the file client to create the file */
        await this.callZentinelMethod(FileServerClientMethod.createNewFile, {
          name: fileName,
        });

        // /* Then tell the zage to open the file */
        // await this.callZentinelMethod(ZageMethod.openFile, { name: fileName });

        setNewFile(false);
      })();
    };

    const createNewFile = () => {
      this.takeCursor();
      setNewFile(true);
    };

    return (
      <div
        className={clsx("h-full w-auto", "dark:bg-neutral-800 bg-neutral-200")}
      >
        <div
          className={clsx(
            "flex flex-row",
            "dark:bg-neutral-600",
            "py-[2px] pl-[4px]",
            "shadow-sm shadow-black",
            "dark:text-neutral-300"
          )}
        >
          <div
            className={clsx(
              "text-sm font-bold",
              "dark:text-neutral-300",
              "flex items-center",
              "select-none",
              "cursor-default"
            )}
          >
            {cwd.toUpperCase()}
          </div>
          <div
            className={clsx(
              "flex flex-1 justify-end items-center text-sm font-bold",
              "px-2"
            )}
          >
            <div
              className={clsx(
                "hover:bg-neutral-400 active:bg-neutral-300",
                "rounded-sm p-1",
                "cursor-pointer"
              )}
              onClick={createNewFile}
            >
              <BsFileEarmarkPlus />
            </div>
          </div>
        </div>
        <div className="w-full flex items-start justify-center">
          {!showFiles ? (
            <div
              className={clsx(
                "mt-4 py-1 px-3",
                "rounded-sm",
                "bg-sky-600 hover:bg-sky-500 active:bg-sky-700",
                "text-white font-semibold select-none",
                "cursor-pointer"
              )}
              onClick={createNewFile}
            >
              Create New
            </div>
          ) : (
            <div className="w-full">
              {newFile && (
                <NewFileInput
                  autoFocus
                  onInput={() => {
                    setNewFileError("");
                  }}
                  onSubmit={onSubmitFile}
                  showMessage={!!newFileError}
                  message={newFileError}
                  onBlur={() => setNewFile(false)}
                />
              )}
              {finalFiles.map((file) => (
                <FileNameDisplay file={file} key={file.name} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  persistData(): ZyPartialPersist<SidebarSchema, {}, {}> {
    throw new Error("Method not implemented.");
  }
  hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<SidebarSchema, {}, {}>>
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
