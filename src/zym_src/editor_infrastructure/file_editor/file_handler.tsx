import { Zyact } from "../../../zym_lib/zym/zymplementations/zyact/zyact";
import {
  ZyBaseSchema,
  ZyPersistenceSchema,
  ZySchema,
} from "../../../zym_lib/zy_schema/zy_schema";
import { FileEditor } from "./file_editor";

export abstract class FileHandler<
  Schema extends ZySchema<BSchema, PSchema> = any,
  BSchema extends ZyBaseSchema = Schema["base"],
  PSchema extends ZyPersistenceSchema<BSchema> = Schema["persistence"]
> extends Zyact<Schema, {}, BSchema, PSchema> {
  abstract parent: FileEditor;
}
