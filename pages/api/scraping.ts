import { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";
import { ApiResponse, TwitterList } from "../../lib/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<TwitterList[]>>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const { listUrl, maxMembers, username, password } = req.body;

  if (!listUrl) {
    return res.status(400).json({
      success: false,
      error: "リストURLが必要です",
    });
  }

  // URLの妥当性チェック
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(listUrl);
    if (
      !parsedUrl.hostname.includes("twitter.com") &&
      !parsedUrl.hostname.includes("x.com")
    ) {
      throw new Error("Invalid domain");
    }
  } catch {
    return res.status(400).json({
      success: false,
      error: "有効なTwitter/XのURLを入力してください",
    });
  }

  let browser;

  try {
    console.log(`スクレイピング開始: ${listUrl}`);

    // Puppeteerブラウザを起動
    browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === "production",
      executablePath: "/usr/bin/google-chrome-stable",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=VizDisplayCompositor",
        "--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
        "--lang=ja-JP,ja",
      ],
    });

    const page = await browser.newPage();

    // ブラウザ設定
    await page.setViewport({ width: 1280, height: 800 });
    await page.setExtraHTTPHeaders({
      "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.8",
    });

    // ログイン処理
    if (username && password) {
      console.log("認証情報が提供されています。ログインを試行中...");
      try {
        await page.goto("https://x.com/i/flow/login", {
          waitUntil: "networkidle2",
          timeout: 30000,
        });

        await new Promise((resolve) => setTimeout(resolve, 3000));

        // ユーザー名入力（複数のセレクタを試行）
        let usernameInput = null;
        const usernameSelectors = [
          'input[autocomplete="username"]',
          'input[name="text"]',
          'input[data-testid*="username"]',
          'input[type="text"]',
        ];

        for (const selector of usernameSelectors) {
          try {
            usernameInput = await page.waitForSelector(selector, {
              timeout: 3000,
            });
            if (usernameInput) {
              console.log(`ユーザー名入力フィールド発見: ${selector}`);
              break;
            }
          } catch {
            console.log(`ユーザー名セレクタ ${selector} で失敗`);
          }
        }

        if (!usernameInput)
          throw new Error("ユーザー名入力フィールドが見つかりません");
        await usernameInput.type(username, { delay: 100 });

        await new Promise((resolve) => setTimeout(resolve, 2000));

        // 次へボタンをクリック（複数のセレクタを試行）
        let nextButtonClicked = false;
        const nextButtonSelectors = [
          'div[role="button"][data-testid="LoginForm_Login_Button"]',
          'button[data-testid="LoginForm_Login_Button"]',
          'div[role="button"]:has-text("次へ")',
          'div[role="button"]:has-text("Next")',
          'button:has-text("次へ")',
          'button:has-text("Next")',
          '[data-testid*="Login"]:not([disabled])',
          'div[role="button"]',
        ];

        for (const selector of nextButtonSelectors) {
          try {
            const elements = await page.$$(selector);
            for (const element of elements) {
              const text = await page.evaluate(
                (el) => el.textContent?.trim().toLowerCase(),
                element
              );
              if (
                text &&
                (text.includes("次") ||
                  text.includes("next") ||
                  text.includes("続行") ||
                  text.includes("continue"))
              ) {
                await element.click();
                console.log(`次へボタンクリック成功: "${text}"`);
                nextButtonClicked = true;
                break;
              }
            }
            if (nextButtonClicked) break;
          } catch {
            console.log(`Failed with selector ${selector}`);
          }
        }

        if (!nextButtonClicked) {
          console.log("次へボタンが見つからないため、Enterキーを押します");
          await page.keyboard.press("Enter");
        }

        await new Promise((resolve) => setTimeout(resolve, 3000));

        // パスワード入力（複数のセレクタを試行）
        let passwordInput = null;
        const passwordSelectors = [
          'input[name="password"]',
          'input[type="password"]',
          'input[autocomplete="current-password"]',
          'input[data-testid*="password"]',
        ];

        for (const selector of passwordSelectors) {
          try {
            passwordInput = await page.waitForSelector(selector, {
              timeout: 3000,
            });
            if (passwordInput) {
              console.log(`パスワード入力フィールド発見: ${selector}`);
              break;
            }
          } catch {
            console.log(`パスワードセレクタ ${selector} で失敗`);
          }
        }

        if (!passwordInput)
          throw new Error("パスワード入力フィールドが見つかりません");
        await passwordInput.type(password, { delay: 100 });

        // ログインボタンクリック
        try {
          const loginButtons = await page.$$('div[role="button"], button');
          for (const button of loginButtons) {
            const text = await page.evaluate(
              (el) => el.textContent?.trim().toLowerCase(),
              button
            );
            if (
              text &&
              (text.includes("ログイン") ||
                text.includes("log in") ||
                text.includes("login"))
            ) {
              await new Promise((resolve) => setTimeout(resolve, 800));
              await button.click();
              console.log(`ログインボタンクリック成功: "${text}"`);
              break;
            }
          }
        } catch {
          console.log("Enterキーでログイン試行");
          await page.keyboard.press("Enter");
        }

        // ログイン処理の待機
        console.log("ログイン処理を待機中...");
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // ログイン成功確認
        const currentUrl = page.url();
        if (
          currentUrl.includes("/i/flow/login") ||
          currentUrl.includes("/login")
        ) {
          throw new Error("ログインに失敗しました");
        }

        console.log("ログインが完了しました");
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (loginError) {
        console.error("ログインエラー:", loginError);
        return res.status(401).json({
          success: false,
          error: `ログインに失敗しました: ${
            loginError instanceof Error
              ? loginError.message
              : String(loginError)
          }`,
        });
      }
    }

    // リストページに移動
    await page.goto(listUrl, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await new Promise((resolve) => setTimeout(resolve, 5000));

    // リストのメンバーボタンを探してクリック
    console.log("リストページでメンバーボタンを探しています...");

    let membersModalOpened = false;
    try {
      const memberButtonSelectors = [
        'a[href*="/members"]',
        '[data-testid*="member"]',
        'a:has-text("メンバー")',
        'a:has-text("Members")',
        '[aria-label*="メンバー"]',
        '[aria-label*="Members"]',
      ];

      for (const selector of memberButtonSelectors) {
        try {
          const elements = await page.$$(selector);
          for (const element of elements) {
            const text = await page.evaluate(
              (el) => el.textContent?.trim(),
              element
            );
            if (
              text &&
              (text.includes("メンバー") ||
                text.includes("Members") ||
                text.includes("member"))
            ) {
              await element.click();
              console.log(`Clicked member button: ${text}`);
              await new Promise((resolve) => setTimeout(resolve, 2000));
              membersModalOpened = true;
              break;
            }
          }
          if (membersModalOpened) break;
        } catch {
          console.log(`Failed with selector ${selector}`);
        }
      }

      if (!membersModalOpened) {
        await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll("a"));
          const memberLink = links.find(
            (link) =>
              link.textContent?.includes("メンバー") ||
              link.textContent?.includes("Members") ||
              link.href.includes("/members")
          );
          if (memberLink) {
            memberLink.click();
            return true;
          }
          return false;
        });
        await new Promise((resolve) => setTimeout(resolve, 2000));
        membersModalOpened = true;
      }
    } catch {
      console.log("メンバーボタンクリックでエラーが発生しました");
    }

    // メンバー情報を取得
    const allMembers: TwitterList[] = [];

    if (membersModalOpened) {
      console.log("モーダル内でメンバーを取得中...");

      // モーダルが表示されるまで待機
      try {
        await page.waitForSelector('div[role="dialog"]', { timeout: 5000 });
        console.log("モーダルが確認されました");
      } catch {
        console.log("モーダルが見つからないため、ページから取得します");
        membersModalOpened = false;
      }
    }

    if (membersModalOpened) {
      // モーダル内でスクロールしながらすべてのユーザーを取得
      const collectedUsernames = new Set<string>();
      let previousUserCount = 0;
      let stableCount = 0;
      const maxStableIterations = 3;

      while (stableCount < maxStableIterations) {
        // 現在のユーザー数を取得
        const currentUserCells = await page.$$(
          'div[role="dialog"] button[data-testid="UserCell"]'
        );
        const currentUserCount = currentUserCells.length;

        console.log(`モーダル内のユーザー数: ${currentUserCount}`);

        // 現在表示されているユーザー情報を取得
        const currentMembers = await page.evaluate(() => {
          const members: TwitterList[] = [];
          const userCells = document.querySelectorAll(
            'div[role="dialog"] button[data-testid="UserCell"]'
          );

          userCells.forEach((userCell, index) => {
            try {
              let displayName = "";
              let username = "";

              // 表示名を取得
              const nameLinks = userCell.querySelectorAll('a[href^="/"]');
              for (const link of nameLinks) {
                const linkText = link.textContent?.trim() || "";
                if (
                  linkText &&
                  !linkText.startsWith("@") &&
                  linkText.length > 0
                ) {
                  displayName = linkText;
                  break;
                }
              }

              // ユーザー名を取得
              const usernameElements = userCell.querySelectorAll("span");
              for (const span of usernameElements) {
                const text = span.textContent?.trim() || "";
                if (text.startsWith("@") && text.match(/^@[a-zA-Z0-9_]+$/)) {
                  username = text.replace("@", "");
                  break;
                }
              }

              // href属性からユーザー名を抽出
              if (!username) {
                for (const link of nameLinks) {
                  const href = link.getAttribute("href") || "";
                  if (href.startsWith("/") && href.length > 1) {
                    const pathUsername = href.substring(1);
                    if (pathUsername.match(/^[a-zA-Z0-9_]+$/)) {
                      username = pathUsername;
                      break;
                    }
                  }
                }
              }

              if (displayName && username) {
                members.push({
                  id: Date.now() + Math.random() + index,
                  name: displayName,
                  username: username,
                });
              }
            } catch (error) {
              console.error(`Error processing user cell ${index}:`, error);
            }
          });

          return members;
        });

        // 新しいユーザーのみを追加
        const newMembers = currentMembers.filter(
          (member: TwitterList) => !collectedUsernames.has(member.username)
        );
        newMembers.forEach((member: TwitterList) => {
          allMembers.push(member);
          collectedUsernames.add(member.username);
        });

        if (newMembers.length > 0) {
          console.log(
            `新たに ${newMembers.length}人のユーザーを追加。合計: ${allMembers.length}人`
          );
        }

        // ユーザー数が変わらない場合はカウンターを増加
        if (currentUserCount === previousUserCount) {
          stableCount++;
        } else {
          stableCount = 0;
          previousUserCount = currentUserCount;
        }

        // モーダル内でスクロール
        if (currentUserCells.length > 0) {
          const lastUserCell = currentUserCells[currentUserCells.length - 1];
          await lastUserCell.scrollIntoView();

          await page.evaluate(() => {
            const dialog = document.querySelector('div[role="dialog"]');
            if (dialog) {
              const scrollableArea = dialog.querySelector(
                '[data-testid="ScrollSnap-SwipeableView"], [role="presentation"]'
              );
              if (scrollableArea) {
                scrollableArea.scrollTop = scrollableArea.scrollHeight;
              } else {
                dialog.scrollTop = dialog.scrollHeight;
              }
            }
          });

          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      console.log(
        `モーダルから合計 ${allMembers.length}人のメンバーを取得しました`
      );
    } else {
      // ページから直接メンバーを取得（従来の方法）
      console.log("ページから直接メンバーを取得中...");

      let scrollAttempts = 0;
      const maxScrollAttempts = Math.ceil(maxMembers / 20);

      while (
        allMembers.length < maxMembers &&
        scrollAttempts < maxScrollAttempts
      ) {
        console.log(
          `スクロール ${scrollAttempts + 1}回目 - 現在取得数: ${
            allMembers.length
          }人`
        );

        const newMembers = await page.evaluate(() => {
          const members: TwitterList[] = [];
          const userCells = document.querySelectorAll(
            'button[data-testid="UserCell"]'
          );

          userCells.forEach((userCell, index) => {
            try {
              let displayName = "";
              let username = "";

              const nameLinks = userCell.querySelectorAll('a[href^="/"]');
              for (const link of nameLinks) {
                const linkText = link.textContent?.trim() || "";
                if (
                  linkText &&
                  !linkText.startsWith("@") &&
                  linkText.length > 0
                ) {
                  displayName = linkText;
                  break;
                }
              }

              const usernameElements = userCell.querySelectorAll("span");
              for (const span of usernameElements) {
                const text = span.textContent?.trim() || "";
                if (text.startsWith("@") && text.match(/^@[a-zA-Z0-9_]+$/)) {
                  username = text.replace("@", "");
                  break;
                }
              }

              if (!username) {
                for (const link of nameLinks) {
                  const href = link.getAttribute("href") || "";
                  if (href.startsWith("/") && href.length > 1) {
                    const pathUsername = href.substring(1);
                    if (pathUsername.match(/^[a-zA-Z0-9_]+$/)) {
                      username = pathUsername;
                      break;
                    }
                  }
                }
              }

              if (displayName && username) {
                members.push({
                  id: Date.now() + Math.random() + index,
                  name: displayName,
                  username: username,
                });
              }
            } catch (error) {
              console.error(`Error processing user cell ${index}:`, error);
            }
          });

          return members;
        });

        const existingUsernames = new Set(allMembers.map((m) => m.username));
        const uniqueNewMembers = newMembers.filter(
          (m: TwitterList) => !existingUsernames.has(m.username)
        );
        allMembers.push(...uniqueNewMembers);

        console.log(
          `新たに ${uniqueNewMembers.length}人を追加。合計: ${allMembers.length}人`
        );

        // スクロール
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
          const scrollableElements = document.querySelectorAll(
            '[role="main"], [data-testid="primaryColumn"]'
          );
          scrollableElements.forEach((el) => {
            el.scrollTop = el.scrollHeight;
          });
        });

        await new Promise((resolve) => setTimeout(resolve, 3000));
        scrollAttempts++;
      }
    }

    // 最大取得数に制限
    const finalMembers = allMembers.slice(0, maxMembers);

    if (finalMembers.length > 0) {
      console.log(
        `スクレイピング完了: ${finalMembers.length}人のメンバーを取得しました`
      );
      res.status(200).json({
        success: true,
        data: finalMembers,
      });
    } else {
      console.log("メンバーが見つかりませんでした");
      res.status(404).json({
        success: false,
        error:
          "メンバーが見つかりませんでした。リストが非公開またはメンバーがいない可能性があります。",
      });
    }
  } catch (error: unknown) {
    console.error("スクレイピングエラー:", error);
    res.status(500).json({
      success: false,
      error: `スクレイピング中にエラーが発生しました: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
