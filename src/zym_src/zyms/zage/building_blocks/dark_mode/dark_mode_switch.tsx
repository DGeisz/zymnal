import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { useReactiveVariable } from "../../../../../zym_lib/utils/reactive_variables";
import { DarkModeReactive } from "./dark_mode_var";

const LS_DM_KEY = "ls-dm-key";

const DarkModeSwitch: React.FC = () => {
  const [darkMode, setDarkMode] = useReactiveVariable(DarkModeReactive);

  console.log("gottem 2", darkMode);

  const setMode = (dark: boolean) => {
    window.localStorage.setItem(LS_DM_KEY, JSON.stringify(dark));
  };

  // const [a, setA] = useState(true);

  useEffect(() => {
    // setInterval(() => {
    //   setA(Math.random() > 0.5);
    // }, 1000);
    const ls_val = window.localStorage.getItem(LS_DM_KEY);

    if (!!ls_val) {
      const parsed = JSON.parse(ls_val);

      setMode(parsed);
      setDarkMode(parsed);
    } else {
      setDarkMode(true);
    }
  }, []);

  // console.log("a", a);
  console.log("beta: ", darkMode && "translate-x-6");

  return (
    <div className={"z-0 relative flex h-[28px] w-[52px] mb-16"}>
      <div
        className="z-0 flex flex-row absolute px-[2px] inset-0 rounded-full bg-gray-600 cursor-pointer"
        onClick={() => {
          setDarkMode((is_dark) => {
            const new_dark = !is_dark;
            setMode(new_dark);
            // setA(new_dark);

            return new_dark;
          });
        }}
      >
        <div className="flex-1 text-xl mb-px items-center text-center selection:bg-none">
          🌜
        </div>
        <div className="flex-1 text-xl mb-px text-center selection:bg-none">
          🌞
        </div>
      </div>
      <div
        className={clsx(
          "pointer-events-none",
          "absolute z-20 top-0.5 left-0.5",
          "h-[24px] w-[24px] rounded-full",
          "bg-white rounded-full",
          darkMode && "translate-x-6"
        )}
      />
    </div>
  );
};

export default DarkModeSwitch;
