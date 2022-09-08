import Tex from "../../../../../global_building_blocks/tex/tex";
import {
  KeyPressBasicType,
  KeyPressComplexType,
  ZymKeyPress,
} from "../../../../../zym_lib/zy_god/event_handler/key_press";
import { TeX } from "../../../zymbol/zymbol_types";
// import clsx from "clsx";

interface TexTransformProps {
  tex: TeX;
  inlineTex: boolean;
  showSelector?: boolean;
  selector?: ZymKeyPress;
}

// const Styles = {
//   SelectionKey: clsx(
//     "bg-green-200",
//     "rounded-md px-2 py-1",
//     "text-sm font-semibold text-green-600",
//     "shadow-sm shadow-gray"
//   ),
// };

export const TexTransform: React.FC<TexTransformProps> = (props) => {
  let finalKey = "Any Key";

  const { selector } = props;

  if (selector) {
    switch (selector.type) {
      case KeyPressComplexType.Key: {
        finalKey = selector.key;

        if (finalKey === " ") {
          finalKey = "Space";
        }

        break;
      }
      case KeyPressBasicType.Enter: {
        finalKey = "Enter";
        break;
      }
    }
  }

  return (
    <div className="flex flex-row self-stretch">
      <div className="flex flex-row flex-1 w-[200px]">
        {/* <div> */}
        <Tex {...props} />
        {/* </div> */}
      </div>
      {/* {props.showSelector && (
        <div className="flex self-end">
          <span>
            {(selector?.modifiers ?? []).map((m, i) => (
              <span key={i}>
                <span className={Styles.SelectionKey}>
                  {keyPressModifierToSymbol(m)}
                </span>
                <span className="mx-1">+</span>
              </span>
            ))}
            <span className={Styles.SelectionKey}>{finalKey}</span>
          </span>
        </div>
      )} */}
    </div>
  );
};
