import React from "react";
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
      <a href="https://github.com/JWTappert">
        <GithubOutlined className="footer-icon" />
      </a>
      <a href="https://twitter.com/tappertwj">
        <TwitterOutlined className="footer-icon" />
      </a>
      <a href="https://linkedin.com/in/tappertj">
        <LinkedinFilled className="footer-icon" />
      </a>
      <a href="mailto:tappertwj@gmail.com">
        <MailOutlined className="footer-icon" />
      </a>
    </Space>
  );
}
