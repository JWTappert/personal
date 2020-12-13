import React from "react";
import { useRouter } from "next/router";
import { Card, Avatar } from "antd";
import styled from "styled-components";
const { Meta } = Card;

export default function PostCard({ post }) {
  const router = useRouter();
  const { slug, title, excerpt } = post;
  return (
    <ThemedCard
      hoverable
      style={{ width: "100%", marginBottom: "1em" }}
      onClick={() => router.push(`/blog/${slug}`)}
    >
      <Meta
        avatar={
          <Avatar src="https://www.gravatar.com/avatar/b8b3d12b237f568c79b0a9f8914d20dd" />
        }
        title={title}
        description={excerpt}
      />
    </ThemedCard>
  );
}

const ThemedCard = styled(Card)`
  background: ${({ theme }) => theme.body} !important;
  & .ant-card-meta-title, .ant-card-meta-description {
    color: ${({ theme }) => theme.text} !important;
  }
`;
