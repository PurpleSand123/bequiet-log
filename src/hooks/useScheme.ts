import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getCookie, setCookie } from "cookies-next"
import { useEffect } from "react"
import { CONFIG } from "site.config"
import { queryKey } from "src/constants/queryKey"
import { SchemeType } from "src/types"

type SetScheme = (scheme: SchemeType) => void

function getInitialScheme(): SchemeType {
  const followsSystemTheme = CONFIG.blog.scheme === "system"
  if (!followsSystemTheme) return CONFIG.blog.scheme as SchemeType
  if (typeof document !== "undefined") {
    const attr = document.documentElement.getAttribute("data-scheme")
    if (attr === "light" || attr === "dark") return attr
  }
  return "light"
}

const useScheme = (): [SchemeType, SetScheme] => {
  const queryClient = useQueryClient()
  const followsSystemTheme = CONFIG.blog.scheme === "system"

  const { data } = useQuery({
    queryKey: queryKey.scheme(),
    enabled: false,
    initialData: getInitialScheme,
  })

  const setScheme = (scheme: SchemeType) => {
    setCookie("scheme", scheme)
    document.documentElement.setAttribute("data-scheme", scheme)
    queryClient.setQueryData(queryKey.scheme(), scheme)
  }

  useEffect(() => {
    if (!window) return

    const cachedScheme = getCookie("scheme") as SchemeType
    const defaultScheme = followsSystemTheme
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : data
    // Defer queryClient.setQueryData past hydration - startTransition doesn't
    // work here because React Query uses useSyncExternalStore which always
    // triggers synchronous re-renders, bypassing transition priority.
    setTimeout(() => {
      setScheme(cachedScheme || defaultScheme)
    }, 0)
  }, [])

  return [data, setScheme]
}

export default useScheme
