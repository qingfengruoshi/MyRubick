# 搜索框变白问题 - 诊断与修复指南

## 🔍 问题分析

搜索框变成纯白色通常是因为 CSS 变量未正确加载导致的。

## 📋 诊断步骤

### 步骤 1：检查控制台错误

1. 启动应用：
   ```bash
   npm run electron:serve
   ```

2. 按 `F12` 打开开发者工具

3. 查看 **Console** 标签，检查是否有红色错误

4. 特别关注以下错误：
   - `Cannot read property 'perf' of undefined`
   - `Failed to load module`
   - 任何关于 CSS 或主题的错误

### 步骤 2：检查 CSS 变量

在开发者工具的 **Console** 中运行：

```javascript
// 检查 CSS 变量
const root = document.documentElement;
const bg = getComputedStyle(root).getPropertyValue('--color-body-bg');
console.log('Background color:', bg);

// 如果是空值
，说明 CSS 变量未加载
```

### 步骤 3：检查配置

在 **Console** 中运行：

```javascript
// 检查配置是否存在
const config = window.rubick.db.get('rubick-local-config');
console.log('Config:', config);

// 检查主题配置
console.log('Theme:', config?.data?.perf?.custom);
```

## 🔧 修复方案

### 方案 1：重置配置（推荐）

在开发者工具 **Console** 中运行：

```javascript
// 删除旧配置
const oldConfig = window.rubick.db.get('rubick-local-config');
if (oldConfig) {
  window.rubick.db.remove(oldConfig);
}

// 刷新页面以重新初始化
location.reload();
```

### 方案 2：手动修复配置

如果方案 1 不起作用，在 **Console** 中运行：

```javascript
// 手动设置默认配置
window.rubick.db.put({
  _id: 'rubick-local-config',
  data: {
    version: 7,
    perf: {
      custom: {
        theme: 'SPRING',
        primaryColor: '#ff4ea4',
        errorColor: '#ed6d46',
        warningColor: '#e5a84b',
        successColor: '#c0d695',
        infoColor: '#aa8eeB',
        logo: 'file:///' + __static + '/logo.png',
        placeholder: '你好，Rubick！请输入插件关键词',
        username: 'Rubick',
      },
      shortCut: {
        showAndHidden: 'Option+R',
        separate: 'Ctrl+D',
        quit: 'Shift+Escape',
        capture: 'Ctrl+Shift+A',
      },
      common: {
        start: true,
        space: true,
        hideOnBlur: true,
        autoPast: false,
        darkMode: false,
        guide: false,
        history: true,
        lang: 'zh-CN',
      },
      local: {
        search: true,
      },
    },
    global: [],
  }
});

// 刷新页面
location.reload();
```

### 方案 3：清除数据库重新初始化

如果上述方案都不起作用，可能需要清除整个数据库：

1. **关闭应用**

2. **删除数据库文件**：
   - Windows: `C:\Users\<用户名>\AppData\Roaming\rubick\rubickDB`
   - macOS: `~/Library/Application Support/rubick/rubickDB`
   - Linux: `~/.config/rubick/rubickDB`

3. **重新启动应用**

## 🐛 已知原因

根据代码分析，可能的原因包括：

### 原因 1：配版本不匹配

`defaultConfig.ts` 中定义的版本是 `7`。如果数据库中的配置版本不是 `7`，初始化可能失败。

**检查方法**：
```javascript
const config = window.rubick.db.get('rubick-local-config');
console.log('Config version:', config?.data?.version);
// 应该输出 7
```

### 原因 2：__static 变量未定义

在 `defaultConfig.ts` 中使用了 `__static` 变量。如果这个变量在新版本 Electron 中未定义，会导致配置初始化失败。

**检查方法**：
```javascript
console.log('__static:', __static);
// 应该输出静态资源路径
```

### 原因 3：数据库初始化失败

渲染进程和主进程使用不同的 `confOp` 实现，可能导致同步问题。

## 📝 请提供以下信息

如果上述方案都不起作用，请提供：

1. **Console 中的错误信息**（截图或文本）

2. **运行以下命令的输出**：
   ```javascript
   // 在开发者工具 Console 中运行
   console.log('Config:', window.rubick.db.get('rubick-local-config'));
   console.log('CSS --color-body-bg:', getComputedStyle(document.documentElement).getPropertyValue('--color-body-bg'));
   console.log('__static:', typeof __static !== 'undefined' ? __static : 'undefined');
   ```

3. **应用截图**（显示白色搜索框的状态）

## 🎯 临时解决方案

如果需要快速恢复使用，可以暂时使用这个脚本：

```javascript
// 在开发者工具 Console 中运行
// 临时设置 CSS 变量
document.documentElement.style.setProperty('--color-body-bg', '#fff');
document.documentElement.style.setProperty('--color-text-primary', 'rgba(0, 0, 0, 0.85)');
document.documentElement.style.setProperty('--color-text-content', '#141414');
document.documentElement.style.setProperty('--color-list-hover', 'rgba(247, 247, 247)');
document.documentElement.style.setProperty('--color-border-light', '#f0f0f0');
```

这样可以临时恢复搜索框的可见性，但需要每次启动时运行。
