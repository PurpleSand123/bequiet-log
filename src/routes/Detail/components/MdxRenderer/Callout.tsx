import { FC, ReactNode } from "react"
import styled from "@emotion/styled"

type Props = {
  emoji?: string
  children: ReactNode
}

const Callout: FC<Props> = ({ emoji, children }) => (
  <StyledCallout>
    {emoji && <span className="emoji">{emoji}</span>}
    <div className="content">{children}</div>
  </StyledCallout>
)

export default Callout

const StyledCallout = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 0.5rem;
  background-color: ${({ theme }) => theme.colors.gray3};
  margin: 1rem 0;

  .emoji {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .content {
    flex: 1;
    min-width: 0;
  }
`
