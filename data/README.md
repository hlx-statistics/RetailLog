# 条码参考库数据

与 App 内 `IndexedDB / goods`（店主商品库）分离，仅用于**扫码时预填名称与参考售价**。

## 目录

```
data/
├── README.md                 # 本说明
├── raw/                      # 原始数据（不入 Git）
│   ├── barcodes.csv          # 主数据源（约 105 万行）
│   └── barcodes.sql          # 可选，仅作备份/对照
└── processed/
    ├── stats.json            # 最近一次构建统计（可提交）
    └── full/                 # 全量 JSONL（不入 Git）
        └── barcodes.jsonl

public/
└── barcode-ref-lite.json     # 内置精简库（构建产物，随 Web/APK 打包）

scripts/barcode-ref/          # 预处理脚本
```

> 请勿把大文件放在 `src/db/`。该目录是应用 IndexedDB 代码，不是数据目录。

## 预处理流程

1. 将原始 `barcodes.csv` 放入 `data/raw/`（或保留一份在仓库外，构建时用 `--input` 指定）。
2. 运行：

```bash
npm run test:barcode-ref      # 名称合并逻辑测试
npm run build:barcode-ref     # 全量构建（约 1–3 分钟，需 ~500MB 内存）
```

开发时可先抽样验证：

```bash
node scripts/barcode-ref/build.mjs --sample 5000
```

3. 产物：
   - **全量** `data/processed/full/barcodes.jsonl`：每行 `[barcode, displayName, price]`
   - **内置** `public/barcode-ref-lite.json`：体积 ≤ 5MB（可用 `--max-lite-mb 4.5` 调整）

## 字段与规则

| 源 CSV 列 | 处理方式 |
|-----------|----------|
| `id` | 丢弃 |
| `barcode` | 规范为 8–14 位数字字符串 |
| `name` + `spec` + `unit` | 合并为展示名 `displayName`（见下） |
| `price` | 解析为数字，无效行跳过 |
| 其余列 | 丢弃 |

### 名称合并（`buildDisplayName`）

- 若 `name` 中**已包含** `spec` 或 `unit` 的文本（不区分大小写，忽略空格差异），则不再追加该段。
- 需同时补规格与单位时：`{name} {spec}/{unit}`（例：`六神百合除菌香皂 125克/块`）。
- 仅缺其一：`{name} {spec}` 或 `{name} {unit}`。

### 去重

- 以 `barcode` 为键，**保留首次**出现的记录。

### 无售价行

- `price` 为空或无法解析的行**整行跳过**（源数据中约一半无标价，不参与参考库）。
- 若后续需要「只预填名称、售价留空」，可再改构建脚本放宽规则。

### 内置精简库抽样

- 全量去重后，用条码稳定哈希均匀抽样，按 **UTF-8 字节** 控制体积 ≤ 5MB。
- 若略低于预算，按条码字典序补齐，避免只覆盖 `690` 开头段落。

最近一次全量构建（见 `data/processed/stats.json`）示例：约 51.5 万条有效记录 → 内置库约 **6.1 万条 / 3.1 MB**。

## 与 App 的衔接（后续版本）

1. 启动或首次使用时加载 `public/barcode-ref-lite.json` 到内存 Map / IndexedDB 只读库。
2. 扫码：先查店主 `goods`；若无，再查参考库 → 预填条码、名称、参考售价。
3. 店主确认保存后写入 `goods`；**不修改**参考库。
4. 完整库离线下载：后续版本再做，当前仅内置 lite。

## 环境要求

- Node.js 18+
- 全量构建建议可用内存 ≥ 512MB
