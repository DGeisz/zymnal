import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import { ZyBridge } from "./zym_lib/zy_god/divine_api/zy_bridge_hook";
import { getZymTreeRoot, zentinelList, zyMasterList } from "./zym_src/root";
import "allotment/dist/style.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <ZyBridge
      root={getZymTreeRoot()}
      zyMasters={zyMasterList}
      zentinels={zentinelList}
    />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
