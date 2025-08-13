import { Box, Checkbox, Heading, Input, Text, VStack } from "@chakra-ui/react";
import React from "react";

interface RequestFormProps {
  listUrl: string;
  setListUrl: (url: string) => void;
  maxMembers: number;
  setMaxMembers: (count: number) => void;
  username: string;
  setUsername: (name: string) => void;
  password: string;
  setPassword: (pass: string) => void;
  useLogin: boolean;
  setUseLogin: (login: boolean) => void;
}

export const RequestForm: React.FC<RequestFormProps> = ({
  listUrl,
  setListUrl,
  maxMembers,
  setMaxMembers,
  username,
  setUsername,
  password,
  setPassword,
  useLogin,
  setUseLogin,
}) => {
  return (
    <Box bg="gray.50" p={6} rounded="xl">
      <Heading size="md" mb={4}>
        🕷️ スクレイピング設定
      </Heading>

      <VStack gap={4}>
        <Box w="full">
          <Text mb={2} fontWeight="medium">
            リストURL *
          </Text>
          <Input
            type="url"
            value={listUrl}
            onChange={(e) => setListUrl(e.target.value)}
            placeholder="https://x.com/i/lists/1234567890123456789/members"
            bg="white"
          />
        </Box>

        <Box w="full">
          <Text mb={2} fontWeight="medium">
            最大取得数
          </Text>
          <Input
            type="number"
            value={maxMembers}
            onChange={(e) => setMaxMembers(parseInt(e.target.value))}
            min={100}
            max={1000}
            step={100}
            placeholder="100"
            bg="white"
          />
        </Box>

        <Box w="full">
          <Checkbox.Root onCheckedChange={(e) => setUseLogin(!!e.checked)}>
            <Checkbox.HiddenInput />
            <Checkbox.Control colorPalette="blue" />
            <Checkbox.Label>Xアカウントでログインする</Checkbox.Label>
          </Checkbox.Root>
          <Text fontSize="sm" color="gray.600" mt={1}>
            認証情報はスクレイピング処理中のみ使用され、保存されません。
          </Text>
        </Box>

        {useLogin && (
          <>
            <Box w="full">
              <Text mb={2} fontWeight="medium">
                ユーザー名/メールアドレス *
              </Text>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username または email@example.com"
                bg="white"
              />
            </Box>

            <Box w="full">
              <Text mb={2} fontWeight="medium">
                パスワード *
              </Text>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                bg="white"
              />
            </Box>
          </>
        )}
      </VStack>
    </Box>
  );
};
