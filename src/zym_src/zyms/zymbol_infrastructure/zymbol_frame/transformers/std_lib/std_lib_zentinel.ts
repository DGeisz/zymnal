import _ from "underscore";
import { Zentinel } from "../../../../../../zym_lib/zentinel/zentinel";
import { DotModifierMessage } from "../dot_modifiers";
import { InPlaceMessage } from "../in_place_symbols";
import { StdDotModMap } from "./dot_map";
import { greekDirectMap, greekSlashMap } from "./greek";
import { mathDirectMap, mathSlashMap } from "./math";
import { physicsDirect, physicsSlash } from "./physics";

class StdLibZentinel extends Zentinel {
  zyId: string = "std-lib";

  onRegistration = async () => {
    /* Standard In Place Symbols */
    await Promise.all(
      _.flatten([
        [greekSlashMap, mathSlashMap, physicsSlash].map((slash) =>
          this.callHermes(InPlaceMessage.addSlashMap(slash))
        ),
        [greekDirectMap, mathDirectMap, physicsDirect].map((direct) =>
          this.callHermes(InPlaceMessage.addDirectMap(direct))
        ),
      ])
    );

    /* Standard Dot Modifiers */
    await this.callHermes(DotModifierMessage.addDotMap(StdDotModMap));
  };
}

export const stdLibZentinel = new StdLibZentinel();
