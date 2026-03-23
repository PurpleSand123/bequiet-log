import React from "react"
import type { MDXComponents } from "mdx/types"
import MermaidBlock from "./MermaidBlock"
import Callout from "./Callout"

export const mdxComponents: MDXComponents = {
  pre: (props: React.ComponentPropsWithoutRef<"pre">) => {
    const child = props.children as React.ReactElement
    if (
      React.isValidElement(child) &&
      (child.props as any)?.className === "language-mermaid"
    ) {
      return <MermaidBlock code={(child.props as any).children as string} />
    }
    return <pre {...props} />
  },
  img: (props: React.ComponentPropsWithoutRef<"img">) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={props.src || ""}
      alt={props.alt || ""}
      loading="lazy"
      decoding="async"
      style={{ maxWidth: "100%", height: "auto" }}
    />
  ),
  Callout,
}
