import { ZageSchema } from "../../zym_src/zyms/zage/zage_schema";
import {
  createZentinelMethodList,
  CreateZentinelMethodSchema,
} from "../hermes/hermes";
import { SubId } from "../utils/types";
import { Cursor } from "../zy_god/cursor/cursor";
import { ZymPersist } from "../zy_schema/zy_schema";

export const PERSISTENCE_ZENTINEL_ID = "persistence_zentinel";

export type PersistedDoc = any;

export type PersistenceZentinelSchema = CreateZentinelMethodSchema<{
  addDocChangeSubscriber: {
    args: (doc: PersistedPage) => void;
    return: SubId;
  };
  removeSubscriber: {
    args: SubId;
    return: void;
  };
  persistDoc: {
    args: PersistedPage;
    return: void;
  };
}>;

export const PersistenceMethod =
  createZentinelMethodList<PersistenceZentinelSchema>(PERSISTENCE_ZENTINEL_ID, {
    addDocChangeSubscriber: 0,
    removeSubscriber: 0,
    persistDoc: 0,
  });

export interface PersistedPage {
  cursor: Cursor;
  zage: ZymPersist<ZageSchema>;
}
