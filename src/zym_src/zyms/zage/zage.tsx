import React from "react";
import { Zyact } from "../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZAGE_ID } from "./zage_master";

/* For the time being, a zage will just hold a central context */
export class Zage extends Zyact {
  component: React.FC<any> = (props) => <div />;

  persist() {
    throw new Error("Method not implemented.");
  }

  hydrate(persisted: any): void {
    throw new Error("Method not implemented.");
  }

  getZyMasterId(): string {
    return ZAGE_ID;
  }
}
