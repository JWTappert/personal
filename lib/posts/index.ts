import fetch from "node-fetch";
import { Post } from "next-env";

const postsEndpoint = "https://quiet-island-86124.herokuapp.com/posts";

export async function getPosts(): Promise<Post[]> {
  const res = await fetch(postsEndpoint);
  const posts = await res.json();
  return posts;
}

export async function getPostSlugs() {
  const res = await fetch(postsEndpoint);
  const posts = await res.json();
  return posts.map((x) => x.slug);
}
