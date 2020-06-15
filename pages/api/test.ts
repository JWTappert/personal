import { NextApiRequest, NextApiResponse } from "next";
import { getPosts } from "lib/posts";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "GET") {
    const posts = await getPosts();
    res.status(200).json({ posts });
  }
};
