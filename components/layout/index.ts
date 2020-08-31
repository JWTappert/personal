import Nav from "./nav";
import Social from "./social";
import styled from "styled-components";

const Page = styled.main`
  height: 100%;
  width: 100%;
`;

const Title = styled.div`
  display: flex;
  justify-content: start;

  h1 {
    font-weight: 100;
  }
`;

const Body = styled.div`
  max-width: 980px;
  margin: auto;

  h2 {
    font-weight: 500;
  }

  p {
    line-height: 1.5em;
  }

  @media (max-width: 768px) {
    margin: 2em;
  }
`;

export { Nav, Social, Page, Title, Body };
