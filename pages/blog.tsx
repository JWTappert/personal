import React from "react";
import Link from "next/link";
import { getPosts } from "lib/posts";
import { GetStaticProps } from "next";

export default function Home(props) {
  const { posts } = props;
  console.log({ posts });
  const { slug, title } = posts[0];

  return (
    <main>
      <h1>Blog</h1>
      <Link as={`/blog/${slug}`} href="/blog/[slug]">
        <a className="hover:underline">{title}</a>
      </Link>
    </main>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const posts = await getPosts();
  return {
    props: { posts },
  };
};
