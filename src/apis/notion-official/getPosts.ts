import { notion } from "./client"
import { TPosts, TPost } from "src/types"
import type {
  PageObjectResponse,
  QueryDatabaseResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints"

const DATABASE_ID = process.env.NOTION_DATABASE_ID as string

type Properties = PageObjectResponse["properties"]
type PropertyValue = Properties[string]

function getRichTextPlain(prop: PropertyValue): string {
  if (prop.type !== "rich_text") return ""
  return (prop.rich_text as RichTextItemResponse[])
    .map((t) => t.plain_text)
    .join("")
}

function getTitlePlain(prop: PropertyValue): string {
  if (prop.type !== "title") return ""
  return (prop.title as RichTextItemResponse[])
    .map((t) => t.plain_text)
    .join("")
}

function getSelectValue(prop: PropertyValue): string | undefined {
  if (prop.type !== "select" || !prop.select) return undefined
  return prop.select.name
}

function getMultiSelectValues(prop: PropertyValue): string[] {
  if (prop.type !== "multi_select") return []
  return prop.multi_select.map((s) => s.name)
}

function getDateValue(
  prop: PropertyValue
): { start_date: string } | undefined {
  if (prop.type !== "date" || !prop.date) return undefined
  return { start_date: prop.date.start }
}

function getFileUrl(prop: PropertyValue): string | undefined {
  if (prop.type !== "files" || prop.files.length === 0) return undefined
  const file = prop.files[0]
  if (file.type === "file") return file.file.url
  if (file.type === "external") return file.external.url
  return undefined
}

function mapPageToPost(page: PageObjectResponse): TPost {
  const props = page.properties

  const title = getTitlePlain(props["Title"] || props["title"] || props["Name"] || props["name"])
  const slug =
    getRichTextPlain(props["Slug"] || props["slug"]) ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-|-$/g, "")
  const date = getDateValue(props["Date"] || props["date"])
  const status = getSelectValue(props["Status"] || props["status"])
  const type = getSelectValue(props["Type"] || props["type"])
  const tags = getMultiSelectValues(props["Tags"] || props["tags"])
  const category = getSelectValue(props["Category"] || props["category"])
  const summary = getRichTextPlain(props["Summary"] || props["summary"])
  const thumbnail = getFileUrl(props["Thumbnail"] || props["thumbnail"])

  return {
    id: page.id,
    date: date || { start_date: page.created_time },
    type: type ? [type as TPost["type"][0]] : ["Post"],
    slug,
    tags: tags.length > 0 ? tags : [],
    category: category ? [category] : [],
    summary: summary || "",
    author: [],
    title,
    status: status ? [status as TPost["status"][0]] : ["Public"],
    createdTime: new Date(page.created_time).toString(),
    fullWidth: false,
    thumbnail: thumbnail ?? null,
  }
}

// In-memory cache for build time — getPosts() is called 28+ times during
// a single build (getStaticPaths + getStaticProps for every page).
// Cache lives for 5 minutes to cover the entire build duration.
let cachedPosts: TPosts | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000

export const getPosts = async (): Promise<TPosts> => {
  if (cachedPosts && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedPosts
  }

  const posts: TPosts = []
  let hasMore = true
  let cursor: string | undefined = undefined

  while (hasMore) {
    const response: QueryDatabaseResponse = await notion.databases.query({
      database_id: DATABASE_ID,
      start_cursor: cursor,
      sorts: [{ property: "date", direction: "descending" }],
    })

    for (const page of response.results) {
      if (!("properties" in page)) continue
      posts.push(mapPageToPost(page as PageObjectResponse))
    }

    hasMore = response.has_more
    cursor = response.next_cursor ?? undefined
  }

  cachedPosts = posts
  cacheTimestamp = Date.now()
  return posts
}
