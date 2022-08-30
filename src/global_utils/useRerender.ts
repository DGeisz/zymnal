import { useEffect, useState } from "react";

export function useRerender<T>(initialOpts?: T) {
  const [_i, setI] = useState<number>(0);
  const [opts, setOpts] = useState<T>();

  useEffect(() => {
    if (initialOpts) setOpts(initialOpts);
  }, []);

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
