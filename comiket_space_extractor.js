/**
 * X (Twitter) リストメンバー コミケスペース抽出スクリプト
 * ============================================================
 *
 * 【使い方】
 *   1. X にログインした状態で、対象リストの「メンバー」ページを開く
 *   2. Chrome で F12 → Console
 *   3. このスクリプト全文を貼り付けて Enter
 *   4. 自動スクロール → 全ユーザー収集 → スペース抽出 → CSVダウンロード
 *
 * 【停止】
 *   window.__stopComiketScrape = true
 *
 * ============================================================
 */

(async function () {
  'use strict';

  // ============================================================
  // 設定
  // ============================================================

  const SCROLL_DELAY_MS = 1000;
  const MAX_NO_NEW_ROUNDS = 3;
  const MAX_TOTAL_ROUNDS = 500;

  /*
   * ==========================================================
   * 曜日 → 日程
   * ==========================================================
   *
   * ここだけ変更すれば曜日と日程の対応を変更できる。
   *
   * 現在:
   *
   *   金曜日 → 1日目
   *   土曜日 → 1日目
   *   日曜日 → 2日目
   *
   * 例:
   *
   *   金曜日 → 1日目
   *   土曜日 → 2日目
   *   日曜日 → 3日目
   *
   * にするなら:
   *
   *   const DAY_TO_SESSION = {
   *     金: 1,
   *     土: 2,
   *     日: 3,
   *   };
   */
  const DAY_TO_SESSION = {
    土: 1,
    日: 2,
  };

  /*
   * 明示的な「1日目」「2日目」等。
   */
  const EXPLICIT_DAY_TO_SESSION = {
    '1日目': 1,
    '一日目': 1,
    '１日目': 1,

    '2日目': 2,
    '二日目': 2,
    '２日目': 2,

    '3日目': 3,
    '三日目': 3,
    '３日目': 3,
  };

  /*
   * スペースが解析できなかった場合の
   * 「要確認」判定にだけ使用する。
   */
  const KEYWORD_HINTS = [
    'コミケ',
    'コミックマーケット',
    'comiket',
    'C108',
  ];

  window.__stopComiketScrape = false;

  const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  try {
    // ============================================================
    // 1. ユーザー収集
    // ============================================================

    const usersMap = new Map();

    function normalizeDomText(text) {
      return String(text || '')
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function escapeRegExp(text) {
      return String(text).replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );
    }

    // ------------------------------------------------------------
    // handle
    // ------------------------------------------------------------

    function extractHandle(cell) {
      const links =
        cell.querySelectorAll('a[href]');

      for (const link of links) {
        const href =
          link.getAttribute('href');

        if (!href) {
          continue;
        }

        const match =
          href.match(
            /^\/([A-Za-z0-9_]{1,15})$/
          );

        if (match) {
          return match[1];
        }
      }

      /*
       * fallback
       */
      const text =
        cell.innerText || '';

      const match =
        text.match(
          /@([A-Za-z0-9_]{1,15})/
        );

      return match
        ? match[1]
        : '';
    }

    // ------------------------------------------------------------
    // 表示名
    // ------------------------------------------------------------

    function extractName(
      cell,
      handle
    ) {
      const links =
        Array.from(
          cell.querySelectorAll(
            'a[href]'
          )
        ).filter(
          (link) =>
            link.getAttribute('href') ===
            `/${handle}`
        );

      /*
       * /handle のリンクは
       *
       *   表示名
       *   @handle
       *
       * の2つあるので、@handleだけのものを除外。
       */
      for (const link of links) {
        const text =
          normalizeDomText(
            link.innerText
          );

        if (!text) {
          continue;
        }

        if (
          text ===
          `@${handle}`
        ) {
          continue;
        }

        return text;
      }

      /*
       * fallback
       */
      const userName =
        cell.querySelector(
          '[data-testid="User-Name"]'
        );

      if (userName) {
        const text =
          normalizeDomText(
            userName.innerText
          );

        if (text) {
          return text
            .replace(
              new RegExp(
                escapeRegExp(
                  `@${handle}`
                ),
                'g'
              ),
              ''
            )
            .trim();
        }
      }

      return '';
    }

    // ------------------------------------------------------------
    // BIO
    // ------------------------------------------------------------

    function extractBio(cell) {
      /*
       * 提示されたDOMではBIOは
       *
       * <div dir="auto">
       *
       * に存在する。
       *
       * 「削除」ボタンはbutton内部なので除外。
       */
      const candidates =
        Array.from(
          cell.querySelectorAll(
            'div[dir="auto"]'
          )
        ).filter(
          (element) => {
            if (
              element.closest('button')
            ) {
              return false;
            }

            if (
              element.closest('a')
            ) {
              return false;
            }

            const text =
              normalizeDomText(
                element.innerText
              );

            if (!text) {
              return false;
            }

            const UI_TEXTS = new Set([
              '削除',
              'Remove',

              'フォロー',
              'フォロー中',
              'フォローする',
              'フォローバック',

              'Follow',
              'Following',
              'Follows you',

              'あなたをフォロー中',
            ]);

            return !UI_TEXTS.has(text);
          }
        );

      candidates.sort(
        (a, b) =>
          normalizeDomText(
            b.innerText
          ).length -
          normalizeDomText(
            a.innerText
          ).length
      );

      if (
        candidates.length === 0
      ) {
        return '';
      }

      return normalizeDomText(
        candidates[0].innerText
      );
    }

    // ------------------------------------------------------------
    // UserCell
    // ------------------------------------------------------------

    function parseUserCell(cell) {
      const handle =
        extractHandle(cell);

      if (!handle) {
        return null;
      }

      return {
        handle,

        name:
          extractName(
            cell,
            handle
          ),

        bio:
          extractBio(cell),
      };
    }

    // ------------------------------------------------------------
    // UserCell収集
    // ------------------------------------------------------------

    function collectVisibleCells() {
      const cells =
        document.querySelectorAll(
          '[data-testid="UserCell"]'
        );

      let added = 0;

      cells.forEach((cell) => {
        const parsed =
          parseUserCell(cell);

        if (!parsed) {
          return;
        }

        const existing =
          usersMap.get(
            parsed.handle
          );

        if (!existing) {
          usersMap.set(
            parsed.handle,
            parsed
          );

          added++;
          return;
        }

        /*
         * 仮想スクロールで同一ユーザーが
         * 再生成された場合は情報量の多い方を保持。
         */
        usersMap.set(
          parsed.handle,
          {
            handle:
              parsed.handle,

            name:
              parsed.name.length >=
              existing.name.length
                ? parsed.name
                : existing.name,

            bio:
              parsed.bio.length >=
              existing.bio.length
                ? parsed.bio
                : existing.bio,
          }
        );
      });

      return {
        visibleCount:
          cells.length,

        added,
      };
    }

    // ============================================================
    // 2. スクロール
    // ============================================================

    async function waitForFirstCell(
      timeoutMs = 10000
    ) {
      const start =
        Date.now();

      while (
        Date.now() - start <
        timeoutMs
      ) {
        if (
          document.querySelector(
            '[data-testid="UserCell"]'
          )
        ) {
          return true;
        }

        await sleep(300);
      }

      return false;
    }

    function findScrollContainer() {
      const cell =
        document.querySelector(
          '[data-testid="UserCell"]'
        );

      if (!cell) {
        return window;
      }

      let el =
        cell.parentElement;

      while (
        el &&
        el !== document.documentElement
      ) {
        const style =
          window.getComputedStyle(el);

        const canScroll =
          style.overflowY === 'auto' ||
          style.overflowY === 'scroll';

        if (
          canScroll &&
          el.scrollHeight >
            el.clientHeight + 10
        ) {
          return el;
        }

        el =
          el.parentElement;
      }

      return window;
    }

    function getScrollMetrics(
      container
    ) {
      if (
        container === window
      ) {
        return {
          scrollTop:
            window.scrollY,

          scrollHeight:
            Math.max(
              document.documentElement
                .scrollHeight,
              document.body?.scrollHeight ||
                0
            ),

          clientHeight:
            window.innerHeight,
        };
      }

      return {
        scrollTop:
          container.scrollTop,

        scrollHeight:
          container.scrollHeight,

        clientHeight:
          container.clientHeight,
      };
    }

    function scrollToBottom(
      container
    ) {
      if (
        container === window
      ) {
        window.scrollTo(
          0,
          document.documentElement
            .scrollHeight
        );
      } else {
        container.scrollTop =
          container.scrollHeight;
      }
    }

    console.log(
      '[ComiketExtract] 自動スクロール開始…'
    );

    const foundCell =
      await waitForFirstCell();

    if (!foundCell) {
      console.warn(
        '[ComiketExtract] UserCellが見つかりません。「メンバー」タブのページを開いているか確認してください。'
      );

      return;
    }

    const scrollContainer =
      findScrollContainer();

    console.log(
      '[ComiketExtract] スクロール対象:',
      scrollContainer === window
        ? 'window（ページ全体）'
        : scrollContainer
    );

    collectVisibleCells();

    let lastUserCount =
      usersMap.size;

    let lastScrollHeight =
      getScrollMetrics(
        scrollContainer
      ).scrollHeight;

    let noNewRounds = 0;
    let totalRounds = 0;

    while (
      noNewRounds <
        MAX_NO_NEW_ROUNDS &&
      totalRounds <
        MAX_TOTAL_ROUNDS &&
      !window.__stopComiketScrape
    ) {
      scrollToBottom(
        scrollContainer
      );

      await sleep(
        SCROLL_DELAY_MS
      );

      collectVisibleCells();

      totalRounds++;

      const {
        scrollHeight,
      } =
        getScrollMetrics(
          scrollContainer
        );

      const grew =
        scrollHeight >
        lastScrollHeight + 2;

      const gainedUsers =
        usersMap.size >
        lastUserCount;

      if (
        grew ||
        gainedUsers
      ) {
        noNewRounds = 0;

        lastScrollHeight =
          scrollHeight;

        lastUserCount =
          usersMap.size;

        console.log(
          `[ComiketExtract] 収集中… ${usersMap.size}人`
        );
      } else {
        noNewRounds++;
      }
    }

    collectVisibleCells();

    console.log(
      `[ComiketExtract] スクロール完了。合計 ${usersMap.size}人のメンバーを取得しました。`
    );

    // ============================================================
    // 3. スペース抽出
    // ============================================================

    function normalizeText(text) {
      return String(text || '')
        .normalize('NFKC')

        /*
         * 漢数字
         */
        .replace(/一/g, '1')
        .replace(/二/g, '2')
        .replace(/三/g, '3')
        .replace(/四/g, '4')
        .replace(/五/g, '5')
        .replace(/六/g, '6')
        .replace(/七/g, '7')
        .replace(/八/g, '8')

        /*
         * ダッシュ類
         */
        .replace(
          /[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\u30FC\uFF0D]/g,
          '-'
        )

        /*
         * 引用符
         */
        .replace(
          /[\u2018\u2019\u201C\u201D\u300C\u300D\u300E\u300F]/g,
          '"'
        )

        /*
         * slash
         */
        .replace(
          /／/g,
          '/'
        )

        /*
         * 空白
         */
        .replace(
          /\s+/g,
          ' '
        )

        .trim();
    }

    // ============================================================
    // 日程
    // ============================================================

    /*
     * 日程マーカー。
     *
     * 対応:
     *
     *   1日目
     *   一日目
     *   2日目
     *   二日目
     *   金曜日
     *   土曜日
     *   日曜日
     *   金曜
     *   土曜
     *   日曜
     *   (土)
     *   （土）
     *
     * 「金」「土」「日」の単独文字はここでは拾わない。
     * 文章中の通常文字を誤認するため。
     */
    const DAY_MARKER_REGEX =
      /(?:[（(]\s*)?(?:1日目|2日目|3日目|一日目|二日目|三日目|金曜日|土曜日|日曜日|金曜|土曜|日曜|[金土日])(?:\s*[）)])?/g;

    function parseDayMarker(marker) {
      const normalized =
        marker
          .replace(
            /[（）()]/g,
            ''
          )
          .trim();

      /*
       * 明示的日程
       */
      if (
        EXPLICIT_DAY_TO_SESSION[
          normalized
        ]
      ) {
        return {
          marker,
          session:
            EXPLICIT_DAY_TO_SESSION[
              normalized
            ],
        };
      }

      let dayChar = '';

      if (
        normalized.startsWith('金')
      ) {
        dayChar = '金';
      } else if (
        normalized.startsWith('土')
      ) {
        dayChar = '土';
      } else if (
        normalized.startsWith('日')
      ) {
        dayChar = '日';
      }

      if (
        dayChar &&
        DAY_TO_SESSION[
          dayChar
        ]
      ) {
        return {
          marker,
          session:
            DAY_TO_SESSION[
              dayChar
            ],
        };
      }

      return null;
    }

    /*
     * 「スペースの直前まで」に存在する日程マーカーを
     * 全て調べ、最後のものを採用。
     */
    function findDayBefore(
      text,
      index
    ) {
      const beforeText =
        text.slice(
          0,
          index
        );

      /*
       * 重要:
       *
       * 例えば
       *
       *   土カ01a／日J45a
       *
       * の J45a の前には「土」ではなく
       * 「日」が存在するため、
       * 最後に出現した日程マーカー = 日
       *
       * となる。
       */
      const regex =
        new RegExp(
          DAY_MARKER_REGEX.source,
          'g'
        );

      let latest = null;

      let match;

      while (
        (match =
          regex.exec(
            beforeText
          )) !== null
      ) {
        const parsed =
          parseDayMarker(
            match[0]
          );

        if (!parsed) {
          continue;
        }

        latest = {
          marker:
            parsed.marker,

          session:
            parsed.session,

          index:
            match.index,

          end:
            match.index +
            match[0].length,
        };
      }

      /*
       * 日程とスペースが離れすぎている場合は
       * 関係ない可能性がある。
       *
       * ただし、
       *
       *   C108 2日目 東7 I34-b
       *
       * のような表記もあるため、80文字まで許容。
       */
      if (latest) {
        const distance =
          index -
          latest.end;

        if (
          distance <= 80
        ) {
          return latest;
        }
      }

      return null;
    }

    /*
     * ------------------------------------------------------------
     * キーワード
     * ------------------------------------------------------------
     */
    function hasKeywordHint(text) {
      const normalized =
        normalizeText(
          text
        ).toLowerCase();

      return KEYWORD_HINTS.some(
        (keyword) =>
          normalized.includes(
            normalizeText(
              keyword
            ).toLowerCase()
          )
      );
    }

    // ============================================================
    // スペース
    // ============================================================

    /*
     * ブロック名。
     */
    const BLOCK =
      '[ぁ-んァ-ヶA-Za-z]{1,3}';

    /*
     * ------------------------------------------------------------
     * Hall付き
     * ------------------------------------------------------------
     *
     * 対応:
     *
     *   東オ59b
     *   東オ59-a
     *   東コ42a
     *   東2Hセ-15b
     *   南1t34ab
     *   東7ホールI34a
     *   東7ホール I34-b
     *   東1ケ35-a
     *
     * 重要:
     *
     * 「番号」と「a/b」の間の
     * ハイフンも許容する。
     */
    const HALL_SPACE_REGEX =
      new RegExp(
        '([東西南])' +
        '\\s*' +

        '(\\d{1,2})?' +

        '\\s*' +

        /*
         * H / Hホール / ホール / 号館 / 地区
         */
        '(?:(?:[Hh])(?:ホール|Hall|hall)?|ホール|号館|地区)?' +

        '\\s*' +

        /*
         * ブロック
         */
        '"?' +
        `(${BLOCK})` +
        '"?' +

        '\\s*' +

        '(?:ブロック)?' +

        '\\s*' +

        /*
         * ブロックと番号の区切り
         */
        '[-:/ー・~〜\\s]*' +

        /*
         * 番号
         */
        '(\\d{1,3})' +

        '\\s*' +

        /*
         * 番号とa/bの間の区切り。
         *
         * 今回追加:
         *
         *   59-a
         *   34-b
         */
        '[-:/ー・~〜\\s]*' +

        /*
         * a / b / ab
         */
        '([ab]{1,2})',

        'giu'
      );

    /*
     * ------------------------------------------------------------
     * Hallなし
     * ------------------------------------------------------------
     *
     * 対応:
     *
     *   カ01a
     *   カ01-a
     *   J45a
     *   J45-a
     *   I34a
     *   I34-b
     *   セ07a
     *   セ07-a
     *
     * 日程は別途解決。
     */
    const NO_HALL_SPACE_REGEX =
      new RegExp(
        '(?<![A-Za-z0-9東西南])' +

        '"?' +
        `(${BLOCK})` +
        '"?' +

        '\\s*' +

        '(?:ブロック)?' +

        '\\s*' +

        /*
         * ブロックと番号
         */
        '[-:/ー・~〜\\s]*' +

        '(\\d{1,3})' +

        '\\s*' +

        /*
         * 番号とa/b
         */
        '[-:/ー・~〜\\s]*' +

        '([ab]{1,2})' +

        '(?![A-Za-z0-9])',

        'giu'
      );

    /*
     * ------------------------------------------------------------
     * Hall宣言
     * ------------------------------------------------------------
     *
     * 例:
     *
     *   東7ホール
     *   東7H
     *   南1ホール
     *
     * 「2日目 I34a 東7ホール」
     * の I34a に東7を関連付けるために使用。
     */
    const HALL_DECLARATION_REGEX =
      new RegExp(
        '([東西南])' +
        '\\s*' +
        '(\\d{1,2})' +
        '\\s*' +
        '(?:H(?:ホール)?|ホール|号館|地区)',

        'giu'
      );

    function cleanBlock(block) {
      return String(
        block || ''
      ).replace(
        /^["']|["']$/g,
        ''
      );
    }

    /*
     * 抽出テキスト:
     *
     *   {ブロック}{2桁番号}{a|b}
     *
     * 例:
     *
     *   セ7a   → セ07a
     *   I4a    → I04a
     *   ソ17a  → ソ17a
     *   t34ab  → t34ab
     */
    function formatExtractText(
      block,
      number,
      ab
    ) {
      return (
        cleanBlock(block) +
        String(number)
          .padStart(2, '0') +
        String(ab || '')
          .toLowerCase()
      );
    }

    // ------------------------------------------------------------
    // Hall宣言
    // ------------------------------------------------------------

    function findHallDeclarations(
      text
    ) {
      const declarations = [];

      HALL_DECLARATION_REGEX.lastIndex = 0;

      let match;

      while (
        (match =
          HALL_DECLARATION_REGEX.exec(
            text
          )) !== null
      ) {
        declarations.push({
          hall:
            match[1],

          hallNum:
            match[2],

          start:
            match.index,

          end:
            match.index +
            match[0].length,
        });
      }

      return declarations;
    }

    /*
     * standaloneスペースに近い
     * Hall宣言を関連付ける。
     */
    function resolveNearbyHall(
      text,
      spaceStart,
      spaceEnd,
      day
    ) {
      const declarations =
        findHallDeclarations(
          text
        );

      if (
        declarations.length === 0
      ) {
        return {
          hall: '',
          hallNum: '',
        };
      }

      let best = null;
      let bestDistance =
        Infinity;

      for (
        const declaration of
          declarations
      ) {
        /*
         * Hall宣言側の直前日程。
         */
        const declarationDay =
          findDayBefore(
            text,
            declaration.start
          );

        /*
         * 明らかに別日程なら除外。
         */
        if (
          day &&
          declarationDay &&
          declarationDay.session !==
            day.session
        ) {
          continue;
        }

        let distance;

        if (
          declaration.start >=
          spaceEnd
        ) {
          distance =
            declaration.start -
            spaceEnd;
        } else if (
          declaration.end <=
          spaceStart
        ) {
          distance =
            spaceStart -
            declaration.end;
        } else {
          distance = 0;
        }

        if (
          distance > 30
        ) {
          continue;
        }

        if (
          distance <
          bestDistance
        ) {
          best =
            declaration;

          bestDistance =
            distance;
        }
      }

      if (!best) {
        return {
          hall: '',
          hallNum: '',
        };
      }

      return {
        hall:
          best.hall,

        hallNum:
          best.hallNum,
      };
    }

    // ------------------------------------------------------------
    // 重複除去
    // ------------------------------------------------------------

    function dedupePatterns(
      patterns
    ) {
      const map =
        new Map();

      for (
        const pattern of
          patterns
      ) {
        const key = [
          pattern.day,
          pattern.hall,
          pattern.hallNum,
          pattern.block,
          pattern.number,
          pattern.ab,
        ]
          .join('|')
          .toLowerCase();

        if (
          !map.has(key)
        ) {
          map.set(
            key,
            pattern
          );
        }
      }

      return [
        ...map.values(),
      ];
    }

    // ------------------------------------------------------------
    // スペース抽出
    // ------------------------------------------------------------

    function extractSpaces(
      rawText
    ) {
      const text =
        normalizeText(
          rawText
        );

      const results = [];

      /*
       * Hall付きマッチ範囲。
       */
      const hallRanges = [];

      // ==========================================================
      // A. Hall付き
      // ==========================================================

      HALL_SPACE_REGEX.lastIndex = 0;

      let match;

      while (
        (match =
          HALL_SPACE_REGEX.exec(
            text
          )) !== null
      ) {
        const hall =
          match[1];

        const hallNum =
          match[2] || '';

        const block =
          match[3];

        const number =
          match[4];

        const ab =
          match[5];

        if (
          !hall ||
          !block ||
          !number ||
          !ab
        ) {
          continue;
        }

        const start =
          match.index;

        const end =
          match.index +
          match[0].length;

        const day =
          findDayBefore(
            text,
            start
          );

        results.push({
          raw:
            match[0].trim(),

          extractText:
            formatExtractText(
              block,
              number,
              ab
            ),

          hall,

          hallNum,

          block:
            cleanBlock(
              block
            ),

          number,

          ab,

          day:
            day
              ? day.session
              : '',

          dayLabel:
            day
              ? day.marker
              : '',

          sourceIndex:
            start,

          sourceEnd:
            end,

          confident:
            true,
        });

        hallRanges.push({
          start,
          end,
        });
      }

      function overlapsHallRange(
        start,
        end
      ) {
        return hallRanges.some(
          (range) =>
            start <
              range.end &&
            end >
              range.start
        );
      }

      // ==========================================================
      // B. Hallなし
      // ==========================================================

      NO_HALL_SPACE_REGEX.lastIndex = 0;

      while (
        (match =
          NO_HALL_SPACE_REGEX.exec(
            text
          )) !== null
      ) {
        const start =
          match.index;

        const end =
          match.index +
          match[0].length;

        /*
         * Hall付きマッチ内部なら除外。
         */
        if (
          overlapsHallRange(
            start,
            end
          )
        ) {
          continue;
        }

        const block =
          match[1];

        const number =
          match[2];

        const ab =
          match[3];

        if (
          !block ||
          !number ||
          !ab
        ) {
          continue;
        }

        const day =
          findDayBefore(
            text,
            start
          );

        const nearbyHall =
          resolveNearbyHall(
            text,
            start,
            end,
            day
          );

        results.push({
          raw:
            match[0].trim(),

          extractText:
            formatExtractText(
              block,
              number,
              ab
            ),

          hall:
            nearbyHall.hall,

          hallNum:
            nearbyHall.hallNum,

          block:
            cleanBlock(
              block
            ),

          number,

          ab,

          day:
            day
              ? day.session
              : '',

          dayLabel:
            day
              ? day.marker
              : '',

          sourceIndex:
            start,

          sourceEnd:
            end,

          confident:
            true,
        });
      }

      /*
       * 文字列中の出現順。
       */
      results.sort(
        (a, b) =>
          a.sourceIndex -
          b.sourceIndex
      );

      return dedupePatterns(
        results
      );
    }

    /*
     * Consoleから個別テストできるようにする。
     *
     * 例:
     *
     * __testComiketSpaceParser(
     *   "熊三C108(土)東オ59-a"
     * )
     */
    window.__testComiketSpaceParser =
      extractSpaces;

    // ============================================================
    // 4. Result
    // ============================================================

    const STATUS_MATCH =
      'マッチ';

    const STATUS_GUESS =
      '推定(ホール記載なし)';

    const STATUS_REVIEW =
      '要確認';

    const STATUS_NONE =
      '対象外';

    const STATUS_ORDER = {
      [STATUS_MATCH]: 0,
      [STATUS_GUESS]: 1,
      [STATUS_REVIEW]: 2,
      [STATUS_NONE]: 3,
    };

    const finalRows = [];

    usersMap.forEach(
      ({
        name,
        bio,
      }, handle) => {
        const combined =
          `${name} ${bio}`;

        /*
         * 表示名 + BIOを別々に解析。
         */
        let matches = [
          ...extractSpaces(
            name
          ).map(
            (p) => ({
              ...p,
              source:
                '表示名',
            })
          ),

          ...extractSpaces(
            bio
          ).map(
            (p) => ({
              ...p,
              source:
                'BIO',
            })
          ),
        ];

        matches =
          dedupePatterns(
            matches
          );

        // ========================================================
        // MATCH
        // ========================================================

        if (
          matches.length > 0
        ) {
          matches.forEach(
            (p) => {
              finalRows.push({
                handle,

                name,

                bio,

                status:
                  p.confident
                    ? STATUS_MATCH
                    : STATUS_GUESS,

                source:
                  p.source,

                /*
                 * 抽出テキスト:
                 *
                 *   ブロック + 2桁番号 + a/b
                 */
                raw:
                  p.extractText,

                hall:
                  p.hall,

                hallNum:
                  p.hallNum,

                block:
                  p.block,

                number:
                  p.number,

                ab:
                  p.ab,

                day:
                  p.day,

                profileUrl:
                  `https://x.com/${handle}`,
              });
            }
          );

          return;
        }

        // ========================================================
        // REVIEW
        // ========================================================

        if (
          hasKeywordHint(
            combined
          )
        ) {
          finalRows.push({
            handle,

            name,

            bio,

            status:
              STATUS_REVIEW,

            source: '',
            raw: '',

            hall: '',
            hallNum: '',
            block: '',
            number: '',
            ab: '',
            day: '',

            profileUrl:
              `https://x.com/${handle}`,
          });

          return;
        }

        // ========================================================
        // NONE
        // ========================================================

        finalRows.push({
          handle,

          name,

          bio,

          status:
            STATUS_NONE,

          source: '',
          raw: '',

          hall: '',
          hallNum: '',
          block: '',
          number: '',
          ab: '',
          day: '',

          profileUrl:
            `https://x.com/${handle}`,
        });
      }
    );

    // ============================================================
    // Sort
    // ============================================================

    finalRows.sort(
      (a, b) =>
        STATUS_ORDER[a.status] -
        STATUS_ORDER[b.status]
    );

    window.__comiketResults =
      finalRows;

    // ============================================================
    // Summary
    // ============================================================

    const matchCount =
      finalRows.filter(
        (r) =>
          r.status ===
          STATUS_MATCH
      ).length;

    const guessCount =
      finalRows.filter(
        (r) =>
          r.status ===
          STATUS_GUESS
      ).length;

    const reviewCount =
      finalRows.filter(
        (r) =>
          r.status ===
          STATUS_REVIEW
      ).length;

    const noneCount =
      finalRows.filter(
        (r) =>
          r.status ===
          STATUS_NONE
      ).length;

    console.log(
      '============================================================'
    );

    console.log(
      `[ComiketExtract] 収集人数: ${usersMap.size}人`
    );

    console.log(
      `[ComiketExtract] マッチ: ${matchCount}`
    );

    console.log(
      `[ComiketExtract] 推定: ${guessCount}`
    );

    console.log(
      `[ComiketExtract] 要確認: ${reviewCount}`
    );

    console.log(
      `[ComiketExtract] 対象外: ${noneCount}`
    );

    console.log(
      '============================================================'
    );

    console.table(
      finalRows
    );

    // ============================================================
    // CSV
    // ============================================================

    const HEADERS = [
      'ステータス',
      'ハンドル',
      '表示名',
      'BIO',
      '抽出元',
      '抽出テキスト',
      'ホール',
      '号館',
      'ブロック',
      '番号',
      'a/b',
      '日程',
      'プロフィールURL',
    ];

    const csvCell = (value) =>
      `"${String(
        value ?? ''
      ).replace(
        /"/g,
        '""'
      )}"`;

    const csvLines = [
      HEADERS
        .map(csvCell)
        .join(','),
    ];

    finalRows.forEach(
      (r) => {
        csvLines.push(
          [
            r.status,
            r.handle,
            r.name,
            r.bio,
            r.source,
            r.raw,
            r.hall,
            r.hallNum,
            r.block,
            r.number,
            r.ab,
            r.day,
            r.profileUrl,
          ]
            .map(csvCell)
            .join(',')
        );
      }
    );

    const csvContent =
      '\uFEFF' +
      csvLines.join(
        '\r\n'
      );

    function downloadCsv() {
      const blob =
        new Blob(
          [csvContent],
          {
            type:
              'text/csv;charset=utf-8;',
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const a =
        document.createElement(
          'a'
        );

      a.href = url;

      a.download =
        `comiket_space_list_${new Date()
          .toISOString()
          .slice(0, 10)}.csv`;

      document.body.appendChild(
        a
      );

      a.click();

      document.body.removeChild(
        a
      );

      URL.revokeObjectURL(
        url
      );
    }

    // ============================================================
    // Panel
    // ============================================================

    const existing =
      document.getElementById(
        'comiket-extract-panel'
      );

    if (existing) {
      existing.remove();
    }

    const panel =
      document.createElement(
        'div'
      );

    panel.id =
      'comiket-extract-panel';

    panel.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      width: 500px;
      max-height: 80vh;
      background: #fff;
      color: #111;
      border: 1px solid #ccc;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,.25);
      z-index: 999999;
      font-family: sans-serif;
      font-size: 12px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;

    panel.innerHTML = `
      <div style="
        padding:10px 12px;
        background:#1d9bf0;
        color:#fff;
        display:flex;
        justify-content:space-between;
        align-items:center;
      ">
        <strong>
          コミケスペース抽出結果
        </strong>

        <button
          id="comiket-close-btn"
          style="
            background:none;
            border:none;
            color:#fff;
            font-size:16px;
            cursor:pointer;
          "
        >
          ×
        </button>
      </div>

      <div style="
        padding:8px 12px;
        line-height:1.7;
        border-bottom:1px solid #eee;
      ">
        <div>
          収集ユーザー:
          <strong>${usersMap.size}</strong>
        </div>

        <div>
          マッチ:
          <strong>${matchCount}</strong>
        </div>

        <div>
          推定:
          <strong>${guessCount}</strong>
        </div>

        <div>
          要確認:
          <strong>${reviewCount}</strong>
        </div>

        <div>
          対象外:
          <strong>${noneCount}</strong>
        </div>
      </div>

      <div style="
        padding:8px 12px;
        border-bottom:1px solid #eee;
      ">
        <button
          id="comiket-dl-btn"
          style="
            width:100%;
            padding:6px;
            cursor:pointer;
          "
        >
          CSVダウンロード
        </button>
      </div>

      <div style="
        overflow:auto;
        padding:8px 12px;
      ">
        <table style="
          width:100%;
          border-collapse:collapse;
        ">
          <thead>
            <tr>
              <th style="
                text-align:left;
                border-bottom:1px solid #ddd;
                padding:4px;
              ">
                状態
              </th>

              <th style="
                text-align:left;
                border-bottom:1px solid #ddd;
                padding:4px;
              ">
                ハンドル
              </th>

              <th style="
                text-align:left;
                border-bottom:1px solid #ddd;
                padding:4px;
              ">
                抽出内容
              </th>

              <th style="
                text-align:left;
                border-bottom:1px solid #ddd;
                padding:4px;
              ">
                日程
              </th>
            </tr>
          </thead>

          <tbody>
            ${finalRows
              .map(
                (r) => `
                  <tr>
                    <td style="
                      padding:4px;
                      border-bottom:1px solid #f0f0f0;
                    ">
                      ${r.status}
                    </td>

                    <td style="
                      padding:4px;
                      border-bottom:1px solid #f0f0f0;
                    ">
                      <a
                        href="${r.profileUrl}"
                        target="_blank"
                        rel="noopener"
                      >
                        @${r.handle}
                      </a>
                    </td>

                    <td style="
                      padding:4px;
                      border-bottom:1px solid #f0f0f0;
                    ">
                      ${
                        r.raw ||
                        '(要確認)'
                      }
                    </td>

                    <td style="
                      padding:4px;
                      border-bottom:1px solid #f0f0f0;
                    ">
                      ${
                        r.day
                          ? `${r.day}日目`
                          : ''
                      }
                    </td>
                  </tr>
                `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;

    document.body.appendChild(
      panel
    );

    document
      .getElementById(
        'comiket-close-btn'
      )
      .addEventListener(
        'click',
        () => panel.remove()
      );

    document
      .getElementById(
        'comiket-dl-btn'
      )
      .addEventListener(
        'click',
        downloadCsv
      );

    downloadCsv();

  } catch (err) {
    console.error(
      '[ComiketExtract] エラーが発生しました:',
      err
    );

    console.error(
      'X側のDOM構造が変わっている可能性があります。'
    );
  }
})();
