import React, { useContext } from "react";
import { Page, Body } from "components/layout";
import { Skull } from "components/skull";
import styled, { ThemeContext } from "styled-components";
import { Layout } from "antd";

export default function Home() {
  const themeContext = useContext(ThemeContext);

  return (
    <Page>
      <HomeBody>
        <Container>
          <Skull />
        </Container>
      </HomeBody>
    </Page>
  );
}

const Container = styled.div`
  display: flex;
  height: 80vh;
  flex-direction: column;
  justify-content: center;
`;

const HomeBody = styled(Body)`
  height: 90%;
`;
