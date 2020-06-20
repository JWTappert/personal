import React from "react";
import Link from "next/link";
import styled from "styled-components";

export default function Nav({ theme, toggleTheme }) {
  const toggleText = theme === "light" ? "😈" : "😇";
  const links = [
    {
      text: "root",
      href: "/",
    },
    {
      text: "about",
      href: "/about",
    },
    {
      text: "blog",
      href: "/blog",
    },
  ];

  return (
    <NavBar>
      {links.map((link, index) => (
        <Link key={index} href={link.href}>
          <a>{link.text}</a>
        </Link>
      ))}
      <Toggle onClick={toggleTheme}>{toggleText}</Toggle>
    </NavBar>
  );
}

const Toggle = styled.a`
  &:hover {
    text-decoration: none;
    cursor: pointer;
  }
`;
const NavBar = styled.nav`
  background-color: ${({ theme }) => theme.body};
  width: 100vw;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-around;
  padding: 1em;
  margin-bottom: 1em;
`;
