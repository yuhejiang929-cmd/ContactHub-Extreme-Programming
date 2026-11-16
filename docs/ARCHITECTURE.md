# ContactHub 架构

## 模块依赖

```text
index.html / styles.css
   └─ main.js ── ui.js ── contacts.js
         ├─ storage.js ── contacts.js
         └─ excel-ui.js ── ui.js / contacts.js
                 └─ 懒加载 excel.js ── contacts.js / ExcelJS / fflate
```

`main.js` 连接浏览器事件、更新列表和状态消息。DOM 内容使用 `textContent`、表单 `value` 和静态图标。详情与编辑使用原生 `dialog`，删除确认默认聚焦取消按钮。

## 联系人和持久化

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 使用 Web Crypto 随机数生成 UUID v4。同名联系人独立 |
| `name` | string | 去除首尾空白后必填，最多 120 字符 |
| `phones`、`emails`、`socials`、`addresses` | string[] | 过滤纯空白条目，保留同类顺序，邮箱执行基础格式校验 |
| `isFavorite` | boolean | 默认 false，收藏切换显式修改此字段 |
| `notes` | string | 最多 2,000 字符，详情支持换行 |

`createContactStore` 将列表存储在 `localStorage` 中。写入前重新读取当前快照；成功持久化后返回新列表。JSON 损坏或存储失败时给出反馈并保留原值。其他标签页写入后可通过 `storage` 事件刷新。个人本地通讯录采用单用户存储，多个标签页同时写入同一条记录时建议在单个编辑窗口完成修改。

`findContacts` 从输入列表派生视图。搜索对姓名和邮箱忽略大小写，电话也能按去除空格与标点的数字匹配。筛选和搜索不写入存储。

## Excel 交换

1. `writeWorkbook` 计算每类最大数量，至少写出一组编号列。表头有填色、冻结及列宽，`Favorite` 为 Yes／No。联系方式写为文本单元格。
2. `readWorkbook` 先检查文件大小，再查 ZIP 目录元信息及工作簿结构。匹配第一行表头，按数字顺序重建四类数组，跳过完全空白行，收集错误行。已识别字段中的公式会使该行失败。
3. `selectImportAdditions` 比较姓名、收藏、备注及四类联系方式。签名对 Unicode 文本做 NFC 规范化，内部排序仅用于判重，因此联系方式次序不同仍可匹配。每个已有匹配只能抵消一行导入，故空通讯录能完整还原相同内容的多行，同一工作簿重复导入则会被跳过。
4. 用户确认后 `store.importContacts` 按最新存储内容重新校验重复份数，一次追加全部可导入记录。无效行留在报告中。ID 是设备内记录键，工作簿包含用户可见字段，新导入记录分配新 ID。

Excel 模块按需下载，首屏无需加载大型工作簿编解码器。
