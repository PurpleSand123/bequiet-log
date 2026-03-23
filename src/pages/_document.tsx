import Document, { Html, Head, Main, NextScript } from "next/document"
import { CONFIG } from "site.config"

class MyDocument extends Document {
  render() {
    return (
      <Html lang={CONFIG.lang}>
        <Head>
          <style
            dangerouslySetInnerHTML={{
              __html: `html[data-scheme="dark"]{color-scheme:dark}html[data-scheme="dark"] body{background-color:#191919!important;color:#EDEDEF!important}html[data-scheme="light"]{color-scheme:light}html[data-scheme="light"] body{background-color:#f9f9f9!important;color:#1C2024!important}#__next{opacity:0}#__next.ready{opacity:1}`,
            }}
          />
          <link rel="icon" href="/favicon.ico" />
          <link
            rel="apple-touch-icon"
            sizes="192x192"
            href="/apple-touch-icon.png"
          ></link>
          <link
            rel="alternate"
            type="application/rss+xml"
            title="RSS 2.0"
            href="/feed"
          ></link>
          {/* google search console */}
          {CONFIG.googleSearchConsole.enable === true && (
            <>
              <meta
                name="google-site-verification"
                content={CONFIG.googleSearchConsole.config.siteVerification}
              />
            </>
          )}
          {/* naver search advisor */}
          {CONFIG.naverSearchAdvisor.enable === true && (
            <>
              <meta
                name="naver-site-verification"
                content={CONFIG.naverSearchAdvisor.config.siteVerification}
              />
            </>
          )}
        </Head>
        <body>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var c=document.cookie.match(/(?:^|; )scheme=([^;]*)/);var s=c?c[1]:null;if(!s){s=window.matchMedia&&window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-scheme",s)}catch(e){}}())`,
            }}
          />
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
