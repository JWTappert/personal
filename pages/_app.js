// import App from 'next/app'
import React from "react";
import { useDarkMode } from "lib/hooks/useDarkMode";
import { ThemeProvider } from "styled-components";
import { GlobalStyles } from "global";

export const lightTheme = {
  body: "#E2E2E2",
  invertBody: "#363537",
  text: "#363537",
  invertText: "#FAFAFA",
  toggleBorder: "#FFF",
  gradient: "linear-gradient(#39598A, #79D7ED)",
  inputFill: "#fff",

  colors: {
    primary: "red",
    secondary: "green",
  },
};

export const darkTheme = {
  body: "#363537",
  invertBody: "#FFF",
  text: "#FAFAFA",
  invertText: "#363537",
  toggleBorder: "#6B8096",
  gradient: "linear-gradient(#091236, #1E215D)",
  inputFill: "#ccc",

  colors: {
    primary: "red",
    secondary: "green",
  },
};

function MyApp(props) {
  const { Component, pageProps } = props;
  const [theme, toggleTheme, componentMounted] = useDarkMode();

  const themeMode = theme === "light" ? lightTheme : darkTheme;

  if (!componentMounted) {
    return <div />;
  }

  return (
    <ThemeProvider theme={themeMode} toggleTheme={toggleTheme}>
      <>
        <GlobalStyles />
        <button onClick={toggleTheme}>Toggle theme</button>
        <Component {...pageProps} />
      </>
    </ThemeProvider>
  );
}

// Only uncomment this method if you have blocking data requirements for
// every single page in your application. This disables the ability to
// perform automatic static optimization, causing every page in your app to
// be server-side rendered.
//
// MyApp.getInitialProps = async (appContext) => {
//   // calls page's `getInitialProps` and fills `appProps.pageProps`
//   const appProps = await App.getInitialProps(appContext);
//
//   return { ...appProps }
// }

export default MyApp;
