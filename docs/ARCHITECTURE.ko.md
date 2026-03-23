# bequiet-log 아키텍처 문서

## 프로젝트 개요

Next.js 13 기반 정적 블로그 (morethan-log 포크). **Notion 공식 API** (`@notionhq/client`)를 사용하여 Private Integration Token으로 데이터를 가져옴. 게시글 본문은 Notion 블록 → Markdown 변환 (`notion-to-md`) 후 MDX로 렌더링 (`next-mdx-remote`). Vercel에 배포되며 ISR로 재검증.

## 명령어

```bash
yarn dev          # 로컬 개발 서버
yarn build        # 프로덕션 빌드 (postbuild로 사이트맵 자동 생성)
yarn lint         # ESLint
yarn start        # 프로덕션 빌드 로컬 실행
```

테스트 스위트 없음.

## 아키텍처

### 데이터 흐름

```
Notion DB → databases.query() [src/apis/notion-official/getPosts.ts]
  → filterPosts() (status/type/date 필터링) → React Query prefetch (getStaticProps)
  → 클라이언트 하이드레이션 → usePostsQuery()/usePostQuery() 훅 → 렌더링

상세 페이지:
  prefetchBlockTree() → notion-to-md [src/apis/notion-official/getPostContent.ts]
  → next-mdx-remote serialize (remark-math + rehype-katex + rehype-prism-plus)
  → MDXRemote 렌더링 [src/routes/Detail/components/MdxRenderer/]
```

검색, 태그, 카테고리 필터링은 모두 **클라이언트 사이드**에서 처리 — 런타임 API 호출 없음. ISR로 정적 생성.

### 주요 디렉토리

| 디렉토리 | 설명 |
|----------|------|
| `src/apis/notion-official/` | Notion 공식 API 클라이언트. `getPosts()`로 DB 쿼리 후 `TPost[]` 매핑, `getPostContent()`로 블록을 MDX 변환 |
| `src/libs/` | React Query 클라이언트 설정 (`queryClient.ts`), 유틸 함수 (`filterPosts`, `getAllSelectItemsFromPosts`) |
| `src/routes/Feed/` | 피드 페이지 (3컬럼: 태그 사이드바, 게시글 목록, 프로필 사이드바) |
| `src/routes/Detail/` | 상세 페이지. `PostDetail` (게시글), `PageDetail` (페이지), `MdxRenderer` (MDX 렌더링) |
| `src/routes/Detail/components/MdxRenderer/` | MDX 렌더링 커스텀 컴포넌트: `MermaidBlock`, `Callout`, `pre`/`img` 오버라이드 |
| `src/pages/` | Next.js 페이지. `index.tsx` (Feed), `[slug].tsx` (Detail), `getStaticProps`로 SSG |
| `src/hooks/` | 커스텀 훅: `usePostsQuery`, `usePostQuery`, `useCategoriesQuery`, `useTagsQuery`, `useScheme` |
| `src/components/` | 공통 UI: `MetaConfig` (OG 태그), `Category`, `Tag`, `CommentBox` |
| `src/styles/` | Emotion CSS-in-JS, Radix UI 컬러 팔레트 기반 테마 |

### 스타일링

- Emotion (`@emotion/react`, `@emotion/styled`), tsconfig `jsxImportSource: "@emotion/react"`
- Radix UI 컬러 기반 테마 객체 (`theme.ts`)
- 다크/라이트 모드: `useScheme()` 훅 + 쿠키 저장

### 콘텐츠 타입

| status | 설명 |
|--------|------|
| `Public` | 피드에 표시 |
| `PublicOnDetail` | 직접 URL 접근만 가능 |
| `Private` | 비공개 |

| type | 설명 |
|------|------|
| `Post` | 일반 게시글 (헤더, 푸터, 댓글 포함) |
| `Paper` | 논문/학술 포맷 |
| `Page` | 전체 너비, 게시글 크롬 없음 (이력서 등) |

## 설정

