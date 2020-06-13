import React from "react";
import Link from "next/link";
import styled from "styled-components";

export default function Nav({ theme, toggleTheme }) {
  const toggleText = theme === "light" ? "😈" : "😇";
  return (
    <div>
      <NavBar>
        <Link as={""} href="/">
          <a>Home</a>
        </Link>
        <Link as={"blog"} href="/blog">
          <a>Blog</a>
        </Link>
        <Toggle onClick={toggleTheme}>{toggleText}</Toggle>
      </NavBar>
    </div>
  );
}

const Toggle = styled.a`
  &:hover {
    text-decoration: none;
    cursor: pointer;
  }
`;
const NavBar = styled.nav`
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 1em;
`;
