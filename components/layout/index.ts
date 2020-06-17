import Nav from "./nav";
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
    letter-spacing: 5px;
  }
`;

export { Nav, Page, Title };
