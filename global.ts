import { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle`
  *,
  *::after,
  *::before {
    box-sizing: border-box;
  }

  body {
    font-family: BlinkMacSystemFont, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    letter-spacing: 0.2em;
  }

  .ant-layout, .ant-layout-footer {
    background: ${({ theme }) => theme.body} !important;
  }

  .ant-typography, h1, h2, h3, h4, h5, p, small {
    color: ${({ theme }) => theme.text} !important;
  }

  a {
    display: inline-block;
    font-size: 0.6em;
    text-transform: uppercase;
    letter-spacing: 0.5em;
    transition: all 0.3s;

    &:hover {
      transform: scale(1.2);
    }
  }

  &::-webkit-scrollbar-track {
    width: 3px;
  }

  .footer-icon {
    svg {
      font-size: 20px;
      color: ${({ theme }) => theme.colors.link};
      transition: all 0.3s;
      transform-origin: 50% 50%;

      &:hover {
        cursor: pointer;
        transform: scale(1.2);
        color: ${({ theme }) => theme.colors.link};
      }
    }
  }
`;
