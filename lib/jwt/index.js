import jwt from "jsonwebtoken";

export function Authorized({ headers }) {
  const token = headers.authorization.slice(7);
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error(error.message);
  }
}
