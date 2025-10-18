import { parseLocation, calculateCoordinates } from "../lib/mapCoordinateCalculator";

describe("Coordinate Calculation for 南12 blocks", () => {
  test("南1-a-01a should parse correctly", () => {
    const space = parseLocation("南1-a-01a");
    expect(space).not.toBeNull();
    expect(space?.area).toBe("南");
    expect(space?.hall).toBe("1");
    expect(space?.block).toBe("a");
    expect(space?.spaceNumber).toBe("01");
    expect(space?.position).toBe("a");
  });

  test("Block 'a' should have index 0", () => {
    const space = parseLocation("南1-a-01a");
    if (space) {
      const blockIndex = space.block.charCodeAt(0) - "a".charCodeAt(0);
      expect(blockIndex).toBe(0);
    }
  });

  test("南1 blocks a-j should map to 南1", () => {
    const blocks = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
    blocks.forEach((block) => {
      const space = parseLocation(`南1-${block}-01a`);
      expect(space?.hall).toBe("1");
    });
  });

  test("南2 blocks k-t should map to 南2", () => {
    const blocks = ["k", "l", "m", "n", "o", "p", "q", "r", "s", "t"];
    blocks.forEach((block) => {
      const space = parseLocation(`南2-${block}-01a`);
      expect(space?.hall).toBe("2");
    });
  });

  test("Coordinates for 南1-a-01a", () => {
    const space = parseLocation("南1-a-01a");
    if (space) {
      const coords = calculateCoordinates(space);
      console.log("南1-a-01a coordinates:", coords);
      expect(coords.x).toBeGreaterThan(0);
      expect(coords.y).toBeGreaterThan(0);
    }
  });

  test("Compare coordinates across southern blocks", () => {
    const testCases = [
      "南1-a-01a",
      "南1-b-01a",
      "南1-j-01a",
      "南2-k-01a",
      "南2-t-01a",
    ];

    console.log("\n=== Testing all southern blocks ===");
    testCases.forEach((loc) => {
      const sp = parseLocation(loc);
      if (sp) {
        const co = calculateCoordinates(sp);
        const blockIndex = sp.block.charCodeAt(0) - "a".charCodeAt(0);
        console.log(
          `${loc}: x=${co.x.toFixed(2)}, y=${co.y.toFixed(2)}, blockIndex=${blockIndex}`
        );
      }
    });
  });
});
