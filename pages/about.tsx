import React from "react";
import { Page, Body } from "components/layout";
import Carousel from "components/carousel";
import { GetStaticProps } from "next";
import { getJobs } from "lib/jobs";
import { Layout, Typography } from "antd";

export default function About({ jobs }) {
  const { Title, Paragraph } = Typography;
  return (
    <Page>
      <Body>
        <Title level={2}>about me</Title>
        <Paragraph>
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
        </Paragraph>
        <Paragraph>
          I have always had an affinity for creating things, the only thing that
          has change is the medium.
        </Paragraph>
        <Title level={2}>work</Title>
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
