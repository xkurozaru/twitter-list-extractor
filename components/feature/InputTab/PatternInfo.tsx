import { Box, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import React from "react";

export const PatternInfo: React.FC = () => {
  return (
    <Box bg="gray.50" p={6} rounded="xl">
      <Heading size="md" mb={4}>
        🎯 抽出パターン
      </Heading>
      <VStack align="start" gap={4}>
        <Text fontWeight="medium" color="gray.700">
          コミケ配置場所から以下のパターンを抽出します:
        </Text>
        <HStack>
          <Box>
            <Text fontWeight="medium" mb={2} color="blue.600">
              抽出例:
            </Text>
            <Box pl={4} fontSize="sm" color="gray.600">
              <Text>• 西2す-16a → す16a</Text>
              <Text>• 東モ23b → モ23b</Text>
              <Text>• 南&quot;ｓ&quot;05a → s05a</Text>
              <Text>• 7Q-05b → Q05b</Text>
              <Text>• R45b → R45b</Text>
            </Box>
          </Box>

          <Box>
            <Text fontWeight="medium" mb={2} color="purple.600">
              日程変換:
            </Text>
            <Box pl={4} fontSize="sm" color="gray.600">
              <Text>• 土曜、土曜日 → 1日目</Text>
              <Text>• 日曜、日曜日 → 2日目</Text>
              <Text>• 1日目、一日目 → 1日目</Text>
              <Text>• 2日目、二日目 → 2日目</Text>
              <Text>• 両方含む場合 → 両日</Text>
            </Box>
          </Box>
        </HStack>

        <Text fontSize="sm" color="gray.500" fontStyle="italic">
          マッチしない場合は空欄で出力されます。
        </Text>
      </VStack>
    </Box>
  );
};
