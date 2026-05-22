# RuralKeeper · 乡程掌柜

[![Release](https://img.shields.io/github/v/release/hlx-statistics/RetailLog?label=release)](https://github.com/hlx-statistics/RetailLog/releases/latest)
[![License](https://img.shields.io/github/license/hlx-statistics/RetailLog)](https://github.com/hlx-statistics/RetailLog/blob/main/LICENSE)

**乡程掌柜（RuralKeeper）** 是一款轻量、离线的移动端乡村商铺商品与销售管理应用。用手机摄像头扫码建档、连续扫码凑单结账，数据保存在本机，无需服务器。

## 活动说明

本产品为参加 **数智乡建黑客松** 活动而开发。感谢活动组织方与相关支持单位提供平台与资源，使本项目得以完成与展示。

## 商品数据来源

应用内置条码参考库（扫码建档时的名称/规格提示）基于开源商品数据加工而来，原始数据请参考：

**[开源商品数据集（GitCode）](https://gitcode.com/open-source-toolkit/3cb8d)**

本地预处理脚本见 `scripts/barcode-ref/`，原始 CSV 置于 `data/raw/`（不随仓库分发大文件时请自行下载后运行 `npm run build:barcode-ref`）。

**仓库**：[github.com/hlx-statistics/RetailLog](https://github.com/hlx-statistics/RetailLog)

## 功能特性

- **扫码即用**：销售页连续扫码加购，实时合计，一键确认售出并扣库存
- **商品管理**：扫码/手动建档，分类筛选、搜索，入库与非销售出库
- **完全离线**：IndexedDB 本地存储，无账号、无云服务
- **数据备份**：导出/导入 JSON，换机可恢复
- **双端交付**：Android APK（推荐店主）或 PWA（浏览器 / 添加到主屏幕）

## 下载安装

**普通用户请直接下载安装包，无需克隆仓库。**

| 方式 | 适用场景 | 获取方式 |
|------|----------|----------|
| **Android APK** | 店主日常使用手机（推荐） | [Releases](https://github.com/hlx-statistics/RetailLog/releases) 下载 `RuralKeeper-*.apk` |
| **PWA** | 自行部署静态站点 | `npm run build` 后托管 `dist/`，浏览器访问或「添加到主屏幕」 |

> 当前仓库尚未发布安装包。维护者可在 [Releases](https://github.com/hlx-statistics/RetailLog/releases) 创建首个版本（如 `v1.0.0`）并上传 APK；发布后用户可通过 [最新发行版](https://github.com/hlx-statistics/RetailLog/releases/latest) 下载。

### Android 安装步骤

1. 打开 [最新发行版](https://github.com/hlx-statistics/RetailLog/releases/latest)，在 **Assets** 中下载 APK（例如 `RuralKeeper-v1.0.0.apk`）
2. 将文件传到手机（微信、网盘、数据线等），点击安装
3. 若提示「未知来源」，在系统设置中允许该来源安装应用

## 截图

<!-- 可在 docs/images/ 放置截图并取消注释 -->
<!--
<p align="center">
  <img src="docs/images/sale.png" width="280" alt="销售结账" />
  <img src="docs/images/goods.png" width="280" alt="商品列表" />
</p>
-->

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3、TypeScript、Vite、Pinia、Vue Router |
| 本地存储 | IndexedDB（`idb`） |
| 扫码 | ZXing（`@zxing/browser`） |
| 原生壳 | Capacitor 8（Android） |
| PWA | `vite-plugin-pwa` |

## 从源码运行（开发者）

### 环境要求

- Node.js 18+
- npm 9+（或兼容的包管理器）

### Web 开发

```bash
git clone https://github.com/hlx-statistics/RetailLog.git
cd RetailLog
npm install
npm run dev
```

浏览器访问开发服务器地址（通常为 `http://localhost:5173`）。

### 构建 Web / PWA

```bash
npm run build
npm run preview
```

### 构建 Android APK

需要 [Android Studio](https://developer.android.com/studio) 与 Android SDK。详细步骤见 [Android 打包指南](docs/03.Android打包.md)。

```bash
npm install
npm run cap:sync      # 构建并同步到 android/
npm run cap:android   # 用 Android Studio 打开并 Build APK
```

调试包输出路径：`android/app/build/outputs/apk/debug/app-debug.apk`。正式发布请在 Android Studio 中配置签名并构建 release 包，再将 APK 上传到 [GitHub Releases](https://github.com/hlx-statistics/RetailLog/releases)。

## 文档

| 文档 | 说明 |
|------|------|
| [需求文档](docs/01.需求文档.md) | 功能范围、业务规则、V1.0 实现状态 |
| [开发规范](docs/02.开发规范.md) | 代码结构与约定 |
| [Android 打包指南](docs/03.Android打包.md) | APK 构建与店主安装说明 |

## 项目结构

```
RetailLog/               # 仓库根目录（GitHub 仓库名）
├── src/                 # Vue 应用源码
├── public/              # 静态资源
├── android/             # Capacitor Android 工程
├── docs/                # 需求与规范
├── capacitor.config.ts  # Capacitor 配置
└── package.json
```

## 参与贡献

欢迎通过 [Issue](https://github.com/hlx-statistics/RetailLog/issues) 反馈问题或讨论功能，通过 [Pull Request](https://github.com/hlx-statistics/RetailLog/pulls) 提交改进。提交前请先阅读 [开发规范](docs/02.开发规范.md)。

## License

本项目以 [MIT](https://github.com/hlx-statistics/RetailLog/blob/main/LICENSE) 许可证开源。
