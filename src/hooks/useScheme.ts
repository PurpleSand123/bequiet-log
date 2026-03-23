import { useQuery, useQueryClient } from "@tanstack/react-query"
import { setCookie } from "cookies-next"
import { useEffect } from "react"
import { CONFIG } from "site.config"
import { queryKey } from "src/constants/queryKey"
import { SchemeType } from "src/types"

type SetScheme = (scheme: SchemeType) => void

// On client, read what the blocking script in _document already determined.
// On server, fall back to "dark" — the blocking script corrects before paint.
const getInitialScheme = (): SchemeType => {
  if (typeof document !== "undefined") {
    const attr = document.documentElement.getAttribute("data-scheme")
    if (attr === "dark" || attr === "light") return attr
  }
  return CONFIG.blog.scheme === "system"
    ? "dark"
    : (CONFIG.blog.scheme as SchemeType)
}

const useScheme = (): [SchemeType, SetScheme] => {
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: queryKey.scheme(),
    enabled: false,
    initialData: getInitialScheme(),
  })

  const setScheme = (scheme: SchemeType) => {
    setCookie("scheme", scheme)
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-scheme", scheme)
    }
    queryClient.setQueryData(queryKey.scheme(), scheme)
  }

  // Persist the blocking script's choice to cookie and reveal content
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-scheme")
    if (current === "dark" || current === "light") {
      setCookie("scheme", current)
    }
    // Reveal content now that React has rendered with the correct theme
    document.getElementById("__next")?.classList.add("ready")
  }, [])

  return [data, setScheme]
}

export default useScheme
