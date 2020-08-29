// import App from 'next/app'
import React, { useEffect } from "react";
import Router from "next/router";
import Head from "next/head";
import { ThemeProvider } from "styled-components";
import "antd/dist/antd.css";
import { Layout } from "antd";

import { useDarkMode } from "lib/hooks/useDarkMode";
import { GlobalStyles } from "global";
import { lightTheme, darkTheme } from "theme";
import { Nav, Social } from "components/layout";
import * as gtag from "lib/gtm";

function MyApp(props) {
  const { Component, pageProps } = props;
  const [theme, toggleTheme, componentMounted] = useDarkMode();
  const themeMode = theme === "light" ? lightTheme : darkTheme;

  useEffect(() => {
    const handleRouteChange = (url) => {
      gtag.pageview(url);
    };
    Router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      Router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, []);

  if (!componentMounted) {
    return <div />;
  }

  const { Header, Content, Footer } = Layout;

  return (
    <ThemeProvider theme={themeMode}>
      <Head>
        <title>t a p p e r t . i o</title>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        ></link>
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v0.51.0/mapbox-gl.css"
          rel="stylesheet"
        />
        {/* <link rel="icon" href="/favicon.ico" /> */}
      </Head>
      <Layout>
        <GlobalStyles />
        <Header
          style={{
            display: "flex",
            justifyContent: "space-between",
            background: "transparent",
          }}
        >
          <Nav theme={theme} toggleTheme={toggleTheme} />
        </Header>
        <Content style={{ height: "90vh" }}>
          <Component {...pageProps} />
        </Content>
        <Footer
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Social />
        </Footer>
      </Layout>
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
