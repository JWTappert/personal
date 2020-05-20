import Head from "next/head";
import styled from "styled-components";

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>T a p p e r t</title>
        {/* <link rel="icon" href="/favicon.ico" /> */}
      </Head>
      <main>
        <Container>
          <h1>Hello World!</h1>
        </Container>
      </main>
    </div>
  );
}

const Container = styled.div`
  min-height: 100vh;
  padding: 0 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;
