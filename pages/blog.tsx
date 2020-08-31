import React from "react";
import Link from "next/link";
import { GetStaticProps } from "next";
import styled from "styled-components";
import moment from "moment";
import { getBlog } from "lib/posts";
import { Body } from "components/layout";
import { Layout } from "antd";
import markdownToHtml from "lib/markdownToHtml";
import { PostCard } from "components/posts";

export default function Home(props) {
  const { content, posts } = props;

  return (
    <Layout>
      <Body>
        <h2>ramblings</h2>
        <div dangerouslySetInnerHTML={{ __html: content }} />
        <PostGrid>
          {posts &&
            posts.reverse().map((post) => (
              <PostCard post={post} />
              // <PostCard key={post.id}>
              //   <Link as={`/blog/${post.slug}`} href="/blog/[slug]">
              //     <a className="hover:underline">{post.title}</a>
              //   </Link>
              //   <br />
              //   <p>{post.excerpt}</p>
              //   <small>
              //     Posted at: {moment(post.posted_at).format("M/DD")} at{" "}
              //     {moment(post.posted_at).format("HH:mm")}
              //   </small>
              // </PostCard>
            ))}
        </PostGrid>
      </Body>
    </Layout>
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
