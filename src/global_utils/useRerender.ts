import { useState } from "react";

export function useRerender<T>() {
  const [_i, setI] = useState<number>(0);
  const [opts, setOpts] = useState<T>();

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
