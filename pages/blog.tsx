import React from "react";
import Link from "next/link";
import { getPosts } from "lib/posts";
import { GetStaticProps } from "next";
import styled from "styled-components";
import moment from "moment";
import { Page } from "components/layout";

export default function Home(props) {
  const { posts } = props;
  const { slug, title, created_at } = posts[0];

  return (
    <Page>
      <h1>Blog</h1>
      <PostCard>
        <Link as={`/blog/${slug}`} href="/blog/[slug]">
          <a className="hover:underline">{title}</a>
        </Link>
        <br />
        <small>
          Posted at: {moment(created_at).format("M/DD")} at{" "}
          {moment(created_at).format("HH:mm")}
        </small>
      </PostCard>
    </Page>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const posts = await getPosts();
  return {
    props: { posts },
  };
};

const PostCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: 10px;
  padding: 1em;
`;
