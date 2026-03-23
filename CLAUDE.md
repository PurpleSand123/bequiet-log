# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Next.js 13 static blog (fork of morethan-log) that uses **Notion as a CMS** via the **official Notion API** (`@notionhq/client`) with a private integration token. Post content is converted from Notion blocks to Markdown (`notion-to-md`) and rendered as MDX (`next-mdx-remote`). Deployed on Vercel with ISR (revalidation interval set in `site.config.js`).

## Commands

```bash
yarn dev          # Local dev server
yarn build        # Production build (also generates sitemap via postbuild)
yarn lint         # ESLint
yarn start        # Serve production build locally
```

No test suite exists.

## Architecture

### Data Flow

```
Notion DB → databases.query() [src/apis/notion-official/getPosts.ts]
  → filterPosts() (status/type/date) → React Query prefetch in getStaticProps
  → Client hydration → usePostsQuery()/usePostQuery() hooks → Render

Detail pages:
  notion-to-md [src/apis/notion-official/getPostContent.ts]
  → next-mdx-remote serialize (remark-math + rehype-katex + rehype-prism-plus)
  → MDXRemote render [src/routes/Detail/components/MdxRenderer/]
```

All filtering (search, tags, categories) is **client-side only** — no runtime API calls. Pages are statically generated with ISR.

### Key Directories

- **`src/apis/notion-official/`** — Official Notion API client (`@notionhq/client`); `getPosts()` queries the database and maps properties to `TPost[]`; `getPostContent()` converts page blocks to serialized MDX
- **`src/libs/`** — React Query client setup (`queryClient.ts`) and utility functions (`filterPosts`, `getAllSelectItemsFromPosts`)
- **`src/routes/`** — Route-level components: `Feed` (post listing with 3-column layout) and `Detail` (single post/page with `MdxRenderer`)
- **`src/routes/Detail/components/MdxRenderer/`** — MDX rendering with custom components: `MermaidBlock` (diagram rendering), `Callout` (styled callout blocks), custom `pre`/`img` overrides
- **`src/pages/`** — Next.js pages; `index.tsx` (Feed) and `[slug].tsx` (Detail) both use `getStaticProps` for SSG
- **`src/hooks/`** — Custom hooks: `usePostsQuery`, `usePostQuery`, `useCategoriesQuery`, `useTagsQuery`, `useScheme` (dark/light theme via cookie)
- **`src/components/`** — Shared UI: `MetaConfig` (OG tags), `Category`, `Tag`, `CommentBox` (Utterances/Cusdis)
- **`src/styles/`** — Emotion CSS-in-JS theming with Radix UI color palettes; `theme.ts` defines the Theme interface

### Styling

Emotion (`@emotion/react`, `@emotion/styled`) with `jsxImportSource: "@emotion/react"` in tsconfig. Theme object provides colors (Radix UI), typography, and z-indexes. Dark/light mode managed by `useScheme()` hook + cookie persistence.

### Content Types

Posts have `status` (Private/Public/PublicOnDetail) and `type` (Post/Paper/Page). Only Public posts appear in the feed; PublicOnDetail are accessible by direct URL. Pages render full-width without post chrome.

## Configuration

**`site.config.js`** — Single config file for profile info, blog metadata, Notion API config, and plugin toggles (Google Analytics, Search Console, Naver Search Advisor, Utterances, Cusdis).

**Environment variables** (set in Vercel):
- `NOTION_API_KEY` (required) — Notion internal integration token
- `NOTION_DATABASE_ID` (required) — Notion database ID
- `NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID` — GA4
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` — Google Search Console
- `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` — Naver Search Advisor
- `NEXT_PUBLIC_UTTERANCES_REPO` — GitHub repo for Utterances comments

**Notion image URL expiry**: The official API returns signed S3 URLs that expire in ~1 hour. If using Notion-hosted images, keep `revalidateTime` under 1 hour or use external image URLs.

## Patterns to Follow

- React Query is the single source of truth for all data; query keys are defined in `src/constants/queryKey.ts`
- `getPosts()` maps Notion database properties by name (Title, Slug, Date, Status, Type, Tags, Category, Summary, Thumbnail) — these must match the actual Notion database column names
- MDX custom components are defined in `src/routes/Detail/components/MdxRenderer/components.tsx` — add new block types there
- `MermaidBlock` is a self-contained component that renders mermaid diagrams from code block content as a prop (not DOM-queried)
- `filterPosts()` is the gatekeeper for what appears publicly — respect status/type/date filters
- `PostDetail` type has `mdxSource: MDXRemoteSerializeResult` for rendered page content
