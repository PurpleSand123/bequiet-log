import React from "react"
import styled from "@emotion/styled"
import MdxRenderer from "../components/MdxRenderer"
import type { MDXRemoteSerializeResult } from "next-mdx-remote"

type Props = {
  mdxSource: MDXRemoteSerializeResult
}

const PageDetail: React.FC<Props> = ({ mdxSource }) => {
  return (
    <StyledWrapper>
      <MdxRenderer mdxSource={mdxSource} />
    </StyledWrapper>
  )
}

export default PageDetail

const StyledWrapper = styled.div`
  margin: 0 auto;
  max-width: 56rem;
`
