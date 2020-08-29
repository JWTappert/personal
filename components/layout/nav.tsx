import React from "react";
import Link from "next/link";
import { Space, Switch } from "antd";
import { BulbOutlined, BulbFilled } from "@ant-design/icons";

const links = [
  {
    text: "index",
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

export default function Nav({ theme, toggleTheme }) {
  return (
    <>
      <Space size="large">
        {links.map((link, index) => (
          <Link key={index} href={link.href}>
            <a>{link.text}</a>
          </Link>
        ))}
      </Space>
      <Space align="end">
        <Switch
          size="small"
          defaultChecked
          onChange={toggleTheme}
          checkedChildren={<BulbOutlined />}
          unCheckedChildren={<BulbFilled />}
        />
      </Space>
    </>
  );
}
