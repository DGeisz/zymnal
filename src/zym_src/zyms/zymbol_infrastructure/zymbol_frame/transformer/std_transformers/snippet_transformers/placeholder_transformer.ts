import { createJsxJsxClosingFragment } from "typescript";
import { Zentinel } from "../../../../../../../zym_lib/zentinel/zentinel";
import { ZymbolFrameMethod } from "../../../zymbol_frame_schema";
import { STD_TRANSFORMER_TYPE_FILTERS } from "../std_transformer_type_filters";
import {
  getTransformTextZymbolAndParent,
  inPlaceReplaceTextWithZymbols,
  makeHelperCursor,
  recoverAllowedCursor,
} from "../transform_utils";
import { SnippetPlaceholder } from "../../../../../zymbol/zymbols/snippet_placeholder/snippet_placeholder";
import {
  BasicZymbolTreeTransformation,
  ZymbolTransformRank,
} from "../../transformer";
import { Zocket } from "../../../../../zymbol/zymbols/zocket/zocket";
import {
  KeyPressBasicType,
  KeyPressComplexType,
} from "../../../../../../../zym_lib/zy_god/event_handler/key_press";

const PLACEHOLDER_TRANSFORMER_ID = "place-hold-trans";

function wordIsPlaceholder(word: string): boolean {
  return /^\$\d+$/.test(word);
}

class PlaceholderTransformer extends Zentinel<{}> {
  zyId: string = PLACEHOLDER_TRANSFORMER_ID;

  onRegistration = async () => {
    this.callZ(ZymbolFrameMethod.registerTransformer, {
      source: PLACEHOLDER_TRANSFORMER_ID,
      name: "place-hold",
      typeFilters: [
        STD_TRANSFORMER_TYPE_FILTERS.EQUATION,
        STD_TRANSFORMER_TYPE_FILTERS.SNIPPET_EDITOR,
      ],
      transform(root, cursor) {
        cursor = makeHelperCursor(cursor, root);

        const textTransform = getTransformTextZymbolAndParent(root, cursor);
        if (!textTransform.isTextZymbol) return [];

        const { text, parent, zymbolIndex } = textTransform;
        const word = text.getText();

        if (!wordIsPlaceholder(word)) return [];

        const label = parseInt(word.slice(1));

        const snippetPlaceholder = new SnippetPlaceholder(
          label,
          root.parentFrame,
          0,
          parent
        );

        const { newCursor } = inPlaceReplaceTextWithZymbols(
          snippetPlaceholder,
          zymbolIndex,
          parent,
          cursor
        );

        return [
          new BasicZymbolTreeTransformation(
            {
              newTreeRoot: root as Zocket,
              cursor: recoverAllowedCursor(newCursor, root),
              previewZymbol: snippetPlaceholder,
              priority: {
                rank: ZymbolTransformRank.Suggest,
                cost: 0,
              },
            },
            (keyPress) => {
              return !(
                keyPress.type === KeyPressBasicType.Delete ||
                (keyPress.type === KeyPressComplexType.Key &&
                  /\d/.test(keyPress.key))
              );
            }
          ),
        ];
      },
    });
  };
}

export const placeholderTransformer = new PlaceholderTransformer();
