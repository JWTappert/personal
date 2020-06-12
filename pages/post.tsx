import React, { useRef } from "react";
import { GetServerSideProps } from "next";
import { parse } from "cookie";
import { verify } from "jsonwebtoken";
import { useRouter } from "next/router";

export default function Post({ admin }) {
  const router = useRouter();

  if (!admin) router.push("/login");

  return (
    <div>
      <h1>Add a blog post</h1>
      <textarea />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookie = parse(context.req.headers.cookie);
  let admin = false;
  verify(cookie.auth, process.env.JWT_SECRET, function (err, decoded) {
    if (!err) admin = true;
  });

  return {
    props: {
      admin,
    },
  };
};
