import fetch from "node-fetch";
import { Blog, Post } from "next-env";

const blogEndpoint = "https://quiet-island-86124.herokuapp.com/blog";

export async function getBlog(): Promise<Blog> {
  const res = await fetch(blogEndpoint);
  const blog = await res.json();
  return blog;
}

export async function getPosts(): Promise<Post[]> {
  const res = await fetch(blogEndpoint);
  const blog = await res.json();
  return blog.posts;
}

export async function getPostSlugs() {
  const res = await fetch(blogEndpoint);
  const blog = await res.json();
  return blog.posts((x) => x.slug);
}
