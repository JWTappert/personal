import fs from "fs";
import { join } from "path";
import matter from "gray-matter";
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

// export function getPostBySlug(slug, fields = []) {
//   const { data, content } = matter(fileContents);

//   const items = {};

//   // Ensure only the minimal needed data is exposed
//   fields.forEach((field) => {
//     if (field === "slug") {
//       items[field] = realSlug;
//     }
//     if (field === "content") {
//       items[field] = content;
//     }

//     if (data[field]) {
//       items[field] = data[field];
//     }
//   });

//   return items;
// }
