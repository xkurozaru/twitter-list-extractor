import { ApiTab } from "@/components/feature/ApiTab";
import { IndexHeader } from "@/components/feature/Headers";
import { InputTab } from "@/components/feature/InputTab";
import { ScrapingTab } from "@/components/feature/ScrapingTab";
import { toaster } from "@/components/ui/toaster";
import { Box, Container, Tabs, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { extractAndConvertPattern } from "../lib/patternExtractor";
import { ExtractedData, TwitterList } from "../lib/types";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"api" | "scraping" | "input">(
    "api"
  );
  const [inputData, setInputData] = useState("");
  const [processedData, setProcessedData] = useState<ExtractedData[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleDataFetched = (members: TwitterList[]) => {
    console.log("取得したメンバー数:", members.length);

    const inputText = members
      .map((member) => `${member.name} \\ ${member.username}`)
      .join("\n");

    console.log("生成されたinputText:", inputText.substring(0, 200) + "...");

    setInputData(inputText);

    // データ設定後に少し遅延してからタブを切り替え
    setTimeout(() => {
      setActiveTab("input");
      console.log("データ入力タブに切り替えました");
    }, 100);
  };

  const processData = () => {
    if (!inputData.trim()) {
      toaster.create({
        title: "入力エラー",
        description: "データを入力してください",
        type: "error",
        duration: 3000,
      });
      return;
    }

    const lines = inputData.split("\n").filter((line) => line.trim());
    const newProcessedData: ExtractedData[] = [];

    lines.forEach((line) => {
      const parts = line.trim().split(" \\ ");
      if (parts.length >= 2) {
        const displayName = parts[0];
        const profileUrl = `https://x.com/${parts[1]}`;

        const matches = extractAndConvertPattern(displayName);

        // マッチした場合はそれぞれのマッチを追加
        if (matches.length > 0) {
          matches.forEach((match) => {
            newProcessedData.push({
              extracted: match.converted,
              displayName: displayName,
              profileUrl: profileUrl,
              day: match.day,
            });
          });
        }
      }
    });

    setProcessedData(newProcessedData);
    setShowResults(true);
  };

  const clearAll = () => {
    setInputData("");
    setProcessedData([]);
    setShowResults(false);
  };

  return (
    <Box
      minH="100vh"
      bgGradient="to-br"
      gradientFrom="blue.400"
      gradientTo="purple.500"
      py={8}
      px={4}
    >
      <Container maxW="6xl">
        <VStack gap={8}>
          {/* Header */}
          <IndexHeader />

          {/* Main Content */}
          <Box bg="white" shadow="xl" rounded="2xl" p={8} w="full">
            <Tabs.Root
              value={activeTab}
              w="full"
              onValueChange={(e) => setActiveTab(e.value as any)}
            >
              <Tabs.List>
                <Tabs.Trigger value="api">🔑 API取得</Tabs.Trigger>
                <Tabs.Trigger value="scraping">🕷️ スクレイピング</Tabs.Trigger>
                <Tabs.Trigger value="input">✋ データ入力</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="api">
                <ApiTab onDataFetched={handleDataFetched} />
              </Tabs.Content>
              <Tabs.Content value="scraping">
                <ScrapingTab onDataFetched={handleDataFetched} />
              </Tabs.Content>
              <Tabs.Content value="input">
                <InputTab
                  inputData={inputData}
                  onInputChange={setInputData}
                  processData={processData}
                  clearAll={clearAll}
                  showResults={showResults}
                  data={processedData}
                />
              </Tabs.Content>
            </Tabs.Root>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
