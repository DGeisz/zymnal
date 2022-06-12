import React, { useEffect } from "react";
import { useZymponent } from "../../zym/zymplementations/zyact/hooks";
import { Zyact } from "../../zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../zym/zy_master";
import { zyGod } from "../zy_god";

interface ZyBridgeProps {
  root: Zyact;
  zyMasters: ZyMaster[];
}

export const ZyBridge: React.FC<ZyBridgeProps> = (props) => {
  useEffect(() => {
    zyGod.registerMasters(props.zyMasters);
    zyGod.setRoot(props.root);
  }, []);

  const RootComp = useZymponent(props.root);

  return <RootComp />;
};
