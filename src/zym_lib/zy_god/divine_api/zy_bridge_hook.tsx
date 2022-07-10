import React, { useEffect, useState } from "react";
import { useZymponent } from "../../zym/zymplementations/zyact/hooks";
import { Zyact } from "../../zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../zym/zy_master";
import { zyGod } from "../zy_god";

interface ZyBridgeProps {
  root: Zyact;
  zyMasters: ZyMaster[];
}

export const ZyBridge: React.FC<ZyBridgeProps> = (props) => {
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    zyGod.registerMasters(props.zyMasters);
    zyGod.setRoot(props.root);

    setReady(true);
  }, []);

  const RootComp = useZymponent(props.root);

  if (ready) {
    return <RootComp />;
  } else {
    return null;
  }
};
