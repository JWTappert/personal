import React, { useRef, useState } from "react";
import styled from "styled-components";

export default function Login() {
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

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
    setMessage(JSON.stringify(json));
  }

  return (
    <>
      <Form>
        <Field>
          <Label>Username</Label>
          <Input type="text" placeholder="Username" ref={usernameRef} />
        </Field>
        <Field>
          <Label>Password</Label>
          <Input type="password" placeholder="Username" ref={passwordRef} />
        </Field>
        <Submit onClick={handleSubmit} type="button">
          Login
        </Submit>
      </Form>
      <pre>{message}</pre>
    </>
  );
}

const Submit = styled.button`
  font-size: 1.2em;
  margin-left: 20px;
`;
const Input = styled.input`
  padding: 5px 10px;
`;
const Label = styled.label`
  display: block;
  font-size: 1.2em;
`;
const Field = styled.div`
  margin: 1%;
`;
const Form = styled.form`
  border: solid 1px black;
  padding: 1%;
`;
