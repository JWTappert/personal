import React from "react";
import { useRouter } from "next/router";
import { Card, Avatar } from "antd";
const { Meta } = Card;

export default function PostCard({ post }) {
  const router = useRouter();
  const { slug, title, excerpt } = post;
  return (
    <Card
      hoverable
      style={{ width: "100%" }}
      onClick={() => router.push(`/blog/${slug}`)}
    >
      <Meta
        avatar={
          <Avatar src="https://www.gravatar.com/avatar/b8b3d12b237f568c79b0a9f8914d20dd" />
        }
        title={title}
        description={excerpt}
      />
    </Card>
  );
}
