import { hash, compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";

const returnError = (res: NextApiResponse) =>
  res.status(401).json({ success: false, message: "Unauthorized" });

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const { username, password } = req.body;

    if (username !== process.env.USERNAME) {
      returnError(res);
      return;
    }

    try {
      const currentPassword = await hash(process.env.PASSWORD, 10);
      const authed = await compare(password, currentPassword);

      if (authed) {
        const claim = { admin: true };
        const token = sign(claim, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.setHeader(
          "Set-Cookie",
          serialize("auth", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== "development",
            sameSite: "strict",
            maxAge: 3600,
            path: "/",
          })
        );

        res
          .status(200)
          .json({ success: true, message: "Welcome back my dude 😎" });
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
