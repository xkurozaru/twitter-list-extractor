import { Box, Heading, Text, Textarea, VStack } from "@chakra-ui/react";
import React from "react";

interface ManualTabProps {
  inputData: string;
  onInputChange: (data: string) => void;
}

export const ManualTab: React.FC<ManualTabProps> = ({
  inputData,
  onInputChange,
}) => {
  return (
    <VStack gap={4} align="stretch" pt={4}>
      <Box bg="gray.50" p={6} rounded="xl">
        <Heading size="md" mb={4}>
          ✋ メンバーデータ手動入力
        </Heading>
        <Text mb={4} color="gray.600">
          各行に「表示名 ユーザー名 プロフィールURL」の形式で入力してください
        </Text>
        <Textarea
          value={inputData}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={`例:
あ01a @user1 https://twitter.com/user1
A-23b 山田太郎 https://twitter.com/yamada
aー45ab @test_user https://twitter.com/test_user`}
          rows={12}
          bg="white"
          fontFamily="mono"
          fontSize="sm"
        />
      </Box>
    </VStack>
  );
};
