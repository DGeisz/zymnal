import { useZymponent } from "../../../zym_lib/zym/zymplementations/zyact/hooks";
import { Zyact } from "../../../zym_lib/zym/zymplementations/zyact/zyact";
import { KeyPressResponse } from "../../../zym_lib/zym/zym_types";
import {} from "../../../zym_lib/zy_god/cursor";
import {
  ZymKeyPress,
  KeyPressContext,
} from "../../../zym_lib/zy_god/types/context_types";
import { ZymbolContext } from "../zymbol_infrastructure/zymbol_context/zymbol_context";
import { zageMaster } from "./zage_master";
import { ZagePersist, ZAGE_PERSIST_FIELDS } from "./zage_persist";

/* For the time being, a zage will just hold a central context */
export class Zage extends Zyact<ZagePersist> {
  baseZymbolContext: ZymbolContext = new ZymbolContext(0, this);
  children = [this.baseZymbolContext];

  handleKeyPress(
    _keyPress: ZymKeyPress,
    _ctx: KeyPressContext
  ): KeyPressResponse {
    throw new Error("Method not implemented.");
  }

  component = () => {
    const BaseContextComponent = useZymponent(this.baseZymbolContext);

    /* TODO: Figure out what you want to do with the render context here */

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
    return zageMaster.zyId;
  }
}
