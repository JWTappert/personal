import React from "react";
import { Page, Title, Body } from "components/layout";
import Carousel from "components/carousel";
import { JobHistory } from "next-env";

const jobHistory = [
  {
    companyName: "dutchie",
    website: "dutchie.com",
    logo: "https://via.placeholder.com/300x150",
    postition: "Software Engineer",
    started: "02-06-2020",
    ended: "",
    description:
      "I started as a Software Engineer 1 on February 6th of this year.",
  },
  {
    companyName: "The Flybook",
    website: "theflybook.com",
    logo: "https://via.placeholder.com/300x150",
    postition: "Software Engineer",
    started: "01-15-2017",
    ended: "02-03-2020",
    description: "Started as an intern and ended as a SE",
  },
  {
    companyName: "G5 Search Marketing",
    website: "getg5.com",
    logo: "https://via.placeholder.com/300x150",
    postition: "Web Content Specialist",
    started: "09-15-2015",
    ended: "01-12-2017",
    description: "Web content specialist as a contractor",
  },
  {
    companyName: "Executive Sweep",
    website: "none",
    logo: "https://via.placeholder.com/300x150",
    postition: "House Keeper",
    started: "06-01-2010",
    ended: "09-01-2015",
    description: "House keeper",
  },
];
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
        <Carousel history={jobHistory} />
      </Body>
    </Page>
  );
}
