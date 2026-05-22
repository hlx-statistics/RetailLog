# 条码参考库数据

与 App 内 `IndexedDB / goods`（店主商品库）分离，仅用于**扫码时预填名称与参考售价**。

## 目录

```
data/
├── README.md
├── raw/                      # 原始 CSV（不入 Git）
│   └── barcodes.csv
└── processed/
    ├── stats.json
    └── full/
        └── barcodes.jsonl    # 全量（不入 Git，约 26MB）

public/
└── barcode-ref.jsonl         # 构建后复制到此，随 App 打包（约 26MB）
```

## 构建

```bash
npm run build:barcode-ref
```

产出：

1. `data/processed/full/barcodes.jsonl` — 全量，每行 `[barcode, displayName, price]`
2. `public/barcode-ref.jsonl` — **App 实际加载的文件**（与全量相同）

可选精简库（一般不需要）：

```bash
node scripts/barcode-ref/build.mjs --lite
```

## 字段规则

| 源 CSV | 处理 |
|--------|------|
| `name` + `spec` + `unit` | 合并为展示名（名称已含规格则不重复拼接） |
| `price` | 无效则跳过该行 |
| 其余列 | 丢弃 |

## 与 App

- 启动时加载 `public/barcode-ref.jsonl` 到内存（约 51 万条有效条码）。
- 扫码：先查店主 `goods`；没有再查参考库 → 预填名称、参考售价。
- 保存进 `goods` 后不修改参考库。

改 CSV 后请重新 `npm run build:barcode-ref`，并重新 `npm run build` / 打 APK。
