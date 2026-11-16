# JavaScript 编码规范

- 使用 UTF-8、ES Modules、两空格缩进和单引号。项目内模块导入写出文件扩展名。
- 常量与无需重赋值的绑定使用 `const`。变量与函数用 camelCase，跨模块常量使用 UPPER_SNAKE_CASE。
- 显式控制数据依赖。联系人校验放在模型，存储读写放在服务，DOM 绑定放在界面层。
- 用细小、能描述业务动作的函数处理重复逻辑。以用例名说明测试覆盖与预期。
- 以 `textContent` 写入联系人和 Excel 字段。文件先检查格式、大小和表头，再校验数据。只有完成校验的记录可提交到存储。
- 每个开发节点运行相应测试。使用 `npm run lint` 执行 ESLint 推荐规则，`npm test` 验证数据行为，`npm run build` 验证生产入口。
- Git 以 `feat:`、`fix:`、`test:`、`docs:` 等前缀记录实际变更。禁止提交依赖目录、构建缓存、账号凭证和真实联系人。

项目的 ESLint 配置可检查推荐的 JavaScript 规则。排版、命名和模块边界由代码审阅核对。参考 [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)。
