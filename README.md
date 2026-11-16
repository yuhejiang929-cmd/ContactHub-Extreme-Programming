# ContactHub

ContactHub 是 Software Engineering (FZU–MU) 极限编程作业的浏览器通讯录。支持联系人管理、收藏、同类多联系方式与真实 Excel 工作簿导入导出。课程截止为 2026 年 11 月 17 日 23:59（北京时间）。[作业原帖](https://bbs.csdn.net/topics/620593436)

[打开在线通讯录](https://yuhejiang929-cmd.github.io/ContactHub-Extreme-Programming/) · [v1.0.0](https://github.com/yuhejiang929-cmd/ContactHub-Extreme-Programming/releases/tag/v1.0.0)

![ContactHub 桌面端运行截图](docs/screenshots/01-home.png)

## 启动与验证

需要 Node.js 22.12+（22 系列）或 Node.js 24+。本项目使用 Vite、原生 JavaScript、localStorage、ExcelJS、Vitest 和 Playwright。

```sh
npm ci
npm run dev
```

打开终端显示的本地地址。使用以下命令验证生产构建和真实浏览器操作。

```sh
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

也可用已安装的 Google Chrome，执行 `CONTACTHUB_CHROMIUM_CHANNEL=chrome npm run test:e2e`。Playwright 默认在 4174 端口启动生产预览；`npm run preview` 可手动打开生产构建。

## 功能

- 创建、查看、编辑及确认删除联系人。支持同名联系人，按姓名、电话或邮箱搜索。
- 一键收藏或取消收藏，单独查看收藏列表。
- 四类联系方式均可添加多条并逐条删除。详情展示全部内容，保存时移除空白条目。
- 下载 Excel 模板、导出全部联系人、查看导入预览后追加记录。导入反馈包含成功、跳过、失败和部分行错误。
- 桌面卡片和窄屏布局，表单可用键盘操作。刷新自动读取浏览器里的联系人。

## 数据和 Excel 格式

每个联系人拥有 UUID `id`、`name`、`phones[]`、`emails[]`、`socials[]`、`addresses[]`、`isFavorite` 和 `notes`。浏览器通过 `contacthub.contacts.v1` 保存联系人数组。

| Name | Phone 1 | Phone 2 | Email 1 | Social 1 | Address 1 | Favorite | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 林晓 Lin Xia | 059112345678 | +86 138 0013 8000 | lin@example.com | @lin-demo | 福州 | Yes | 示例联系人 |

导出时一人一行，按各类联系方式的最大数量生成编号列。电话等联系方式以文本单元格写入。导入时优先使用 `Contacts` 工作表，否则使用第一张。第一行必须有 `Name`，其余列可调整顺序。动态列按编号读取，`Favorite` 缺省为 No。导入仅添加超出现有匹配份数的记录，具体规则见 [架构文档](docs/ARCHITECTURE.md)。

导入接受 5 MB 内的 `.xlsx`，并限制 ZIP 目录声明的展开大小为 32 MB、工作表数据范围为 5,000 行。请在 Excel 手工输入号码之前把列设为文本，以便保留前导零和国际号码的加号。导入会为附加的联系人分配本地 ID。浏览器站点数据按来源隔离，跨设备迁移可用 Excel，清除浏览器站点数据后需要重新导入。

## 模块和交付材料

| 路径 | 职责 |
| --- | --- |
| `src/main.js`、`src/ui.js`、`src/styles.css` | 事件、详情与编辑、布局 |
| `src/contacts.js`、`src/storage.js` | 数据校验、查找、收藏和持久化 |
| `src/excel.js`、`src/excel-ui.js` | 工作簿编解码、预览和下载 |
| `tests/`、`scripts/capture-demo.js` | 自动验证和浏览器证据录制 |

[GitHub 仓库](https://github.com/yuhejiang929-cmd/ContactHub-Extreme-Programming) · [编码规范](docs/CODING_STANDARDS.md) · [测试报告](docs/TEST_REPORT.md) · [演示步骤](docs/DEMO_SCRIPT.md) · [部署状态](docs/DEPLOYMENT.md) · [最终交付报告](DELIVERY_REPORT.md)
