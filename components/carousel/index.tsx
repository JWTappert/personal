import React, { useState } from "react";
import styled from "styled-components";
import moment from "moment";
import markdownToHtml from "lib/markdownToHtml";

export default function Carousel({ jobs }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { company, description, website, start, end, position, logo } = jobs[
    currentIndex
  ];

  function next() {
    const next = (currentIndex + 1) % jobs.length;
    setCurrentIndex(next);
  }

  function prev() {
    let prev = (currentIndex - 1) % jobs.length;
    if (prev < 0) prev = jobs.length - 1;
    setCurrentIndex(prev);
  }

  return (
    <Container>
      <Button onClick={() => prev()}>
        <span className="material-icons">keyboard_arrow_left</span>
      </Button>
      <ContentBody>
        <Header>
          <Title>
            <h1>{company}</h1>
            <small>
              <a href={`https://${website}`}>{website}</a>
            </small>
            <PositionSection>
              <h4>Title: {position}</h4>
              <small>From: {moment(start).format("M/D/YY")}</small>
              &nbsp;&nbsp;
              <small>
                Until: {!!end ? moment(end).format("M/D/YY") : "Now"}
              </small>
            </PositionSection>
          </Title>
          <Logo
            src={
              logo?.url
                ? `https://quiet-island-86124.herokuapp.com${logo.url}`
                : "https://via.placeholder.com/150"
            }
          />
        </Header>
        <p>{description}</p>
      </ContentBody>
      <Button onClick={() => next()}>
        <span className="material-icons">keyboard_arrow_right</span>
      </Button>
    </Container>
  );
}

const Logo = styled.img`
  padding: 2em;
  max-width: 50%;
  margin: auto;
`;

const PositionSection = styled.div``;

const Title = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2em;
  max-width: 50%;

  h1,
  h4 {
    margin-bottom: 0;
  }
  small {
    margin-bottom: 0.83em;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ContentBody = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 2em;
`;

const Button = styled.span`
  padding: 2em;
  color: ${({ theme }) => theme.colors.primary};
  background-color: transparent;

  &:hover {
    color: ${({ theme }) => theme.invertText};
    background-color: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
  }
`;

const Container = styled.div`
  width: 100%;
  height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;
