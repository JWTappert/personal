import React, { useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  Container,
  Form,
  FieldSet,
  Label,
  Input,
  Submit,
} from "components/forms";

export default function Login() {
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [authd, setAuthd] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleSubmit() {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: usernameRef.current?.value,
        password: passwordRef.current?.value,
      }),
    });
    const json = await response.json();
    const { success, message } = json;
    setAuthd(success);
    setMessage(message);

    if (success)
      setTimeout(() => {
        router.push(`/${router.query.redirect}`);
      }, 1000);
  }

  return (
    <Container>
      <h1>{!authd ? "You shall not pass!" : message}</h1>
      <Form>
        <FieldSet>
          <Label>Username</Label>
          <Input type="text" placeholder="Username" ref={usernameRef} />
        </FieldSet>
        <FieldSet>
          <Label>Password</Label>
          <Input type="password" placeholder="Password" ref={passwordRef} />
        </FieldSet>
        <Submit onClick={handleSubmit} type="button">
          Login
        </Submit>
      </Form>
    </Container>
  );
}
