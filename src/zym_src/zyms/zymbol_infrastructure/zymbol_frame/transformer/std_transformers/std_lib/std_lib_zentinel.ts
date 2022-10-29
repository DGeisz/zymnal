import _ from "underscore";
import { Zentinel } from "../../../../../../../zym_lib/zentinel/zentinel";
import { FunctionTransformMethod } from "../equation_transformers/function_transformer/function_transformer_schema";
import { DotModifiersMethod } from "../equation_transformers/dot_modifiers/dot_modifiers_schema";
import { InPlaceMethod } from "../equation_transformers/in_place_symbols/in_place_symbols_schema";
import { StdDotModMap } from "./dot_map";
import { greekDirectMap, greekSlashMap } from "./greek";
import {
  addSqrtDotModifier,
  mathDirectMap,
  mathSlashMap,
  sqrtFunctionMap,
} from "./math/math";
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

    /* Standard Function Maps */
    await this.callZentinelMethod(
      FunctionTransformMethod.addFunctionTransformerMap,
      sqrtFunctionMap
    );

    await addSqrtDotModifier(this);
  };
}

export const stdLibZentinel = new StdLibZentinel();
