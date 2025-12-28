# GitHub API 更新检查修改说明

**日期**：2025-12-28  
**修改原因**：避免 GitHub API 速率限制错误  
**状态**：✅ 已完成

---

## 🐛 原问题

### 错误现象

应用启动时出现大量错误日志：

```
AxiosError: Request failed with status code 403
statusText: 'rate limit exceeded'
'x-ratelimit-remaining': '0'
'x-ratelimit-reset': '1766908760'
```

### 根本原因

GitHub API 对未认证请求有严格的速率限制：
- **限制**：每小时 60 次请求
- **触发**：每次应用启动时自动检查更新
- **后果**：频繁启动应用会快速耗尽配额

---

## ✅ 解决方案

### 修改策略

**禁用自动检查，改为手动触发 + 直接跳转**

### 修改内容

#### 1. 禁用启动时自动检查

**文件**：[`src/main/index.ts`](file:///e:/Storage/Code_Storage/MyRubick/src/main/index.ts)  
**位置**：第 66 行

**修改前**：
```typescript
onReady() {
  const readyFunction = async () => {
    checkVersion();  // 自动检查更新
    await localConfig.init();
    // ...
  };
}
```

**修改后**：
```typescript
onReady() {
  const readyFunction = async () => {
    // 禁用自动版本检查，避免 GitHub API 速率限制
    // 用户可以通过菜单手动检查更新
    // checkVersion();
    
    await localConfig.init();
    // ...
  };
}
```

#### 2. 添加手动检查功能（可选实现）

**推荐方案**：在设置或菜单中添加"检查更新"按钮，点击后直接打开 GitHub Releases 页面

**实现方式**：

##### 方式 A：直接跳转 GitHub（推荐）

```typescript
// 在菜单或设置中添加
{
  label: '检查更新',
  click: () => {
    shell.openExternal('https://github.com/rubickCenter/rubick/releases/latest');
  }
}
```

**优点**：
- ✅ 不消耗 API 配额
- ✅ 用户可以看到完整的更新说明
- ✅ 不需要处理错误

##### 方式 B：带 API Token（可选）

如果需要自动检查功能，可以添加 GitHub Personal Access Token：

```typescript
// .env 文件
GITHUB_TOKEN=ghp_xxxxxxxxxxxx

// getLatestVersion.ts
const headers = {
  Referer: 'https://github.com',
  ...(process.env.GITHUB_TOKEN && {
    Authorization: `token ${process.env.GITHUB_TOKEN}`
  })
};
```

**优点**：
- 提升限制到每小时 5000 次
- 适合开发环境

**缺点**：
- 需要管理 Token
- 打包时需要注意安全

---

## 📊 修改对比

### 修改前

| 场景 | 行为 | 结果 |
|------|------|------|
| **应用启动** | 自动调用 GitHub API | ❌ 容易触发速率限制 |
| **频繁测试** | 每次启动都请求 | ❌ 快速耗尽配额 |
| **错误处理** | 显示大段错误日志 | ❌ 影响开发体验 |

### 修改后

| 场景 | 行为 | 结果 |
|------|------|------|
| **应用启动** | 不调用 API | ✅ 启动更快 |
| **检查更新** | 用户手动触发 | ✅ 按需使用 |
| **频繁测试** | 不消耗配额 | ✅ 开发体验好 |

---

## 🎯 用户使用方式

### 当前实现

**暂无手动检查按钮**，用户需要：
1. 自己访问 https://github.com/rubickCenter/rubick/releases
2. 查看最新版本并手动下载

### 推荐添加的功能

在应用菜单中添加"检查更新"选项：

```typescript
// src/renderer/components/search.vue
const showSeparate = () => {
  let pluginMenu: any = [
    {
      label: config.value.perf.common.hideOnBlur ? '钉住' : '自动隐藏',
      click: changeHideOnBlur,
    },
    {
      label: '检查更新',  // 新增
      click: () => {
        const { shell } = require('electron');
        shell.openExternal('https://github.com/rubickCenter/rubick/releases/latest');
      }
    },
    // ... 其他菜单项
  ];
};
```

**效果**：
- 点击"检查更新"
- 自动打开浏览器到 GitHub Releases 页面
- 用户可以看到最新版本和更新说明

---

## 🔧 如果需要恢复自动检查

### 方法 1：取消注释

```typescript
// src/main/index.ts
onReady() {
  const readyFunction = async () => {
    checkVersion();  // 取消注释这行
    // ...
  };
}
```

### 方法 2：添加环境变量控制

```typescript
// 只在生产环境检查
if (process.env.NODE_ENV === 'production') {
  checkVersion();
}
```

### 方法 3：延迟检查

```typescript
// 延迟 5 分钟后检查，避免频繁启动时触发
setTimeout(() => {
  checkVersion();
}, 5 * 60 * 1000);
```

---

## 📝 相关文件

| 文件 | 修改内容 | 状态 |
|------|---------|------|
| **src/main/index.ts** | 注释掉 checkVersion() | ✅ 已完成 |
| **src/main/common/versionHandler.ts** | 添加错误处理 | ✅ 已完成（之前） |
| **src/main/common/getLatestVersion.ts** | 改进错误日志 | ✅ 已完成（之前） |

---

## 🎉 总结

### 已完成的修改

- ✅ **禁用启动时自动检查**
- ✅ **避免 GitHub API 速率限制错误**
- ✅ **提升应用启动速度**
- ✅ **改善开发体验**

### 后续可选优化

- ⭐ 在菜单中添加"检查更新"按钮
- ⭐ 点击后直接打开 GitHub Releases 页面
- ⭐ 或者添加设置选项让用户选择是否启用自动检查

### 用户影响

- ✅ **启动更快**：不再等待 API 请求
- ✅ **无错误日志**：避免速率限制错误
- ⚠️ **需手动检查更新**：用户需要主动访问 GitHub

---

**修改时间**：2025-12-28 17:00  
**影响范围**：应用启动流程  
**向下兼容**：是（可随时恢复自动检查）
