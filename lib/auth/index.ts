import { parse } from "cookie";
import { verify } from "jsonwebtoken";
import { GetServerSidePropsContext } from "next";

export async function authorized(context: GetServerSidePropsContext) {
  const cookie = parse(context.req.headers.cookie || "");
  let admin = false;
  verify(cookie.auth, process.env.JWT_SECRET, function (err, decoded) {
    if (!err) admin = true;
  });
  return admin;
}
