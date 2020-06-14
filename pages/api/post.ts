import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import { postsDirectory, getAllPosts } from "lib/posts";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, message: "Method Not Allowed" });
  } else {
    const { filename, content } = req.body;
    console.log({ filename, content });

    if (!filename || !content) {
      res
        .status(400)
        .json({ success: false, message: "Missing required parameter" });
    }

    const existingPosts = getAllPosts(["slug"]);
    const postExists = existingPosts
      .map((post) => post.slug)
      .includes(filename);

    if (postExists) {
      res.status(400).json({ success: false, message: "File already exists" });
    }

    fs.writeFile(`${postsDirectory}/${filename}.md`, content, "utf8", (err) => {
      if (err) {
        throw err;
      }
      res
        .status(200)
        .json({ success: true, message: "Successfully uploaded!" });
    });
  }
};
