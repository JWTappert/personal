import React from "react";
import { Page, Title, Body } from "components/layout";

export default function About({}) {
  return (
    <Page>
      <Title>
        <h1>/tappert/about.ts</h1>
      </Title>
      <Body>
        <h2>about me</h2>
        <p>
          My name is Justin and I am currently a software engineer living and
          working in Bend, Oregon. This site is mostly aimed at compiling all
          the experiements and museings from my life and professional career. I
          graduated from Oregon State University in 2018 with a bachelors degree
          in computer science. Before the age of twenty-four I hadn't written a
          single line of code. I took CS120 - Intro to Programming at my local
          community college as a filler elective while pursuing a degree in
          education and I knew instantly that I had found what I wanted to do
          for the rest of my life. I have been writing code professionally for a
          number of years now and nothing has changed.
        </p>
      </Body>
    </Page>
  );
}
