import styled from "@emotion/styled"

const NavBar: React.FC = () => {
  const aboutUrl = process.env.NEXT_PUBLIC_ABOUT_URL || "https://yongjun-cho.vercel.app/"

  return (
    <StyledWrapper className="">
      <ul>
        <li>
          <a href={aboutUrl} target="_blank" rel="noopener noreferrer">
            About
          </a>
        </li>
      </ul>
    </StyledWrapper>
  )
}

export default NavBar

const StyledWrapper = styled.div`
  flex-shrink: 0;
  ul {
    display: flex;
    flex-direction: row;
    li {
      display: block;
      margin-left: 1rem;
      color: ${({ theme }) => theme.colors.gray11};
    }
  }
`
