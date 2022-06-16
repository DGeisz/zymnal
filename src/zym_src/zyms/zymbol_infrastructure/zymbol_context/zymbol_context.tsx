import { FC } from "react";
import { useZymponent } from "../../../../zym_lib/zym/zymplementations/zyact/hooks";
import { Zyact } from "../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { KeyPressResponse } from "../../../../zym_lib/zym/zym_types";
import { Cursor, extendChildCursor } from "../../../../zym_lib/zy_god/cursor";
import {
  ZymKeyPress,
  KeyPressContext,
} from "../../../../zym_lib/zy_god/types/basic_types";
import { ZymbolProgression } from "../zymbol_progression/zymbol_progression";
import { ZYMBOL_CONTEXT_ID } from "./zc_master";
import { ZCP_FIELDS, ZymbolContextPersist } from "./zc_persist";

export class ZymbolContext extends Zyact<ZymbolContextPersist> {
  progression: ZymbolProgression = new ZymbolProgression(0, this);

  component: FC = () => {
    const ProgressionComponent = useZymponent(this.progression);

    return <ProgressionComponent />;
  };

  persist() {
    return {
      [ZCP_FIELDS.PROGRESSION]: this.progression.persist(),
    };
  }

  getInitialCursor(): Cursor {
    return extendChildCursor(0, this.progression.getInitialCursor());
  }

  handleKeyPress(
    keyPress: ZymKeyPress,
    ctx: KeyPressContext
  ): KeyPressResponse {
    throw new Error("Method not implemented.");
  }

  hydrate(persisted: ZymbolContextPersist): void {
    this.progression.hydrate(persisted[ZCP_FIELDS.PROGRESSION]);
  }

  getZyMasterId(): string {
    return ZYMBOL_CONTEXT_ID;
  }
}
