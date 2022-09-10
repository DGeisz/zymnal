import { CreateZySchema } from "../../../../zym_lib/zy_schema/zy_schema";

export const ZINPUT_ID = "zinput";

export type ZinputSchema = CreateZySchema<
  {
    text: string;
  },
  {
    text: "t";
  }
>;
