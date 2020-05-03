import Head from "next/head";
import Link from "next/link";
import Name from "../components/name/name";

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>d e r p s t a r r</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Name />
      <Link href="/experience">
        <a>Experience</a>
      </Link>
    </div>
  );
}
