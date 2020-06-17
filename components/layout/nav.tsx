import React, { useState } from "react";
import Link from "next/link";
import styled from "styled-components";

export default function Nav({ theme, toggleTheme }) {
  const toggleText = theme === "light" ? "😈" : "😇";
  const [hover, setHover] = useState(false);

  const links = [
    {
      mainText: "自宅",
      altText: "home",
      href: "/",
    },
    {
      mainText: "ブログ",
      altText: "blog",
      href: "/blog",
    },
  ];

  return (
    <div>
      <NavBar>
        {links.map((link, index) => (
          <Link key={index} href={link.href}>
            <a
              onMouseOver={() => setHover(!hover)}
              onMouseOut={() => setHover(!hover)}
            >
              {hover ? link.altText : link.mainText}
            </a>
          </Link>
        ))}
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
