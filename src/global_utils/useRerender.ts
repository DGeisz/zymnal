import { useState } from "react";

export function useRerender<T>(initialOpts: T) {
  const [_i, setI] = useState<number>(0);
  const [opts, setOpts] = useState<T>(initialOpts);

  return {
    rerender: (newOpts?: T) => {
      setI((i) => i + 1);
      if (newOpts) {
        setOpts(newOpts);
      }
    },
    opts,
  };
}

export function usePlainRerender() {
  const [_i, setI] = useState<number>(0);
  console.log("nw---------------------", _i);

  return () => {
    setI((i) => {
      console.log("plain rerendering ---------------------", i);
      return i + 1;
    });
  };
}
