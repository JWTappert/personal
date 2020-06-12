import bcrypt from "bcrypt";
import { SuccessHandler, ErrorHandler } from "lib/handlers";

export default async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (req.method === "POST") {
    const { password } = req.body;
    let authed = false;
    try {
      const currentPassword = await bcrypt.hash(process.env.password, 10);
      authed = await bcrypt.compare(password, currentPassword);
      if (authed) {
        return SuccessHandler(res);
      }
    } catch (error) {
      console.error(error);
      return ErrorHandler(res, "Authentication Error");
    }
    return ErrorHandler(res, "Incorrect Password");
  }
  if (req.method === "GET") {
    return ErrorHandler(res, "Unsupported Request");
  }
};
