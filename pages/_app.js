// import App from 'next/app'
import React from "react";
import Head from "next/head";
import { useDarkMode } from "lib/hooks/useDarkMode";
import styled, { ThemeProvider } from "styled-components";
import { GlobalStyles } from "global";
import Nav from "components/layout/nav";

export const lightTheme = {
  body: "#E2E2E2",
  invertBody: "#363537",
  text: "#363537",
  invertText: "#FAFAFA",
  toggleBorder: "#FFF",
  gradient: "linear-gradient(#39598A, #79D7ED)",
  inputFill: "#fff",

  colors: {
    primary: "#35c3c1",
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
    primary: "#35c3c1",
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
    <ThemeProvider theme={themeMode}>
      <Head>
        <title>d e r p s t a r r</title>
        {/* <link rel="icon" href="/favicon.ico" /> */}
      </Head>
      <Container>
        <GlobalStyles />
        <Component {...pageProps} />
        <Nav theme={theme} toggleTheme={toggleTheme} />
      </Container>
    </ThemeProvider>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: calc(100vw - 50px);
  height: calc(100vh - 100px);
  min-height: 100vh;
  color: ${({ theme }) => theme.text};
`;

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
