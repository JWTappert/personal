import { hash, compare } from "bcrypt";
import jwt from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";

const returnError = (res) =>
  res.status(401).json({ success: false, message: "Unauthorized" });

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const { username, password } = req.body;
    console.log({ username, password });
    let authed = false;

    if (username !== process.env.USERNAME) {
      returnError(res);
      return;
    }

    try {
      const currentPassword = await hash(process.env.PASSWORD, 10);
      console.log({ currentPassword });
      console.log({ password });
      authed = await compare(password, currentPassword);

      if (authed) {
        const token = jwt.sign({ admin: true }, process.env.JWT_SECRET, {
          expiresIn: 60,
        });
        res.status(200).json({ success: true, token });
        return;
      }
    } catch (error) {
      console.error(error);
      returnError(res);
      return;
    }
    returnError(res);
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ success: false, message: "Method Not Allowed" });
  }
};
