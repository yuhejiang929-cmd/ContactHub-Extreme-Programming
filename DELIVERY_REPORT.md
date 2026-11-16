# ContactHub 最终交付报告

## A. 项目概况

Software Engineering (FZU–MU) Extreme Programming 通讯录。初始目录为空，学生确认课程允许自建。应用以 Vite、原生 JavaScript、ExcelJS 和浏览器存储实现。

## B. 已实现功能

| 作业项 | 分值 | 实际完成 |
| --- | ---: | --- |
| 收藏联系人 | 25 | 空心/实心星标、Favorites 筛选、取消、刷新和 Excel 往返 |
| 多联系方式 | 10 | 电话、邮箱、社交账号和地址可重复添加、逐条编辑和删除 |
| Excel | 25 | 动态编号列、真实 XLSX、文本号码、预览计数与错行反馈 |
| 页面样式 | 10 | 联系人卡片、键盘对话框、空态和窄屏 |
| 作业材料 | 30 | 可构建代码、编码规范、博客初稿、演示、PSP 和真实证据 |
| 可选云部署 | +15 | 访问状态及加分口径见 F |

## C. 实际执行的测试

`npm run lint` 成功，`npm test` 20 项通过，`npm run build` 成功，`CONTACTHUB_CHROMIUM_CHANNEL=chrome npm run test:e2e` 4 项通过。Chrome 检查覆盖刷新、窄屏、控制台及真实下载再上传。最终本地自动化无失败。详见 [测试报告](docs/TEST_REPORT.md)。

## D. Git 与 GitHub 状态

仓库已创建，功能分支为 `feature/extreme-programming-address-book`，目标为同仓库 `main`。提交来自实际工作节点，使用 Codex 署名。实际提交数量、PR、Release 及远程证据见 [GitHub 记录](docs/GITHUB_EVIDENCE.md)。

## E. 文件清单

- [README](README.md)、[项目计划](docs/PROJECT_PLAN.md)、[架构](docs/ARCHITECTURE.md)、[编码规范](docs/CODING_STANDARDS.md)。
- [功能与评分验收](docs/FEATURES.md)、[测试报告](docs/TEST_REPORT.md)、[演示复跑](docs/DEMO_SCRIPT.md)、[截图目录](docs/screenshots/)。
- [CSDN 初稿](docs/CSDN_BLOG_DRAFT.md)、[发布指南](docs/BLOG_PUBLISHING_GUIDE.md)、[PSP 模板](docs/PSP_TEMPLATE.md)、[提交清单](docs/DELIVERY_CHECKLIST.md)。
- [演示 MP4](docs/demo/contacthub-demo.mp4)、[实测导出 XLSX](docs/demo/contacthub-demo-contacts.xlsx)。
- [部署文档](docs/DEPLOYMENT.md)、[Nginx 配置](deploy/contacthub.nginx.conf)、[部署脚本](scripts/deploy-nginx.sh)。

## F. 云部署状态

静态托管的实际状态见 [部署文档](docs/DEPLOYMENT.md)。额外 15 分是否接受静态托管需核实。阿里云或华为云实例没有可用部署授权，本地准备了 Linux Nginx 方案。联系人保存在各浏览器自己的 localStorage。

## G. 学生需完成的步骤

1. 本人复核项目代码、实际操作主要功能，按课程要求记录自己的改动及测试。
2. 在博客初稿填写个人或组队情况、真实贡献或分工、个人 PSP 及复核反思。
3. 将正文复制至 CSDN Markdown 编辑器，上传真实截图与视频，或使用 Release 的公开素材链接。
4. 发布博客，确认审核和公开访问，复制文章地址。
5. 登录课程社区，通过「提交任务」提交本人文章。北京时间 2026-11-17 23:59 前检查提交记录。组队时每位学生分别提交。 [CSDN 作业入口](https://bbs.csdn.net/topics/620593436)

## H. 潜在扣分风险

CSDN 审核、个人 PSP、真实贡献说明和课程提交仍依赖学生账号及记录。自动化作者提交数应如实报告。用静态托管申请额外分值前需核实课程口径。

## I. macOS 运行命令

安装 Node.js 22.12+（22 系列）或 24+，执行：

```sh
cd "$HOME/Documents/juniorTerm1/Software Engineering/ExtremeProgramming1"
npm ci
npm run dev
```

生产验证运行 `npm run lint && npm test && npm run build`。安装 Google Chrome 后执行 `CONTACTHUB_CHROMIUM_CHANNEL=chrome npm run test:e2e`。

## J. 结论

- **已实现并验证**　联系人与收藏、动态多联系方式、Excel、生产构建、Chrome 实际操作与移动宽度。
- **已实现但未在目标环境验证**　Linux Nginx 脚本与配置。
- **尚未完成**　课程账号上的文章发布和作业提交，云加分口径确认。
- **学生本人操作**　个人学习与复核、真实贡献材料、PSP、博客审核和提交。
