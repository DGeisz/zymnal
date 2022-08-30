import { FC } from "react";
import { safeHydrate } from "../../../../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../../../../zym_lib/zym/zym";
import { Zyact } from "../../../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../../../../zym_lib/zym/zy_master";
import { ZyPartialPersist } from "../../../../../../zym_lib/zy_schema/zy_schema";
import {
  DerivationPersistenceSchema,
  DerivationSchema,
  DERIVATION_ID,
} from "./derivation_schema";

class DerivationMaster extends ZyMaster<
  DerivationSchema,
  DerivationPersistenceSchema
> {
  zyId: string = DERIVATION_ID;

  newBlankChild(): Zym<{}, {}, any, any> {
    throw new Error("Method not implemented.");
  }
}

export const derivationMaster = new DerivationMaster();

export class Derivation extends Zyact<
  DerivationSchema,
  DerivationPersistenceSchema
> {
  zyMaster: ZyMaster<{}, {}, any> = derivationMaster;

  component: FC<{}> = () => {
    return null;
  };

  children: Zym<any, any, any, any>[] = [];

  persistData(): ZyPartialPersist<{}, {}> {
    return {};
  }

  async hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<{}, {}>>
  ): Promise<void> {
    await safeHydrate(p, {});
  }
}
