# Map Coloring Position Fix - Visual Explanation

## The Problem: Incorrect Block Positioning

### Before Fix (Broken)
```
PDF Map (南12ホール):
┌─────────────────────────────────┐
│  南1 Area (startY: 80)          │
│  ┌──┬──┬──┬──┬──┐              │
│  │a │b │c │d │e │  Row 0      │ ✓ Correct
│  └──┴──┴──┴──┴──┘              │
│  ┌──┬──┬──┬──┬──┐              │
│  │f │g │h │i │j │  Row 1      │ ✓ Correct
│  └──┴──┴──┴──┴──┘              │
│                                  │
│  ❌ Empty space (wrong!)         │
│  ┌──┬──┬──┬──┬──┐              │
│  │k │l │m │n │o │  Row 2      │ ✗ WRONG POSITION
│  └──┴──┴──┴──┴──┘              │ (Using absolute index 10)
│                                  │
│  南2 Area (startY: 400)         │
│  (should start here!)            │
│                                  │
│  ┌──┬──┬──┬──┬──┐              │
│  │p │q │r │s │t │  Row 3      │ ✗ Also wrong
│  └──┴──┴──┴──┴──┘              │
└─────────────────────────────────┘
```

### After Fix (Correct)
```
PDF Map (南12ホール):
┌─────────────────────────────────┐
│  南1 Area (startY: 80)          │
│  ┌──┬──┬──┬──┬──┐              │
│  │a │b │c │d │e │  Row 0      │ ✓ Correct
│  └──┴──┴──┴──┴──┘              │
│  ┌──┬──┬──┬──┬──┐              │
│  │f │g │h │i │j │  Row 1      │ ✓ Correct
│  └──┴──┴──┴──┴──┘              │
│                                  │
│  南2 Area (startY: 400)         │
│  ┌──┬──┬──┬──┬──┐              │
│  │k │l │m │n │o │  Row 0      │ ✓ NOW CORRECT!
│  └──┴──┴──┴──┴──┘              │ (Using relative index 0)
│  ┌──┬──┬──┬──┬──┐              │
│  │p │q │r │s │t │  Row 1      │ ✓ Correct
│  └──┴──┴──┴──┴──┘              │
└─────────────────────────────────┘
```

## The Code Fix

### Before: Using Absolute Block Index
```typescript
// Block 'k' gets index 10 (absolute)
const blockIndex = getBlockIndex('k');  // = 10
const blockRow = Math.floor(10 / 5);    // = 2 (wrong!)
const y = startY + blockRow * blockHeight;
// Result: y = 400 + 2 * 80 = 560 ❌
```

### After: Using Relative Block Index with Offset
```typescript
// Block 'k' gets index 10 (absolute), but we subtract offset
const absoluteBlockIndex = getBlockIndex('k');  // = 10
const blockIndex = 10 - hallConfigs.blockIndexOffset; // = 10 - 10 = 0
const blockRow = Math.floor(0 / 5);    // = 0 (correct!)
const y = startY + blockRow * blockHeight;
// Result: y = 400 + 0 * 80 = 400 ✓
```

## Actual Coordinate Changes

| Location  | Block | Absolute Index | Before (y) | After (y) | Difference |
|-----------|-------|----------------|------------|-----------|------------|
| 南1-a-01a | a     | 0              | 80         | 80        | ✓ No change |
| 南1-j-01a | j     | 9              | 160        | 160       | ✓ No change |
| 南2-k-01a | k     | 10             | **560**    | **400**   | ✅ Fixed -160px |
| 南2-t-01a | t     | 19             | **640**    | **480**   | ✅ Fixed -160px |

## Block Index Offset Configuration

```typescript
const configs = {
  // South Halls (1日目)
  南1: { blockIndexOffset: 0  },  // blocks a-j (0-9)
  南2: { blockIndexOffset: 10 },  // blocks k-t (10-19) → calc as (0-9)
  
  // West Halls (1日目)  
  西1: { blockIndexOffset: 0  },  // blocks あ-た (0-15)
  西2: { blockIndexOffset: 16 },  // blocks ち-め (16-29) → calc as (0-13)
  
  // East Hall 7 (2日目)
  東7: { blockIndexOffset: 0  },  // blocks A-W (0-22)
  
  // East Halls 4/5/6 (3日目)
  東4: { blockIndexOffset: 0  },  // blocks ア-ス (0-12)
  東5: { blockIndexOffset: 13 },  // blocks セ-ノ (13-24) → calc as (0-11)
  東6: { blockIndexOffset: 25 },  // blocks ハ-ヨ (25-37) → calc as (0-12)
};
```

## Impact Summary

✅ **Fixed**: All blocks now position correctly relative to their hall area
✅ **Tested**: 18 unit tests verify correct positioning
✅ **Security**: CodeQL found 0 vulnerabilities
✅ **Build**: Successful with no errors

### User-Facing Impact
When users color "南1-a-01a" or any southern block:
- **Before**: Large offset, blocks appear in wrong locations
- **After**: Precise alignment with PDF map blocks

### Technical Impact
- Affects 4 hall pairs: 南1/2, 西1/2, 東4/5/6
- Fixes positioning for ~50+ blocks across all halls
- No breaking changes to API or data structures
