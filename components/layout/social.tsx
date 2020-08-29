import React from "react";
import Link from "next/link";
import { Space } from "antd";
import {
  GithubOutlined,
  TwitterOutlined,
  LinkedinFilled,
  MailOutlined,
} from "@ant-design/icons";

export default function Social({ theme, toggleTheme }) {
  return (
    <Space size="large">
      <Link href="//github.com/jwtappert">
        <GithubOutlined className="footer-icon" />
      </Link>
      <Link href="//twitter.com/tappertwj">
        <TwitterOutlined className="footer-icon" />
      </Link>
      <Link href="//linkedin.com/in/tappertj">
        <LinkedinFilled className="footer-icon" />
      </Link>
      <Link href="//mailto:tappertwj@gmail.com">
        <MailOutlined className="footer-icon" />
      </Link>
    </Space>
  );
}
