import { useZymponent } from "../../../zym_lib/zym/zymplementations/zyact/hooks";
import { Zyact } from "../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import { ZymbolContext } from "../zymbol_infrastructure/zymbol_context/zymbol_context";
import { zageMaster } from "./zage_master";
import { ZagePersist, ZAGE_PERSIST_FIELDS } from "./zage_persist";

/* For the time being, a zage will just hold a central context */
export class Zage extends Zyact<ZagePersist> {
  zyMaster: ZyMaster = zageMaster;
  baseZymbolContext: ZymbolContext = new ZymbolContext(0, this);
  children = [this.baseZymbolContext];

  component = () => {
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

  clone = () => {
    const newZage = new Zage(this.getCursorIndex(), this.parent);
    newZage.baseZymbolContext = this.baseZymbolContext.clone() as ZymbolContext;
    newZage.children = [newZage.baseZymbolContext];

    return newZage;
  };
}
