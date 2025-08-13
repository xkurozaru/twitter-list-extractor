import {
  Box,
  createListCollection,
  Heading,
  Input,
  Portal,
  Select,
  Text,
  VStack,
} from "@chakra-ui/react";
import React from "react";

interface RequestFormProps {
  bearerToken: string;
  setBearerToken: (value: string) => void;
  listId: string;
  setListId: (value: string) => void;
  maxRequests: number;
  setMaxRequests: (value: number) => void;
}

export const RequestForm: React.FC<RequestFormProps> = ({
  bearerToken,
  setBearerToken,
  listId,
  setListId,
  maxRequests,
  setMaxRequests,
}) => {
  return (
    <Box bg="gray.50" p={6} rounded="xl">
      <Heading size="md" mb={4}>
        🔑 API認証情報
      </Heading>
      <VStack gap={4}>
        <Box w="full">
          <Text fontWeight="semibold" mb={2}>
            Bearer Token *
          </Text>
          <Input
            type="text"
            value={bearerToken}
            onChange={(e) => setBearerToken(e.target.value)}
            placeholder="AAAAAAAAAAAAAAAAAAAAAMLheAAAAAAA0%2BuSeid..."
            bg="white"
          />
        </Box>

        <Box w="full">
          <Text fontWeight="semibold" mb={2}>
            リストID *
          </Text>
          <Input
            type="text"
            value={listId}
            onChange={(e) => setListId(e.target.value)}
            placeholder="1234567890123456789"
            bg="white"
          />
          <Text fontSize="sm" color="gray.600" mt={2}>
            リストURLの数字部分: https://x.com/i/lists/
            <Text as="span" fontWeight="bold">
              1234567890123456789
            </Text>
          </Text>
        </Box>

        <Box w="full">
          <Select.Root
            collection={maxRequestsOptions}
            width="100%"
            value={[maxRequests.toString()]}
            onValueChange={(e) => setMaxRequests(parseInt(e.items[0].value))}
          >
            <Select.HiddenSelect />
            <Select.Label fontWeight="semibold" mb={2}>
              最大リクエスト数 (レート制限対策)
            </Select.Label>
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="選択してください" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {maxRequestsOptions.items.map((option) => (
                    <Select.Item item={option} key={option.value}>
                      {option.label}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
          <Text fontSize="sm" color="gray.600" mt={2}>
            レート制限を避けるため、少ない値から始めることをお勧めします
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

const maxRequestsOptions = createListCollection({
  items: [
    { value: "5", label: "5回 (最大500人) - 最も安全" },
    { value: "10", label: "10回 (最大1000人) - 安全" },
    { value: "15", label: "15回 (最大1500人) - 推奨" },
    { value: "25", label: "25回 (最大2500人) - 中程度" },
    { value: "50", label: "50回 (最大5000人) - 上級者向け" },
  ],
});
