import React from "react";
import { GetStaticProps } from "next";
import styled from "styled-components";
import { getBlog } from "lib/posts";
import { Body } from "components/layout";
import { Layout, Typography } from "antd";
import markdownToHtml from "lib/markdownToHtml";
import { PostCard } from "components/posts";
import moment from "moment";

export default function Home(props) {
  const { content, posts } = props;
  const { Title } = Typography;

  return (
    <Layout>
      <Body>
        <Title level={2}>ramblings</Title>
        <div dangerouslySetInnerHTML={{ __html: content }} />
        <Title level={3}>posts</Title>
        <PostGrid>
          {posts && posts.map((post) => <PostCard key={post.id} post={post} />)}
        </PostGrid>
      </Body>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const blog = await getBlog();
  const descriptionHtml = await markdownToHtml(blog.description || "");
  const posts = blog.posts.sort((a, b) =>
    moment.utc(a.created_at).diff(moment.utc(b.created_at))
  );
  return {
    props: { content: descriptionHtml, posts: posts || [] },
  };
};

const PostGrid = styled.div`
  display: grid;
`;
