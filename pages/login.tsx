import React, { useRef, useState } from "react";
import styled from "styled-components";

export default function Login() {
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [authd, setAuthd] = useState(false);
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
    const { success, message } = json;
    setAuthd(success);
    setMessage(message);
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

const Submit = styled.button`
  background-image: linear-gradient(to right, #35c3c1 0%, #00d6b7 100%);
  color: white;
  border: 0;
  border-radius: 5px;
  text-transform: uppercase;
  width: 100%;
  padding: 0.5em;
  font-size: 1.2em;

  &:hover {
    outline: none;
    transition: transform 0.15s ease;
    transform: scale(1.05);
    cursor: pointer;
  }
`;
const Input = styled.input`
  width: 100%;
  padding: 1em;
  border: 1px solid ${({ theme }) => theme.invertText}
  border-radius: 5px;

  &:focus {
    outline: none;
    border: 2px solid #35c3c1;
    border-radius: 5px;
  }
`;
const Label = styled.label`
  color: ${({ theme }) => theme.invertText};
  display: block;
  font-size: 0.6em;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 2%;
`;
const FieldSet = styled.div`
  margin-bottom: 1em;
`;
const Form = styled.form`
  width: 50vw;
  background-color: ${({ theme }) => theme.invertBody};
  border-radius: 20px;
  padding: 2em;
  box-shadow: 0px 56px 72px -30px rgba(50, 55, 63, 0.66);

  @media (max-width: 768px) {
    width: 100%;
  }
`;
const Container = styled.div`
  h1 {
    text-align: center;
  }
`;
