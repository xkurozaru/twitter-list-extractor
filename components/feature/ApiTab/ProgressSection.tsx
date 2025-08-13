import { Box, Heading, Progress, Text, VStack } from "@chakra-ui/react";
import React from "react";

interface ProgressSectionProps {
  loadingMessage: string;
  currentCount: number;
  maxRequests: number;
  currentRequest: number;
  clientWaitTime: number;
}

export const ProgressSection: React.FC<ProgressSectionProps> = ({
  loadingMessage,
  currentCount,
  maxRequests,
  currentRequest,
  clientWaitTime,
}) => {
  return (
    <Box bg="blue.50" p={6} rounded="xl" border="1px" borderColor="blue.200">
      <VStack gap={4}>
        <Heading size="md" color="blue.700" textAlign="center">
          📊 リアルタイム進捗
        </Heading>

        {/* 現在の状況表示 */}
        <VStack gap={3} w="full">
          <Text
            color="blue.700"
            fontWeight="bold"
            fontSize="lg"
            textAlign="center"
          >
            {loadingMessage}
          </Text>

          {/* 取得済み人数 */}
          <Box bg="white" p={4} rounded="lg" w="full" textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
              {currentCount.toLocaleString()}人
            </Text>
            <Text fontSize="sm" color="gray.600">
              取得済みメンバー数
            </Text>
          </Box>

          {/* リクエスト進捗 */}
          <Box bg="white" p={4} rounded="lg" w="full">
            <Text fontSize="sm" color="gray.600" mb={2}>
              API リクエスト進捗
            </Text>
            <Box display="flex" alignItems="center" gap={2}>
              <Progress.Root
                w="full"
                value={(currentRequest / maxRequests) * 100}
                colorPalette="blue"
                striped
                animated
              >
                <Progress.Track>
                  <Progress.Range />
                </Progress.Track>
                <Progress.ValueText fontWeight="semibold">
                  {currentRequest}/{maxRequests}
                </Progress.ValueText>
              </Progress.Root>
            </Box>
          </Box>

          {/* 待機時間表示 */}
          {clientWaitTime > 0 && (
            <Box
              bg="orange.50"
              p={4}
              rounded="lg"
              w="full"
              border="1px"
              borderColor="orange.200"
            >
              <Text fontSize="sm" color="orange.700" fontWeight="bold" mb={1}>
                ⏰ レート制限待機中
              </Text>
              <Text fontSize="sm" color="orange.600">
                残り約 {Math.ceil(clientWaitTime / 1000)} 秒
              </Text>
            </Box>
          )}

          <Text
            color="blue.500"
            fontSize="xs"
            textAlign="center"
            fontStyle="italic"
          >
            大きなリストの場合、100人ごとに15分の待機時間が発生します
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
};
