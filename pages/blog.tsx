import React from "react";
import Link from "next/link";
import { getAllPosts } from "lib/posts";
import { GetStaticProps } from "next";

export default function Home(props) {
  const { allPosts } = props;
  const { slug, title } = allPosts[0];
  const morePosts = allPosts.slice(1);

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
};
