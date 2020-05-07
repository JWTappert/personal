import { useState } from "react";
import React from "react";
import useHorizontal from "@oberon-amsterdam/horizontal/hook";

import Head from "next/head";
import Name from "../components/name/name";
import GithubIcon from "../components/icons/github";
import LinkedInIcon from "../components/icons/linkedin";

export default function Home() {
  const [container, setContainer] = useState();
  useHorizontal({ container: container });

  return (
    <React.Fragment>
      <Head>
        <title>d e r p s t a r r</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <header>
        <div className="brand">
          <small>I'm</small>
          <Name />
          <small>and I like to build sh*t</small>
        </div>

        <div className="social">
          <GithubIcon />
          <LinkedInIcon />
        </div>
      </header>
      <div
        className="container"
        ref={(ref) => {
          setContainer(ref);
        }}
      >
        <div className="block" id="intro">
          Hey, I'm Justin. I'm a software engineer and I have a passion for art
          and design.
        </div>

        <div className="block">Why hello there</div>

        <div className="block">
          <a href="react.html">See react example</a>
        </div>

        <div className="block">
          <a href="#intro">Back to start</a>
        </div>
      </div>
    </React.Fragment>
  );
}
