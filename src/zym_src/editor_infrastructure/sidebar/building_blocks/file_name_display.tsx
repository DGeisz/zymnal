import clsx from "clsx";
import React from "react";
import { ZyFile } from "../../../zentinels/file_server_client/file_server_client_schema";

interface FileNameDisplayProps {
  file: ZyFile;
  autofocus?: boolean;
}

const FileNameDisplay: React.FC<FileNameDisplayProps> = (props) => {
  const { file } = props;

  return (
    <div
      className={clsx(
        "py-[2px] pl-[4px]",
        "w-auto",
        "dark:text-neutral-200 text-black",
        "dark:hover:bg-slate-200/20",
        "dark:active:bg-slate-200/60",
        "select-none",
        "cursor-pointer",
        "text-sm"
      )}
    >
      {file.name}
    </div>
  );
};

export default FileNameDisplay;
