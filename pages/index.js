import Head from "next/head";
import Name from "../components/name/name";
import Nav from "../components/nav/nav";

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>d e r p s t a r r</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Name />
      <Nav />
    </div>
  );
}
