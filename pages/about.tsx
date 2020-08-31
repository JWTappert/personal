import React from "react";
import { Body } from "components/layout";
import { GetStaticProps } from "next";
import { getJobs } from "lib/jobs";
import { Layout, Typography, Carousel } from "antd";
import Job from "components/job";
import markdownToHtml from "lib/markdownToHtml";

export default function About({ jobs }) {
  const { Title, Paragraph } = Typography;

  return (
    <Layout style={{ height: "100%" }}>
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
        <Carousel adaptiveHeight dotPosition="right">
          {jobs.map((job, i) => (
            <Job key={i} job={job} />
          ))}
        </Carousel>
      </Body>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const { Jobs } = await getJobs();
  const jobsWithHtml = await Promise.all(
    Jobs.map(async (job) => {
      const descriptionHtml = await markdownToHtml(job.description);
      return { ...job, descriptionHtml };
    })
  );

  console.log({ jobsWithHtml });
  return {
    props: { jobs: jobsWithHtml },
  };
};
