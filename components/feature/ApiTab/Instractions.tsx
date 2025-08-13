import { Box, Heading, Link, Text, VStack } from "@chakra-ui/react";
import React from "react";

export const Instructions: React.FC = () => {
  return (
    <>
      {/* Setup Instructions */}
      <Box bg="blue.50" p={6} rounded="xl" border="1px" borderColor="blue.200">
        <Heading size="md" color="blue.700" mb={4}>
          🔧 Twitter API設定手順
        </Heading>
        <VStack align="start" color="blue.600" gap={2}>
          <Text>
            1.{" "}
            <Link
              href="https://developer.twitter.com/en/portal/dashboard"
              color="blue.800"
            >
              Twitter Developer Portal
            </Link>{" "}
            にアクセス
          </Text>
          <Text>2. Bearer Tokenを取得</Text>
          <Text>3. 下記フォームに必要情報を入力</Text>
        </VStack>
      </Box>

      {/* Warning Alert */}
      <Box
        bg="orange.50"
        p={4}
        rounded="lg"
        border="1px"
        borderColor="orange.200"
      >
        <Text fontWeight="bold" color="orange.700">
          ⚠️ レート制限について:
        </Text>
        <Text color="orange.600">
          Twitter APIには15分間で最大75回のリクエスト制限があります。
          大きなリストの場合、自動的に待機時間を設けて取得を続行します。 "Too
          Many
          Requests"エラーが発生した場合は、15分程度時間をおいてから再試行してください。
        </Text>
      </Box>
    </>
  );
};
