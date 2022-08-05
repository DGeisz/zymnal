import { hydrateChild } from "../../../zym_lib/zym/utils/hydrate";
import { Zym, ZymPersist } from "../../../zym_lib/zym/zym";
import { useZymponent } from "../../../zym_lib/zym/zymplementations/zyact/hooks";
import { Zyact } from "../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import {
  ZymbolContext,
  ZymbolContextPersist,
} from "../zymbol_infrastructure/zymbol_context/zymbol_context";

/* ==== PERSIST ====  */

export const ZAGE_PERSIST_FIELDS: {
  CONTEXT: "c";
} = {
  CONTEXT: "c",
};

export interface ZagePersist {
  [ZAGE_PERSIST_FIELDS.CONTEXT]: ZymPersist<ZymbolContextPersist>;
}

/* ==== MASTER ====  */
class ZageMaster extends ZyMaster {
  zyId = "zage";

  newBlankChild(): Zym<any, any, any> {
    return new Zage(0, undefined);
  }
}

export const zageMaster = new ZageMaster();

/* ==== ZYM ====  */

/* For the time being, a zage will just hold a central context */
export class Zage extends Zyact<ZagePersist> {
  zyMaster: ZyMaster = zageMaster;
  baseZymbolContext: ZymbolContext = new ZymbolContext(0, this);
  children = [this.baseZymbolContext];

  component = () => {
    const BaseContextComponent = useZymponent(this.baseZymbolContext);

    return (
      <div className="m-16">
        <BaseContextComponent />
      </div>
    );
  };

  persistData() {
    return {
      [ZAGE_PERSIST_FIELDS.CONTEXT]: this.baseZymbolContext.persist(),
    };
  }

  async hydrate(p: ZagePersist): Promise<void> {
    this.baseZymbolContext = (await hydrateChild(
      this,
      p[ZAGE_PERSIST_FIELDS.CONTEXT]
    )) as ZymbolContext;
    this.children = [this.baseZymbolContext];

    this.reConnectParentChildren();
  }
}

/* ==== IMPLEMENTATIONS ====  */
