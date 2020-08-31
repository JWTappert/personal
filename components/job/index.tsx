import React from "react";
import styled from "styled-components";
import moment from "moment";

export default function Job({ job }) {
  const { company, description, website, start, end, position, logo } = job;

  return (
    <Container>
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
            src={logo?.url ? logo.url : "https://via.placeholder.com/150"}
          />
        </Header>
        <Description>{description}</Description>
      </ContentBody>
    </Container>
  );
}

const Description = styled.div`
  margin: 0 1.5em;
  overflow-y: auto;

  &::-webkit-scrollbar-track {
    background-color: ${({ theme }) => theme.invertBody};
  }

  &::-webkit-scrollbar {
    width: 3px;
    background-color: ${({ theme }) => theme.invertBody};
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.body};
  }
`;

const Logo = styled.img`
  padding: 2em;
  max-width: 150px;
  height: auto;
  margin: auto;

  @media (max-width: 768px) {
    display: none;
  }
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

  @media (max-width: 768px) {
    max-width: unset;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ContentBody = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    padding: 1em;
  }
`;

const Container = styled.div`
  margin: 0 auto;
  height: 60vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    height: 100vh;
  }
`;
