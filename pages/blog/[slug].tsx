import { useRouter } from "next/router";
import ErrorPage from "next/error";
import { getPosts } from "lib/posts";
import Head from "next/head";
import markdownToHtml from "lib/markdownToHtml";
import { PostTitle, PostHeader, PostBody } from "components/posts";
import { Page } from "components/layout";

export default function Post({ post, morePosts, preview }) {
  const router = useRouter();
  if (!router.isFallback && !post?.slug) {
    return <ErrorPage statusCode={404} />;
  }
  return router.isFallback ? (
    <PostTitle>Loading…</PostTitle>
  ) : (
    <Page>
      <Head>
        <title>{post.title}</title>
        {/* <meta property="og:image" content={post.ogImage.url} /> */}
      </Head>
      <PostHeader
        title={post.title}
        date={post.posted_at}
        author="Justin Tappert"
      />
      <PostBody content={post.content} />
    </Page>
  );
}

export async function getStaticProps({ params }) {
  const posts = await getPosts();
  const post = posts.filter((p) => p.slug === params.slug);
  const content = await markdownToHtml(post[0].content || "");
  return {
    props: {
      post: {
        ...post[0],
        content,
      },
    },
  };
}

export async function getStaticPaths() {
  const posts = await getPosts();

  return {
    paths: posts.map((post) => {
      return {
        params: {
          slug: post.slug,
        },
      };
    }),
    fallback: false,
  };
}
