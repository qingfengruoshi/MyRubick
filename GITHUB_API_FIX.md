# GitHub API 速率限制错误修复

## 问题说明

### 错误信息
```
AxiosError: Request failed with status code 403
statusText: 'rate limit exceeded'
```

### 根本原因

GitHub API 对未认证请求有速率限制：
- **限制**：每小时 60 次请求
- **影响范围**：仅版本更新检查功能
- **是否影响搜索框**：❌ **不影响**（这是两个独立的问题）

## 已应用的修复

### 修改文件

1. **[versionHandler.ts](file:///e:/Storage/Code_Storage/MyRubick/src/main/common/versionHandler.ts)**
   - 添加 try-catch 错误处理
   - 静默处理版本检查失败
   - 不影响应用启动

2. **[getLatestVersion.ts](file:///e:/Storage/Code_Storage/MyRubick/src/main/common/getLatestVersion.ts)**
   - 检测 GitHub API 速率限制错误
   - 区分不同类型的错误
   - 提供友好的日志信息

### 修改效果

**之前**：
```typescript
// 错误会导致显示一长串错误堆栈
AxiosError: Request failed with status code 403
  at settle...
  at IncomingMessage...
  ... (100+ 行)
```

**之后**：
```typescript
// 简洁的警告信息
GitHub API 速率限制，跳过版本检查
版本检查失败（不影响使用）: ...
```

## 附加说明

### 关于搜索框变白的问题

**GitHub API 错误与搜索框变白是两个独立的问题**：

1. **GitHub API 错误**（本次修复）
   - 影响：版本更新检查
   - 现象：终端显示错误日志
   - 解决：已添加错误处理

2. **搜索框变白**（另一个问题）
   - 影响：UI 显示
   - 原因：可能是配置或 CSS 变量加载问题
   - 解决方案：请参考 [`SEARCHBOX_FIX.md`](file:///e:/Storage/Code_Storage/MyRubick/SEARCHBOX_FIX.md)

### 速率限制详情

GitHub API 速率限制重置时间：
- **重置时间戳**：在错误响应的 `x-ratelimit-reset` 头中
- **当前示例**：`1766908760`（Unix 时间戳）
- **等待时间**：通常最多 1 小时

### 如何避免速率限制

#### 方案 1：减少检查频率（未实施）

在 `main/index.ts` 中添加延迟：

```typescript
// 延迟 5 分钟后才检查版本
setTimeout(() => {
  checkVersion();
}, 5 * 60 * 1000);
```

#### 方案 2：添加 GitHub Token（最佳方案）

使用 GitHub Personal Access Token 可将限制提升到每小时 5000 次：

```typescript
// 在 getLatestVersion.ts 中
const headers = {
  Referer: 'https://github.com',
  // 添加认证（需要环境变量）
  ...(process.env.GITHUB_TOKEN && {
    Authorization: `token ${process.env.GITHUB_TOKEN}`
  })
};
```

#### 方案 3：完全禁用自动更新检查

注释掉 `main/index.ts` 第 66 行：

```typescript
// checkVersion();  // 禁用自动版本检查
```

## 测试验证

重新启动应用后：
- ✅ 不再显示大段错误堆栈
- ✅ 应用正常启动
- ✅ 核心功能不受影响
- ⚠️ 版本检查会静默失败（不影响使用）

## 推荐做法

**当前修复已足够**：
- 错误被优雅处理
- 不影响用户体验
- 日志简洁明了

**如果需要更新检查**：
- 方案 1：等待 1 小时后速率限制自动重置
- 方案 2：添加 GitHub Token（开发环境）
- 方案 3：手动检查更新（打开 GitHub releases 页面）

---

## 相关资源

- [GitHub API 速率限制文档](https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting)
- [GitHub Personal Access Tokens](https://github.com/settings/tokens)
