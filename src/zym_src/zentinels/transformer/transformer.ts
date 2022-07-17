import { ZentinelMessage } from "../../../zym_lib/hermes/hermes";
import { Zentinel } from "../../../zym_lib/zentinel/zentinel";
import { Zym } from "../../../zym_lib/zym/zym";
import {
  ok,
  UNIMPLEMENTED,
} from "../../../zym_lib/zy_commands/zy_command_types";
import { Zymbol } from "../../zyms/zymbol/zymbol";

export const TransformerId = "transformer-59bcd";

enum TransformerMessage {
  RegisterTransformerFactory = "rtf",
  GetTransformer = "gt",
}

export interface ZymbolTreeTransformationPriority {
  rank: number;
  value: number;
}

export interface ZymbolTreeTransformation {
  newTreeRoot: Zymbol;
  priority: ZymbolTreeTransformationPriority;
}

export type Transformer = (rootZymbol: Zymbol) => ZymbolTreeTransformation[];

export interface TransformerFactory {
  source: string;
  name: string;
  factory: (root: Zym) => Transformer[];
}

class TransformerZentinel extends Zentinel {
  id = TransformerId;

  transformerFactories: TransformerFactory[] = [];

  handleMessage = async (msg: ZentinelMessage) => {
    switch (msg.message) {
      case TransformerMessage.RegisterTransformerFactory: {
        this.registerTransformerFactory(msg.content);

        return ok(true);
      }
      case TransformerMessage.GetTransformer: {
      }
      default: {
        return UNIMPLEMENTED;
      }
    }
  };

  registerTransformerFactory = (factory: TransformerFactory) => {
    /* Make sure to get rid of any existing factories of this type */
    this.transformerFactories = this.transformerFactories.filter(
      (f) => !(f.name === factory.name && f.source === factory.source)
    );

    this.transformerFactories.push(factory);
  };
}

export {};
