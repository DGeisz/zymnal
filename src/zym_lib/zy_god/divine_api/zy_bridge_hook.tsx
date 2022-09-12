import React, { useEffect, useState } from "react";
import { Zentinel } from "../../zentinel/zentinel";
import { useZymponent } from "../../zym/zymplementations/zyact/hooks";
import { Zyact } from "../../zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../zym/zy_master";
import { zyGod } from "../zy_god";

interface ZyBridgeProps {
  root: Zyact<any, any>;
  zyMasters: ZyMaster<any, any>[];
  zentinels: Zentinel<any>[];
}

let registeredRoot = false;

export const ZyBridge: React.FC<ZyBridgeProps> = (props) => {
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      if (!registeredRoot) {
        registeredRoot = true;
        zyGod.registerMasters(props.zyMasters);
        zyGod.registerZentinels(props.zentinels);

        await zyGod.setRoot(props.root);
      }

      setReady(true);
    })();
  }, []);

  const RootComp = useZymponent(props.root);

  console.log("root comp", RootComp);

  if (ready) {
    return <RootComp />;
  } else {
    return null;
  }
};
