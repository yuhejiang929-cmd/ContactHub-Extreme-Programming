# ContactHub 演示步骤

程序证据通过 Playwright 在独立 Chrome 会话中操作真实应用生成，联系人为示例数据。录屏从浏览器打开应用开始。已验证 [MP4](demo/contacthub-demo.mp4) 可解码，时长 28.52 秒，分辨率 1280 × 800。原始录屏为 [WebM](demo/contacthub-demo.webm)。

| 顺序 | 操作 | 预期与证据 |
| --- | --- | --- |
| 1 | 运行 `npm run dev`，打开终端给出的 URL | 空通讯录显示 No contacts yet |
| 2 | Add Contact，输入林晓 Lin Xia，添加 3 个电话、3 个邮箱、2 个社交账号及 2 个地址 | [联系人编辑表单](screenshots/02-add-contact.png) |
| 3 | 保存后通过界面新增其余样例，星标林晓和 Amira | [全部联系人](screenshots/01-home.png) |
| 4 | 点击 Favorites，取消 Amira 的收藏 | 初始两位，取消后当前视图只剩林晓。[收藏视图](screenshots/03-favorites.png) |
| 5 | 在林晓卡片点击 View | 展示全部联系方式，第一条电话是 `059112345678`。[多联系方式](screenshots/04-multiple-methods.png) |
| 6 | 点击 Export Excel | 即使在 Favorites 中也导出六条数据。[导出截图](screenshots/05-excel-export.png) · [实际导出的 XLSX](demo/contacthub-demo-contacts.xlsx) |
| 7 | 删除林晓并确认，点 Import Excel，选择刚下载的文件 | 预览显示 Ready 1、Skipped 5、Failed 0。确认后林晓和收藏状态恢复。[导入预览](screenshots/06-excel-import.png) |
| 8 | 搜索 `059112345678`，编辑林晓的第三个邮箱并刷新 | 在 Favorites 中仍可查看更新后的邮箱和收藏状态 |

手工演示可以用 2 到 4 分钟，并在下载后额外打开 Excel 展示表头、编号列和号码文本。使用虚构测试数据。自动记录可使用以下流程复跑。

```sh
npm run build
npm run preview -- --port 4174 --strictPort
```

在另一个终端执行下列命令。已有 Chrome 时可设置 `CONTACTHUB_CHROMIUM_CHANNEL=chrome`。录屏原件输出到 `docs/demo/contacthub-demo.webm`。

```sh
npx playwright install chromium
npm run evidence
```
