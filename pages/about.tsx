import React from "react";
import { Page, Title, Body } from "components/layout";
import Carousel from "components/carousel";
import { GetStaticProps } from "next";
import { getJobs } from "lib/jobs";

export default function About({ jobs }) {
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
          the experiments and musings from my life and professional career. I
          graduated from Oregon State University in 2018 with a bachelor's
          degree in computer science. Before the age of twenty-four, I hadn't
          written a single line of code. I took CS120 - Intro to Programming at
          my local community college as a filler elective while pursuing a
          degree in education and I knew instantly that I had found what I
          wanted to do for the rest of my life. I switched majors and graduated
          a couple of years later. I have been writing code professionally for
          several years now and nothing has changed.
        </p>
        <p>
          I have always had an affinity for creating things, the only thing that
          has change is the medium.
        </p>
        <h2>Professional History</h2>
        <Carousel jobs={jobs} />
      </Body>
    </Page>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const { Jobs } = await getJobs();
  return {
    props: { jobs: Jobs },
  };
};
