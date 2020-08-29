import { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle`
  *,
  *::after,
  *::before {
    box-sizing: border-box;
  }

  body {
    // background: ${({ theme }) => theme.body};
    // color: ${({ theme }) => theme.text};
    // font-weight: 100;
    font-family: BlinkMacSystemFont, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    letter-spacing: 0.2em;
  }

  a {
    // color: ${({ theme }) => theme.colors.primary};
    // text-decoration: none;
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
