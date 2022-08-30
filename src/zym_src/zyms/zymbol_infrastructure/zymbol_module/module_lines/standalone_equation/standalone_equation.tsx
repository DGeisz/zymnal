import { FC } from "react";
import { Zym } from "../../../../../../zym_lib/zym/zym";
import { Zyact } from "../../../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../../../../zym_lib/zym/zy_master";
import { ZyPartialPersist } from "../../../../../../zym_lib/zy_schema/zy_schema";
import {
  StandaloneEqSchema,
  StandalonePersistenceSchema,
  STANDALONE_EQ_ID,
} from "./standalone_equation_schema";

class StandaloneEquationMaster extends ZyMaster<
  StandaloneEqSchema,
  StandalonePersistenceSchema
> {
  zyId: string = STANDALONE_EQ_ID;

  newBlankChild(): Zym<{}, {}, any, any> {
    throw new Error("Method not implemented.");
  }
}

export const standaloneEquationMaster = new StandaloneEquationMaster();

export class StandaloneEquation extends Zyact<
  StandaloneEqSchema,
  StandalonePersistenceSchema
> {
  zyMaster: ZyMaster<{}, {}, any> = standaloneEquationMaster;
  children: Zym<any, any, any, any>[] = [];

  component: FC<{}> = () => null;

  persistData(): ZyPartialPersist<{}, {}> {
    throw new Error("Method not implemented.");
  }
  hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<{}, {}>>
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
