import React, { useState } from "react";
import styled from "styled-components";
import moment from "moment";

export default function Carousel({ history }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  function next() {
    const next = (currentIndex + 1) % history.length;
    setCurrentIndex(next);
  }

  function prev() {
    let prev = (currentIndex - 1) % history.length;
    if (prev < 0) prev = history.length - 1;
    setCurrentIndex(prev);
  }

  return (
    <Container>
      <Button type="button" onClick={() => prev()}>
        prev
      </Button>
      <ContentBody>
        <Header>
          <Title>
            <h2>{history[currentIndex].companyName}</h2>
            <small>{history[currentIndex].website}</small>
            <p>
              From: {moment(history[currentIndex].started).format("M/D/YY")}
            </p>
            <p>Until: {moment(history[currentIndex].ended).format("M/D/YY")}</p>
          </Title>
          <img src={history[currentIndex].logo} />
        </Header>
        <p>{history[currentIndex].description}</p>
      </ContentBody>
      <Button type="button" onClick={() => next()}>
        next
      </Button>
    </Container>
  );
}

const Title = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2em;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ContentBody = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.primary};
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 2em;
`;

const Button = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: 40%;
  padding: 2em;
  color: ${({ theme }) => theme.colors.primary};
  background-color: transparent;

  &:hover {
    color: ${({ theme }) => theme.invertText};
    background-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Container = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.primary};
  width: 100%;
  height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;
