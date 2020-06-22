import React from "react";
import Link from "next/link";
import { GetStaticProps } from "next";
import styled from "styled-components";
import moment from "moment";
import { getBlog } from "lib/posts";
import { Page, Title, Body } from "components/layout";
import markdownToHtml from "lib/markdownToHtml";

export default function Home(props) {
  const { content, posts } = props;
  const { slug, title, excerpt, posted_at } = posts[0];

  return (
    <Page>
      <Title>
        <h1>/tappert/blog.ts</h1>
      </Title>
      <Body>
        <h2>ramblings</h2>
        <div dangerouslySetInnerHTML={{ __html: content }} />
        <PostGrid>
          <PostCard>
            <Link as={`/blog/${slug}`} href="/blog/[slug]">
              <a className="hover:underline">{title}</a>
            </Link>
            <br />
            <p>{excerpt}</p>
            <small>
              Posted at: {moment(posted_at).format("M/DD")} at{" "}
              {moment(posted_at).format("HH:mm")}
            </small>
          </PostCard>
        </PostGrid>
      </Body>
    </Page>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const blog = await getBlog();
  const descriptionHtml = await markdownToHtml(blog.description || "");
  const posts = blog.posts || [];
  return {
    props: { content: descriptionHtml, posts },
  };
};

const PostGrid = styled.div`
  display: grid;
`;

const PostCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: 10px;
  padding: 1em;
`;
