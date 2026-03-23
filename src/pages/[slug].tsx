import Detail from "src/routes/Detail"
import { filterPosts } from "src/libs/utils/notion"
import { CONFIG } from "site.config"
import { NextPageWithLayout } from "../types"
import CustomError from "src/routes/Error"
import { getPostContent, getPosts } from "src/apis"
import MetaConfig from "src/components/MetaConfig"
import { GetStaticProps } from "next"
import { queryClient } from "src/libs/react-query"
import { queryKey } from "src/constants/queryKey"
import { dehydrate } from "@tanstack/react-query"
import { FilterPostsOptions } from "src/libs/utils/notion/filterPosts"
import { TPost } from "src/types"
import type { MDXRemoteSerializeResult } from "next-mdx-remote"

const filter: FilterPostsOptions = {
  acceptStatus: ["Public", "PublicOnDetail"],
  acceptType: ["Paper", "Post", "Page"],
}

export const getStaticPaths = async () => {
  const posts = await getPosts()
  const filteredPost = filterPosts(posts, filter)

  return {
    paths: filteredPost.map((row) => `/${row.slug}`),
    fallback: true,
  }
}

type DetailPageProps = {
  post: TPost
  mdxSource: MDXRemoteSerializeResult
}

export const getStaticProps: GetStaticProps<DetailPageProps> = async (context) => {
  const slug = context.params?.slug

  const posts = await getPosts()
  const detailPosts = filterPosts(posts, filter)
  const postDetail = detailPosts.find((t: any) => t.slug === slug)

  if (!postDetail) {
    return {
      notFound: true,
      revalidate: CONFIG.revalidateTime,
    }
  }

  const mdxSource = await getPostContent(postDetail.id)

  // Only put post metadata in React Query (small), not mdxSource (large)
  await queryClient.prefetchQuery(queryKey.post(`${slug}`), () => postDetail)

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      post: postDetail,
      mdxSource,
    },
    revalidate: CONFIG.revalidateTime,
  }
}

const DetailPage: NextPageWithLayout<DetailPageProps> = ({ post, mdxSource }) => {
  if (!post) return <CustomError />

  const image = CONFIG.ogImageGenerateURL
    ? `${CONFIG.ogImageGenerateURL}/${encodeURIComponent(post.title)}.png`
    : post.thumbnail || undefined

  const date = post.date?.start_date || post.createdTime || ""

  const meta = {
    title: post.title,
    date: new Date(date).toISOString(),
    image: image,
    description: post.summary || "",
    type: post.type[0],
    url: `${CONFIG.link}/${post.slug}`,
  }

  return (
    <>
      <MetaConfig {...meta} />
      <Detail mdxSource={mdxSource} />
    </>
  )
}

DetailPage.getLayout = (page) => {
  return <>{page}</>
}

export default DetailPage
