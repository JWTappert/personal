import { useRouter } from "next/router";
import ErrorPage from "next/error";
import { getPosts } from "lib/posts";
import Head from "next/head";
import markdownToHtml from "../../lib/markdownToHtml";
import { PostTitle, PostHeader, PostBody } from "components/posts";

export default function Post({ post, morePosts, preview }) {
  const router = useRouter();
  if (!router.isFallback && !post?.slug) {
    return <ErrorPage statusCode={404} />;
  }
  return router.isFallback ? (
    <PostTitle>Loading…</PostTitle>
  ) : (
    <>
      <article>
        <Head>
          <title>{post.title}</title>
          {/* <meta property="og:image" content={post.ogImage.url} /> */}
        </Head>
        <PostHeader
          title={post.title}
          coverImage={post.coverImage}
          date={post.date}
          author={post.author}
        />
        <PostBody content={post.content} />
      </article>
    </>
  );
}

export async function getStaticProps({ params }) {
  const post = getPostBySlug(params.slug, [
    "title",
    "date",
    "slug",
    "author",
    "content",
    "ogImage",
    "coverImage",
  ]);
  const content = await markdownToHtml(post.content || "");

  return {
    props: {
      post: {
        ...post,
        content,
      },
    },
  };
}

export async function getStaticPaths() {
  const posts = getPosts();

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
