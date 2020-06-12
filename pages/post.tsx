import React, { useEffect } from "react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { authorized } from "lib/auth";

export default function Post({ admin }) {
  const router = useRouter();

  useEffect(() => {
    if (!admin) router.push("/login");
  }, [admin]);

  return (
    <div>
      <h1>Add a blog post</h1>
      <textarea />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  let admin = await authorized(context);

  return {
    props: {
      admin,
    },
  };
};
