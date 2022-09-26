import clsx from "clsx";
import React, { useState } from "react";

interface NewFileInputProps {
  showMessage?: boolean;
  message?: string;
  autoFocus?: boolean;
  onSubmit: (fileName: string) => void;
  onInput: () => void;
  onBlur: () => void;
}

const NewFileInput: React.FC<NewFileInputProps> = (props) => {
  const { showMessage } = props;
  const [fileName, setFileName] = useState<string>("");

  return (
    <div>
      <div>
        <input
          onBlur={props.onBlur}
          value={fileName}
          onChange={(e) => {
            setFileName(e.target.value);
            props.onInput();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              props.onSubmit(fileName);
            }
          }}
          className={clsx(
            "py-[2px] pl-[4px]",
            "w-full",
            "dark:text-neutral-200 text-black",
            "bg-transparent",
            "border border-solid border-neutral-600 !focus:border-neutral-400",
            "select-none",
            "cursor-pointer",
            "text-sm"
          )}
          placeholder="Filename..."
          autoFocus={props.autoFocus}
        />
        {showMessage && (
          <div
            className={clsx(
              "bg-neutral-600",
              "text-xs",
              "text-red-300",
              "px-1"
            )}
          >
            {props.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewFileInput;
