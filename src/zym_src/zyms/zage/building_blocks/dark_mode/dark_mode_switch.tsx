import React, { useEffect } from "react";
import clsx from "clsx";
import { useReactiveVariable } from "../../../../../zym_lib/utils/reactive_variables";
import { DarkModeReactive } from "./dark_mode_var";

const LS_DM_KEY = "ls-dm-key";

const DarkModeSwitch: React.FC = () => {
  const [darkMode, setDarkMode] = useReactiveVariable(DarkModeReactive);

  const setMode = (dark: boolean) => {
    window.localStorage.setItem(LS_DM_KEY, JSON.stringify(dark));
  };

  useEffect(() => {
    const ls_val = window.localStorage.getItem(LS_DM_KEY);

    if (!!ls_val) {
      const parsed = JSON.parse(ls_val);

      setMode(parsed);
      setDarkMode(parsed);
    } else {
      setDarkMode(true);
    }
  }, []);

  return (
    <div className={"z-0 relative flex h-[28px] w-[52px]"}>
      <div
        className={clsx(
          "z-0",
          "flex flex-row",
          "absolute px-[2px] inset-0 rounded-full bg-gray-600",
          "cursor-pointer"
        )}
        onClick={() => {
          setDarkMode((is_dark) => {
            const new_dark = !is_dark;
            setMode(new_dark);
            return new_dark;
          });
        }}
      >
        <div className="flex-1 text-xl mb-px items-center text-center selection:bg-none select-none">
          🌜
        </div>
        <div className="flex-1 text-xl mb-px text-center selection:bg-none select-none">
          🌞
        </div>
      </div>
      <div
        className={clsx(
          "pointer-events-none",
          "absolute z-20 top-0.5 left-0.5",
          "h-[24px] w-[24px] rounded-full",
          "bg-white rounded-full",
          "transition-all",
          darkMode && "translate-x-6"
        )}
      />
    </div>
  );
};

export default DarkModeSwitch;
