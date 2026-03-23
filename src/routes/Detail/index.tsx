import PostDetail from "./PostDetail"
import PageDetail from "./PageDetail"
import styled from "@emotion/styled"
import usePostQuery from "src/hooks/usePostQuery"
import type { MDXRemoteSerializeResult } from "next-mdx-remote"

type Props = {
  mdxSource: MDXRemoteSerializeResult
}

const Detail: React.FC<Props> = ({ mdxSource }) => {
  const data = usePostQuery()

  if (!data) return null
  return (
    <StyledWrapper data-type={data.type}>
      {data.type[0] === "Page" && <PageDetail mdxSource={mdxSource} />}
      {data.type[0] !== "Page" && <PostDetail mdxSource={mdxSource} />}
    </StyledWrapper>
  )
}

export default Detail

const StyledWrapper = styled.div`
  padding: 2rem 0;

  &[data-type="Paper"] {
    padding: 40px 0;
  }
`
