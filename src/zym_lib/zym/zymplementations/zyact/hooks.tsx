import React, { useMemo } from "react";
import _ from "underscore";
import { Zyact } from "./zyact";

export function useZymponent(zym: Zyact): React.FC<any> {
  return useMemo(zym.getRenderContent, [zym.iid]);
}

export function useZymponents(zyms: Zyact[]): React.FC[] {
  const listId = _.reduce(zyms, (prev, curr) => prev + curr.iid, 0);

  return useMemo(() => zyms.map((z) => z.getRenderContent()), [listId]);
}

export const ZyComp: React.FC<{ zyact: Zyact<any, any>; props?: any }> = ({
  zyact,
  props,
}) => {
  const Comp = useZymponent(zyact);

  return <Comp {...props} />;
};
