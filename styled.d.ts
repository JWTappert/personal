// import original module declarations
import 'styled-components';

// and extend them!
declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      secondary: string;
      tertiary: string;
      link: string;
    };

    body: string;
    invertBody: string;
    text: string;
    invertText: string;
    toggleBorder: string;
    gradient: string;
    inputFill: string;
  }
}
