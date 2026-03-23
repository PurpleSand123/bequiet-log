import { NextApiRequest, NextApiResponse } from "next"
import { getPosts } from "../../apis"

// for all path revalidate, https://<your-site.com>/api/revalidate?secret=<token>
// for specific path revalidate, https://<your-site.com>/api/revalidate?secret=<token>&path=<path>
// example, https://<your-site.com>/api/revalidate?secret=이것은_키&path=feed
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { secret, path } = req.query
  if (secret !== process.env.TOKEN_FOR_REVALIDATE) {
    return res.status(401).json({ message: "Invalid token" })
  }

  try {
    if (path && typeof path === "string") {
      const safePath = path.startsWith("/") ? path : `/${path}`
      if (!/^\/[a-zA-Z0-9\-_\/]+$/.test(safePath)) {
        return res.status(400).json({ message: "Invalid path" })
      }
      await res.revalidate(safePath)
    } else {
      const posts = await getPosts()
      const revalidateRequests = posts.map((row) =>
        res.revalidate(`/${row.slug}`)
      )
      await Promise.all(revalidateRequests)
    }

    res.json({ revalidated: true })
  } catch (err) {
    return res.status(500).send("Error revalidating")
  }
}
