import _ from "underscore";
import { Zentinel } from "../../../../../../zym_lib/zentinel/zentinel";
import { DotModifiersMethod } from "../dot_modifiers/dot_modifiers_schema";
import { InPlaceMethod } from "../in_place_symbols/in_place_symbols_schema";
import { StdDotModMap } from "./dot_map";
import { greekDirectMap, greekSlashMap } from "./greek";
import { mathDirectMap, mathSlashMap } from "./math";
import { physicsDirect, physicsSlash } from "./physics";

class StdLibZentinel extends Zentinel<{}> {
  zyId: string = "std-lib";

  onRegistration = async () => {
    /* Standard In Place Symbols */
    await Promise.all(
      _.flatten([
        [greekSlashMap, mathSlashMap, physicsSlash].map((slash) =>
          this.callZentinelMethod(InPlaceMethod.addSlashMap, slash)
        ),
        [greekDirectMap, mathDirectMap, physicsDirect].map((direct) =>
          this.callZentinelMethod(InPlaceMethod.addDirectMap, direct)
        ),
      ])
    );

    /* Standard Dot Modifiers */
    await this.callZentinelMethod(DotModifiersMethod.addDotMap, StdDotModMap);
  };
}

export const stdLibZentinel = new StdLibZentinel();
