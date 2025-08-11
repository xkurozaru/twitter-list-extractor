import { Toaster } from "@/components/ui/toaster";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider value={defaultSystem}>
      <Toaster />
      <Component {...pageProps} />
    </ChakraProvider>
  );
}
