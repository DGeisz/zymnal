import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import { ZyBridge } from "./zym_lib/zy_god/divine_api/zy_bridge_hook";
import { zyMasterList } from "./zym_src/zy_master_registration/zy_master_list";
import { getZymTreeRoot } from "./zym_src/root";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <ZyBridge root={getZymTreeRoot()} zyMasters={zyMasterList} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
