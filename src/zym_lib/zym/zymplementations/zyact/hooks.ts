import React, { useMemo } from "react";
import { Zyact } from "./zyact";

export function useZymponent(zym: Zyact): React.FC {
  return useMemo(zym.getRenderContent, [zym.iid]);
}
