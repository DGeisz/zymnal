import React, { useMemo } from "react";
import _ from "underscore";
import { Zyact } from "./zyact";

export function useZymponent(zym: Zyact): React.FC {
  return useMemo(zym.getRenderContent, [zym.iid]);
}

export function useZymponents(zyms: Zyact[]): React.FC[] {
  const listId = _.reduce(zyms, (prev, curr) => prev + curr.iid, 0);

  return useMemo(() => zyms.map((z) => z.getRenderContent()), [listId]);
}
