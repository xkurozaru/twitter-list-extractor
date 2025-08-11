import { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";
import { ApiResponse, TwitterUser } from "../../lib/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<TwitterUser[]>>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const { listUrl, maxMembers = 100 } = req.body;

  if (!listUrl) {
    return res.status(400).json({
      success: false,
      error: "リストURLが必要です",
    });
  }

  let browser;

  try {
    // Puppeteerでブラウザを起動
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // User-Agentを設定してボット検知を回避
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    // リストページに移動
    await page.goto(listUrl, { waitUntil: "networkidle0", timeout: 30000 });

    // ログインが必要な場合の処理（基本的なチェック）
    const isLoginRequired = (await page.$('a[href="/login"]')) !== null;

    if (isLoginRequired) {
      return res.status(401).json({
        success: false,
        error: "このリストにアクセスするにはログインが必要です",
      });
    }

    // メンバーリストを順次スクロールして取得
    const members: TwitterUser[] = [];
    let previousMemberCount = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 10;

    while (members.length < maxMembers && scrollAttempts < maxScrollAttempts) {
      // メンバーの要素を取得
      const newMembers = await page.evaluate(() => {
        const memberElements = document.querySelectorAll(
          'div[data-testid="UserCell"]'
        );
        const members: Array<{
          displayName: string;
          username: string;
          profileUrl: string;
        }> = [];

        memberElements.forEach((element) => {
          const displayNameEl = element.querySelector('div[dir="ltr"] span');
          const usernameEl = element.querySelector(
            'div[dir="ltr"] span'
          ) as HTMLElement;
          const linkEl = element.querySelector(
            'a[role="link"]'
          ) as HTMLAnchorElement;

          if (displayNameEl && usernameEl && linkEl) {
            const displayName = displayNameEl.textContent?.trim() || "";
            const username = usernameEl.textContent?.trim() || "";
            const profileUrl = linkEl.href || "";

            if (displayName && username && profileUrl) {
              members.push({
                displayName,
                username: username.startsWith("@") ? username : `@${username}`,
                profileUrl,
              });
            }
          }
        });

        return members;
      });

      // 新しいメンバーを追加
      for (const member of newMembers) {
        if (!members.some((m) => m.username === member.username)) {
          members.push(member);
          if (members.length >= maxMembers) break;
        }
      }

      // 進歩がない場合はスクロール
      if (members.length === previousMemberCount) {
        await page.evaluate(() => {
          window.scrollBy(0, 1000);
        });
        await new Promise((resolve) => setTimeout(resolve, 2000));
        scrollAttempts++;
      } else {
        scrollAttempts = 0;
      }

      previousMemberCount = members.length;
    }

    await browser.close();

    if (members.length === 0) {
      return res.status(404).json({
        success: false,
        error:
          "メンバーが見つかりませんでした。リストが非公開またはURLが無効な可能性があります。",
      });
    }

    res.status(200).json({
      success: true,
      data: members.slice(0, maxMembers),
    });
  } catch (error: any) {
    if (browser) {
      await browser.close();
    }

    console.error("Scraping Error:", error);
    res.status(500).json({
      success: false,
      error: `スクレイピングエラー: ${error.message}`,
    });
  }
}
