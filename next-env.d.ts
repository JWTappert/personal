/// <reference types="next" />
/// <reference types="next/types/global" />
// import original module declarations
import "styled-components";

// and extend them!
declare module "styled-components" {
  export interface DefaultTheme {
    borderRadius: string;
    body: string;
    text: string;
    toggleBorder: string;
    gradient: string;

    colors: {
      main: string;
      secondary: string;
    };
  }
}