### site.config.js

프로필 정보, 블로그 메타데이터, Notion API 설정, 플러그인 토글 통합 설정 파일.

### 환경변수

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `NOTION_API_KEY` | O | Notion Internal Integration Token |
| `NOTION_DATABASE_ID` | O | Notion 데이터베이스 ID |
| `NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID` | | GA4 |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | | Google Search Console |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | | Naver Search Advisor |
| `NEXT_PUBLIC_UTTERANCES_REPO` | | Utterances 댓글용 GitHub 저장소 |

## Notion 데이터베이스 속성

`getPosts()`는 속성명으로 매핑 (대소문자 모두 시도). 현재 DB는 소문자 사용.

| 속성명 | Notion 타입 | TPost 필드 | 비고 |
|--------|-------------|------------|------|
| `title` | title | `title`, `slug` | Slug 없을 시 title에서 자동 생성 |
| `slug` | rich_text | `slug` | URL 경로 |
| `date` | date | `date.start_date` | 정렬 기준 |
| `status` | select | `status[]` | Public / Private / PublicOnDetail |
| `type` | select | `type[]` | Post / Paper / Page |
| `tags` | multi_select | `tags[]` | |
| `category` | select | `category[]` | |
| `summary` | rich_text | `summary` | |
| `thumbnail` | files | `thumbnail` | 외부 URL 권장 (S3 서명 URL 만료 문제) |

## 성능 최적화

### 블록 병렬 프리페치

`getPostContent()`는 Notion 블록을 가져올 때 `prefetchBlockTree()`로 **전체 블록 트리를 병렬**로 프리페치한 후, `notion-to-md`에 캐시된 결과를 제공:

```
순차 (기존 notion-to-md): 17~23초
병렬 프리페치 (현재):      2~7초
```

### ISR (Incremental Static Regeneration)

- `revalidateTime`: `site.config.js`에서 설정 (현재 8시간)
- 사용자는 항상 캐시된 정적 HTML을 즉시 받음
- Notion API 호출은 백그라운드 재검증 시에만 발생

## 알려진 이슈

### 1. Monkey-patch 동시성 문제 (Critical)

`getPostContent`가 `notion.blocks.children.list`를 런타임에 오버라이드하여 프리페치 캐시를 주입함. 모듈 레벨 싱글턴을 변경하므로 Next.js가 여러 페이지를 동시 빌드할 때 레이스 컨디션 발생 가능.

**해결 방안**: `notion-to-md`를 제거하고 프리페치된 블록 트리에서 직접 Markdown을 생성하는 커스텀 변환기 구현.

### 2. 중복 getPosts() 호출 (Moderate)

`[slug].tsx`의 `getStaticProps`가 매 슬러그마다 `getPosts()`를 호출하여 전체 DB를 쿼리함. 게시글 20개 기준 빌드 시 21회 DB 호출 발생 (`getStaticPaths` 1회 + `getStaticProps` 20회).

### 3. Notion 이미지 URL 만료 (Moderate)

공식 API의 S3 서명 URL은 ~1시간 후 만료. 현재 `revalidateTime`이 8시간이므로 Notion 호스팅 이미지는 재검증 사이에 깨짐.

**해결 방안**:
- 외부 이미지 URL 사용 (가장 간단)
- `revalidateTime`을 45분 이하로 줄임
- 이미지 프록시 API 라우트 추가

## 개발 패턴

- React Query가 모든 데이터의 단일 진실 공급원; 쿼리 키는 `src/constants/queryKey.ts`
- MDX 커스텀 컴포넌트는 `src/routes/Detail/components/MdxRenderer/components.tsx`에서 정의
- `MermaidBlock`은 코드 블록 내용을 props로 받아 렌더링 (DOM 쿼리 방식 아님)
- `filterPosts()`가 공개 범위 결정 — status/type/date 필터 준수
- `PostDetail` 타입은 `mdxSource: MDXRemoteSerializeResult` 포함
