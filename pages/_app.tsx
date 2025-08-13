import { Toaster } from "@/components/ui/toaster";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import type { AppProps } from "next/app";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>X List Member Extractor</title>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text x=%2250%%22 y=%2250%%22 style=%22dominant-baseline:central;text-anchor:middle;font-size:90px;%22>🐦</text></svg>"
        ></link>
        <meta
          name="description"
          content="Xリストのメンバーを簡単に抽出するツールです。APIとスクレイピングの2つの方法でデータを取得できます。"
        />
      </Head>
      <ChakraProvider value={defaultSystem}>
        <Toaster />
        <Component {...pageProps} />
      </ChakraProvider>
    </>
  );
}
