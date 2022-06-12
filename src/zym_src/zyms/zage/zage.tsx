import React from "react";
import { useZymponent } from "../../../zym_lib/zym/zymplementations/zyact/hooks";
import { Zyact } from "../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZymbolContext } from "../zymbol_infrastructure/zymbol_context/zymbol_context";
import { ZAGE_ID } from "./zage_master";
import { ZagePersist, ZAGE_PERSIST_FIELDS } from "./zage_persist";

/* For the time being, a zage will just hold a central context */
export class Zage extends Zyact<ZagePersist> {
  baseZymbolContext: ZymbolContext = new ZymbolContext();

  component: React.FC<any> = () => {
    const BaseContextComponent = useZymponent(this.baseZymbolContext);

    return (
      <div className="m-4">
        <BaseContextComponent />
      </div>
    );
  };

  persist() {
    return {
      [ZAGE_PERSIST_FIELDS.CONTEXT]: this.baseZymbolContext.persist(),
    };
  }

  hydrate(persisted: ZagePersist): void {
    this.baseZymbolContext.hydrate(persisted[ZAGE_PERSIST_FIELDS.CONTEXT]);
  }

  getZyMasterId(): string {
    return ZAGE_ID;
  }
}
