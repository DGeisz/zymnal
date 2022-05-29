import { useState } from "react";

export function useRerender() {
  const [_i, setI] = useState<number>(0);

  return { rerender: () => setI((i) => i + 1) };
}
