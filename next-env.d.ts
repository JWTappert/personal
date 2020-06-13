/// <reference types="next" />
/// <reference types="next/types/global" />
// import original module declarations
import "styled-components";

// and extend them!
declare module "styled-components" {
  export interface DefaultTheme {
    borderRadius: string;
    body: string;
    invertBody: string;
    text: string;
    invertText: string;
    toggleBorder: string;
    gradient: string;
    inputFill: string;

    colors: {
      primary: string;
      secondary: string;
    };

    card: {
      backgroundColor: string;
    };
  }
}
