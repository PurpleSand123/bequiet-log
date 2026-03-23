import { NotionToMarkdown } from "notion-to-md"
import { serialize } from "next-mdx-remote/serialize"
import type { MDXRemoteSerializeResult } from "next-mdx-remote"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypePrismPlus from "rehype-prism-plus"
import { notion } from "./client"

const n2m = new NotionToMarkdown({ notionClient: notion })

export const getPostContent = async (
  pageId: string
): Promise<MDXRemoteSerializeResult> => {
  const mdBlocks = await n2m.pageToMarkdown(pageId)
  const mdString = n2m.toMarkdownString(mdBlocks).parent

  const mdxSource = await serialize(mdString, {
    mdxOptions: {
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex, [rehypePrismPlus, { ignoreMissing: true }]],
    },
  })

  return mdxSource
}
