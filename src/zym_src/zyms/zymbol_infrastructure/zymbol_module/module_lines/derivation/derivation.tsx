import { FC } from "react";
import { safeHydrate } from "../../../../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../../../../zym_lib/zym/zym";
import { Zyact } from "../../../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../../../../zym_lib/zym/zy_master";
import { ZyPartialPersist } from "../../../../../../zym_lib/zy_schema/zy_schema";
import { DerivationSchema, DERIVATION_ID } from "./derivation_schema";

class DerivationMaster extends ZyMaster<DerivationSchema> {
  newBlankChild(): Zym<DerivationSchema, any, any, {}, {}> {
    throw new Error("Method not implemented.");
  }

  zyId: string = DERIVATION_ID;
}

export const derivationMaster = new DerivationMaster();

export class Derivation extends Zyact<DerivationSchema> {
  zyMaster = derivationMaster;

  component: FC<{}> = () => {
    return null;
  };

  children: Zym[] = [];

  persistData(): ZyPartialPersist<DerivationSchema> {
    return {};
  }

  getRefreshedChildrenPointer(): Zym[] {
    return [];
  }

  async hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<DerivationSchema>>
  ): Promise<void> {
    await safeHydrate(p, {});
  }
}
