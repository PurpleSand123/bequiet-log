import { NotionToMarkdown } from "notion-to-md"
import { serialize } from "next-mdx-remote/serialize"
import type { MDXRemoteSerializeResult } from "next-mdx-remote"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypePrismPlus from "rehype-prism-plus"
import type {
  BlockObjectResponse,
  ListBlockChildrenResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { notion } from "./client"

const n2m = new NotionToMarkdown({ notionClient: notion })

// --- Parallel block fetching ---

async function listAllChildren(
  blockId: string
): Promise<BlockObjectResponse[]> {
  const blocks: BlockObjectResponse[] = []
  let cursor: string | undefined = undefined

  do {
    const res: ListBlockChildrenResponse =
      await notion.blocks.children.list({
        block_id: blockId,
        start_cursor: cursor,
        page_size: 100,
      })
    for (const b of res.results) {
      if ("type" in b) blocks.push(b as BlockObjectResponse)
    }
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined
  } while (cursor)

  return blocks
}

async function prefetchBlockTree(
  pageId: string
): Promise<Map<string, BlockObjectResponse[]>> {
  const blockMap = new Map<string, BlockObjectResponse[]>()

  async function fetchLevel(parentId: string): Promise<void> {
    const children = await listAllChildren(parentId)
    blockMap.set(parentId, children)

    const withChildren = children.filter((b) => b.has_children)
    if (withChildren.length > 0) {
      await Promise.all(withChildren.map((b) => fetchLevel(b.id)))
    }
  }

  await fetchLevel(pageId)
  return blockMap
}

/**
 * Escape bare angle brackets outside code blocks/inline code so MDX
 * doesn't interpret them as JSX tags (e.g. `<break>`, `<img_token>`).
 * Preserves standard Markdown-safe HTML tags.
 */
function escapeMdxAngleBrackets(md: string): string {
  const lines = md.split("\n")
  let inCodeBlock = false
  const result: string[] = []

  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      inCodeBlock = !inCodeBlock
      result.push(line)
      continue
    }
    if (inCodeBlock) {
      result.push(line)
      continue
    }
    // Replace < with &lt; outside of inline code spans
    // Then restore known safe HTML tags
    result.push(
      line.replace(/`[^`]*`|<(?![!/])/g, (match) => {
        if (match.startsWith("`")) return match
        return "\\<"
      })
    )
  }
  return result.join("\n")
}

// --- Main export ---

export const getPostContent = async (
  pageId: string
): Promise<MDXRemoteSerializeResult> => {
  // Pre-fetch the entire block tree in parallel
  const blockMap = await prefetchBlockTree(pageId)

  // Monkey-patch blocks.children.list to use our prefetched cache
  const originalList = notion.blocks.children.list.bind(notion.blocks.children)
  ;(notion.blocks.children as any).list = async (args: any) => {
    const cached = blockMap.get(args.block_id)
    if (cached) {
      return {
        results: cached,
        has_more: false,
        next_cursor: null,
        type: "block",
        block: {},
      }
    }
    return originalList(args)
  }

  try {
    const mdBlocks = await n2m.pageToMarkdown(pageId)
    const mdString = escapeMdxAngleBrackets(
      n2m.toMarkdownString(mdBlocks).parent
    )

    const mdxSource = await serialize(mdString, {
      mdxOptions: {
        remarkPlugins: [remarkMath],
        rehypePlugins: [
          rehypeKatex,
          [rehypePrismPlus, { ignoreMissing: true }],
        ],
      },
    })

    return mdxSource
  } finally {
    ;(notion.blocks.children as any).list = originalList
  }
}
