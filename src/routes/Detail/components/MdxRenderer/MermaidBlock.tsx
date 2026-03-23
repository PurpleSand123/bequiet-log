import { FC, useEffect, useRef } from "react"
import mermaid from "mermaid"
import DOMPurify from "dompurify"
import useScheme from "src/hooks/useScheme"

type Props = { code: string }

const MermaidBlock: FC<Props> = ({ code }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [scheme] = useScheme()

  useEffect(() => {
    if (!ref.current) return

    mermaid.initialize({
      startOnLoad: false,
      theme: scheme === "dark" ? "dark" : "default",
      securityLevel: "strict",
    })

    const id = `mermaid-${Math.random().toString(36).slice(2)}`
    mermaid
      .render(id, code.trim())
      .then(({ svg }) => {
        if (ref.current) {
          ref.current.innerHTML = DOMPurify.sanitize(svg, {
            USE_PROFILES: { svg: true, svgFilters: true },
          })
        }
      })
      .catch((err) => {
        console.warn("Mermaid render error:", err)
      })
  }, [code, scheme])

  return <div ref={ref} />
}

export default MermaidBlock
