import { HermesMessage, ZentinelMessage } from "../../../zym_lib/hermes/hermes";
import { Zentinel } from "../../../zym_lib/zentinel/zentinel";
import { Zym } from "../../../zym_lib/zym/zym";
import {
  ok,
  UNIMPLEMENTED,
  unwrap,
} from "../../../zym_lib/zy_commands/zy_command_types";
import { Cursor } from "../../../zym_lib/zy_god/cursor/cursor";
import { GET_ZYM_ROOT } from "../../../zym_lib/zy_god/zy_god";
import { Zymbol } from "../../zyms/zymbol/zymbol";
import _ from "underscore";
import { ZymKeyPress } from "../../../zym_lib/zy_god/event_handler/key_press";
import { Zocket } from "../../zyms/zymbol/zymbols/zocket/zocket";

export const TransformerId = "transformer-59bcd";

enum TransformerMessage {
  RegisterTransformer = "rt",
  RegisterTransformerFactory = "rtf",
  GetTransformer = "gt",
}

export const CreateTransformerMessage = {
  registerTransformer(transformer: SourcedTransformer): HermesMessage {
    return {
      zentinelId: TransformerId,
      message: TransformerMessage.RegisterTransformer,
      content: { transformer },
    };
  },
  registerTransformerFactory(factory: TransformerFactory): HermesMessage {
    return {
      zentinelId: TransformerId,
      message: TransformerMessage.RegisterTransformerFactory,
      content: { factory },
    };
  },
  getTransformer(cursor: Cursor): HermesMessage {
    return {
      zentinelId: TransformerId,
      message: TransformerMessage.GetTransformer,
      content: {
        cursor,
      },
    };
  },
};

export interface GetTransformerContent {
  cursor: Cursor;
}

export interface ZymbolTreeTransformationPriority {
  rank: number;
  value: number;
}

export interface ZymbolTreeTransformation {
  newTreeRoot: Zocket;
  cursor: Cursor;
  priority: ZymbolTreeTransformationPriority;
  selector?: ZymKeyPress;
}

export type ZymbolTransformer = (
  rootZymbol: Zymbol,
  cursor: Cursor
) => ZymbolTreeTransformation[];

export interface SourcedTransformer {
  source: string;
  name: string;
  transform: ZymbolTransformer;
}

export interface TransformerFactory {
  source: string;
  name: string;
  factory: (root: Zym, cursor: Cursor) => ZymbolTransformer[];
}

class ZymbolTransformerZentinel extends Zentinel {
  zyId = TransformerId;

  transformerFactories: TransformerFactory[] = [];
  transformers: SourcedTransformer[] = [];

  handleMessage = async (msg: ZentinelMessage) => {
    switch (msg.message) {
      case TransformerMessage.RegisterTransformerFactory: {
        this.registerTransformerFactory(msg.content.factory);

        return ok(true);
      }
      case TransformerMessage.RegisterTransformer: {
        this.registerSourcedTransformer(msg.content.transformer);

        return ok(true);
      }
      case TransformerMessage.GetTransformer: {
        const { cursor } = msg.content as GetTransformerContent;

        return ok(await this.getZymbolTransformer(cursor));
      }
      default: {
        /* Zentinel defaults to unimplemented for unhandled messages */
        return UNIMPLEMENTED;
      }
    }
  };

  /*
  --- NOTE ---
  We allow overriding transformer implementations by default
  */

  registerSourcedTransformer = (trans: SourcedTransformer) => {
    this.transformers = this.transformers.filter(
      (f) => !(f.name === trans.name && f.source === trans.source)
    );

    this.transformers.push(trans);
  };

  registerTransformerFactory = (factory: TransformerFactory) => {
    /* Make sure to get rid of any existing factories of this type */
    this.transformerFactories = this.transformerFactories.filter(
      (f) => !(f.name === factory.name && f.source === factory.source)
    );

    this.transformerFactories.push(factory);
  };

  getZymbolTransformer = async (cursor: Cursor) => {
    /* Get the zym root */
    const root = unwrap(await this.callHermes(GET_ZYM_ROOT)) as Zym;

    const transformers = _.flatten(
      this.transformerFactories.map((factory) => factory.factory(root, cursor))
    );

    transformers.push(...this.transformers.map((t) => t.transform));

    return (zymbolRoot: Zymbol, zymbolCursor: Cursor) => {
      return _.flatten(
        transformers.map((t) => {
          return t(zymbolRoot.clone() as Zymbol, zymbolCursor);
        })
      );
    };
  };
}

export const zymbolTransformerZentinel = new ZymbolTransformerZentinel();
