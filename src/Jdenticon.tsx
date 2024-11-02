import Tooltip from "@mui/material/Tooltip";
import { toSvg } from "jdenticon";

export const Jdenticon = ({ value, size, darkMode, style } : {value: string, size: number, 
    darkMode: boolean,
    style: any
}) => {
    const config = window.jdenticon_config = window.jdenticon_config = {
      lightness: {
        color: darkMode ? [0.61, 0.84] : [0.24, 0.40],
        grayscale: darkMode ? [0.66, 0.86] : [0.1, 0.38]
    },
    saturation: {
        color: 1.00,
        grayscale: 1.00
    },
    backColor: "#ffffff00"
      };
    const avatarSource = toSvg(value, size, config);
  
    // if (darkMode) {
    //     style['backgroundColor'] = '#303740';
    // } else {
    //     style['backgroundColor'] = '#EEEEEE';
    // }
    const avatar = `data:image/svg+xml;utf8,${encodeURIComponent(avatarSource)}`;
    return (  
        <Tooltip title={value}>
      <img alt="User avatar" src={avatar} className="player-icon"
      style={
        { ...style,
            ...{
            backgroundColor: darkMode ? '#303740' : '#EEEEEE',
            }
            
        }
        } />
      </Tooltip>
    );
};