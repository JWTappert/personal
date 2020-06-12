import React from "react";
import Head from "next/head";
import styled from "styled-components";
import Link from "next/link";
import { getAllPosts } from "../lib/posts";

export default function Home({ allPosts }) {
  const { slug, title } = allPosts[0];
  const morePosts = allPosts.slice(1);

  return (
    <div>
      <Head>
        <title>T a p p e r t</title>
        {/* <link rel="icon" href="/favicon.ico" /> */}
      </Head>
      <main>
        <Container>
          <h1>Hello World!</h1>
          <Link as={`/blog/${slug}`} href="/blog/[slug]">
            <a className="hover:underline">{title}</a>
          </Link>
        </Container>
      </main>
    </div>
  );
}

export async function getStaticProps() {
  const allPosts = getAllPosts([
    "title",
    "date",
    "slug",
    "author",
    "coverImage",
    "excerpt",
  ]);

  return {
    props: { allPosts },
  };
}

const Container = styled.div`
  min-height: 100vh;
  padding: 0 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;
