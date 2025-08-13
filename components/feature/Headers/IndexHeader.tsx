import { Box, Heading, Text } from "@chakra-ui/react";

export const IndexHeader: React.FC = () => {
  return (
    <Box bg="white" shadow="xl" rounded="2xl" p={8} textAlign="center" w="full">
      <Heading size="2xl" mb={4}>
        🐦 Twitter自動リスト抽出ツール
      </Heading>
      <Text fontSize="lg" color="gray.600">
        Twitterリストメンバーを自動取得し、特定パターンを抽出してスプレッドシート形式で出力
      </Text>
    </Box>
  );
};
