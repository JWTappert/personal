import React, { useContext } from "react";
import { Page, Title, Body } from "components/layout";
import { Skull } from "components/skull";
import styled, { ThemeContext } from "styled-components";

export default function Home() {
  const themeContext = useContext(ThemeContext);

  function adjustIconColor(icon: string): string {
    const iconBaseUrl = `https://img.icons8.com/ios/30/`;
    return `${iconBaseUrl}${themeContext.text.substr(1)}/${icon}`;
  }

  return (
    <Page>
      <Title>
        <h1>/tappert/index</h1>
      </Title>
      <HomeBody>
        <Container>
          <Skull />
          <Text>look around if ya want...</Text>
          <SocialLinks>
            {social.map((soc) => (
              <a href={soc.link} key={soc.link}>
                <img alt={soc.name} src={adjustIconColor(soc.icon)} />
              </a>
            ))}
          </SocialLinks>
        </Container>
      </HomeBody>
    </Page>
  );
}

const Text = styled.p`
  margin-bottom: 50px;
`;

const SocialLinks = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Container = styled.div`
  display: flex;
  height: 80vh;
  flex-direction: column;
  justify-content: center;
`;

const HomeBody = styled(Body)`
  height: 90%;
`;

const social = [
  {
    name: "github",
    link: "https://github.com/jwtappert",
    icon: "github-2.png",
  },
  {
    name: "twitter",
    link: "https://twitter.com/tappertwj",
    icon: "twitter.png",
  },
  {
    name: "linkedin",
    link: "https://linkedin.com/in/tappertj",
    icon: "linkedin-2.png",
  },
  {
    name: "stackoverflow",
    link: "https://stackoverflow.com/users/8309938/justin",
    icon: "stackoverflow.png",
  },
  {
    name: "email",
    link: "mailto:tappertwj@gmail.com",
    icon: "important-mail.png",
  },
];
