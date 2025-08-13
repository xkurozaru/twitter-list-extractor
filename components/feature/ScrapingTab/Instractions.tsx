import { Box, Text, VStack } from "@chakra-ui/react";
import React from "react";

export const Instructions: React.FC = () => {
  return (
    <Box
      bg="orange.50"
      p={4}
      rounded="xl"
      border="1px"
      borderColor="orange.200"
    >
      <VStack align="start" gap={1}>
        <Text fontWeight="bold" color="orange.700">
          ⚠️ 注意:
        </Text>
        <Text fontSize="sm" color="orange.600">
          スクレイピング機能はTwitterの利用規約に注意して使用してください。
          レート制限やアクセス制限にかかる可能性があります。
        </Text>
        <Text fontSize="sm" color="orange.600" mt={2}>
          <strong>認証について:</strong> Xのリストは現在ログインが必要です。
          認証情報を入力することでアクセス可能になりますが、
          セキュリティ上のリスクを理解の上でご使用ください。
        </Text>
        <Text fontSize="sm" color="red.600" mt={1}>
          <strong>重要:</strong>{" "}
          二段階認証が有効な場合、ログインが失敗する可能性があります。
          一時的に無効にするか、アプリパスワードを使用してください。
        </Text>
      </VStack>
    </Box>
  );
};
