import { FC } from "react"
import { MDXRemote } from "next-mdx-remote"
import type { MDXRemoteSerializeResult } from "next-mdx-remote"
import styled from "@emotion/styled"
import { mdxComponents } from "./components"

import "katex/dist/katex.min.css"
import "prismjs/themes/prism-tomorrow.css"

type Props = {
  mdxSource: MDXRemoteSerializeResult
}

const MdxRenderer: FC<Props> = ({ mdxSource }) => {
  return (
    <StyledWrapper>
      <MDXRemote {...mdxSource} components={mdxComponents} />
    </StyledWrapper>
  )
}

export default MdxRenderer

const StyledWrapper = styled.div`
  line-height: 1.8;
  font-size: 1rem;
  overflow-wrap: break-word;
  word-break: break-word;
  max-width: 100%;
  overflow-x: hidden;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
  }

  h1 {
    font-size: 1.875rem;
  }
  h2 {
    font-size: 1.5rem;
  }
  h3 {
    font-size: 1.25rem;
  }

  p {
    margin: 0.75em 0;
  }

  ul,
  ol {
    padding-left: 1.5em;
    margin: 0.75em 0;
  }

  li {
    margin: 0.25em 0;
  }

  blockquote {
    border-left: 3px solid ${({ theme }) => theme.colors.gray8};
    padding-left: 1em;
    margin: 1em 0;
    color: ${({ theme }) => theme.colors.gray11};
  }

  pre {
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin: 1em 0;
    font-size: 0.875rem;
  }

  code {
    font-family: "Fira Code", "Consolas", monospace;
    font-size: 0.875em;
  }

  :not(pre) > code {
    background-color: ${({ theme }) => theme.colors.gray4};
    padding: 0.15em 0.4em;
    border-radius: 0.25rem;
  }

  img {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin: 1em 0;
  }

  table {
    display: block;
    width: 100%;
    overflow-x: auto;
    border-collapse: collapse;
    margin: 1em 0;
  }

  th,
  td {
    border: 1px solid ${({ theme }) => theme.colors.gray6};
    padding: 0.5em 0.75em;
    text-align: left;
  }

  th {
    background-color: ${({ theme }) => theme.colors.gray3};
    font-weight: 600;
  }

  hr {
    border: none;
    border-top: 1px solid ${({ theme }) => theme.colors.gray6};
    margin: 2em 0;
  }

  a {
    color: ${({ theme }) => theme.colors.gray12};
    text-decoration: underline;
  }
`
