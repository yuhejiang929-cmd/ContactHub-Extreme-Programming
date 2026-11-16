## 变更

- 新增可持久化通讯录、同名身份、搜索与收藏导航。
- 支持任意多条电话、邮箱、社交账号与地址。
- 实现真正的 XLSX 导入、去重预览、模板下载与全量导出。
- 提供自动测试、浏览器截图、演示及课程交付材料。

## 验收

- `npm run lint`
- `npm test`
- `npm run build`
- `CONTACTHUB_CHROMIUM_CHANNEL=chrome npm run test:e2e`

课程允许自建仓库。此 PR 从功能分支合入本仓库的 `main`，保留逐阶段开发提交。
