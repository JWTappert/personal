import React, { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import styled from "styled-components";
import { authorized } from "lib/auth";
import {
  Container,
  Form,
  FieldSet,
  Label,
  Input,
  Content,
  Submit,
} from "components/forms";

export default function Post({ admin }) {
  const router = useRouter();
  const [filename, setFilename] = useState("");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [postContent, setPostContent] = useState("");

  useEffect(() => {
    if (!admin)
      router.push({
        pathname: "/login",
        query: {
          redirect: "post",
        },
      });
  }, [admin]);

  function handleContentChange({ target }) {
    setPostContent(target.value);
  }

  async function handlePost() {
    const result = `${generateMetaData(title, excerpt)}\n${postContent}`;

    const response = await fetch("/api/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename,
        content: result,
      }),
    });
    const json = await response.json();
    console.log({ json });
  }

  return (
    <PostContainer>
      <h1>Add a blog post</h1>
      <Form>
        <FieldSet>
          <Label>Filename</Label>
          <Input
            type="text"
            placeholder="example-name"
            onChange={({ target }) => setFilename(target.value)}
            value={filename}
          />
        </FieldSet>
        <FieldSet>
          <Label>Title</Label>
          <Input
            type="text"
            placeholder="Title"
            onChange={({ target }) => setTitle(target.value)}
            value={title}
          />
        </FieldSet>
        <FieldSet>
          <Label>Excerpt</Label>
          <Input
            type="text"
            placeholder="Excerpt"
            onChange={({ target }) => setExcerpt(target.value)}
            value={excerpt}
          />
        </FieldSet>
        <FieldSet>
          <Label>Content</Label>
          <Content value={postContent} onChange={handleContentChange} />
        </FieldSet>
        <Submit onClick={handlePost} type="button">
          Post
        </Submit>
      </Form>
    </PostContainer>
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

const generateMetaData = (title: string, excerpt: string): string => {
  const date = new Date().toISOString();
  const metaData = `---
  date: "${date}"
  title: "${title}"
  excerpt: "${excerpt}"
  author:
  name: "Justin Tappert"\n---`;
  return metaData;
};

const PostContainer = styled(Container)`
  width: 95vw;
  height: 60vh;
`;
