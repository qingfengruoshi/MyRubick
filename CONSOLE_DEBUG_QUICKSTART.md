# 快速调试指南 - 如何在 Console 查看重复应用

## ✅ 已修复

现在 `window.appList` 已经可以在开发者工具中使用了！

## 🚀 快速开始

### 1. 启动应用

```bash
npm run electron:serve
```

### 2. 打开开发者工具

按 `F12` 或 `Ctrl+Shift+I`

### 3. 等待加载完成

在 Console 标签中，等待看到这条消息：

```
[Debug] appList exposed to window. Use window.appList to access.
```

### 4. 开始使用命令

## 📝 超简单的命令（复制粘贴就能用）

### 命令 1：查看有多少个应用

```javascript
window.appList.length
```

**预期输出**：
```
156
```

---

### 命令 2：查看所有网易云音乐

```javascript
window.appList.filter(app => app.name.includes('网易云音乐'))
```

**预期输出**：
```javascript
[
  {
    name: "网易云音乐",
    desc: "C:\\Program Files\\CloudMusic\\cloudmusic.exe",
    keyWords: ["网易云音乐", "cloudmusic"],
    ...
  },
  {
    name: "网易云音乐",
    desc: "C:\\Program Files\\CloudMusic\\cloudmusic.exe",
    keyWords: ["网易云音乐", "cloudmusic"],
    ...
  }
]
```

如果输出的数组有 2 个元素，就说明有重复！

---

### 命令 3：查找所有重复的应用（推荐）

**复制这整段代码粘贴到 Console：**

```javascript
const names = {};
window.appList.forEach(app => {
  names[app.name] = (names[app.name] || 0) + 1;
});
const duplicates = Object.entries(names).filter(([name, count]) => count > 1);
console.log('找到重复的应用:', duplicates.length);
console.table(duplicates);
```

**预期输出**：
```
找到重复的应用: 3
┌─────────┬──────────────────┬───┐
│ (index) │         0        │ 1 │
├─────────┼──────────────────┼───┤
│    0    │ '网易云音乐'      │ 2 │
│    1    │ 'Google Chrome'  │ 2 │
│    2    │ 'Visual Studio'  │ 2 │
└─────────┴──────────────────┴───┘
```

表格中：
- **第1列**：应用名称
- **第2列**：出现次数

---

### 命令 4：查看特定应用的详细信息

```javascript
window.appList.filter(app => app.name === '网易云音乐').forEach((app, index) => {
  console.log(`--- 第 ${index + 1} 个网易云音乐 ---`);
  console.log('名称:', app.name);
  console.log('目标文件:', app.desc);
  console.log('关键词:', app.keyWords);
  console.log('');
});
```

**预期输出**：
```
--- 第 1 个网易云音乐 ---
名称: 网易云音乐
目标文件: C:\Program Files\CloudMusic\cloudmusic.exe
关键词: ["网易云音乐", "cloudmusic"]

--- 第 2 个网易云音乐 ---
名称: 网易云音乐
目标文件: C:\Program Files\CloudMusic\cloudmusic.exe
关键词: ["网易云音乐", "cloudmusic"]
```

## 🎯 判断是否是真的重复

看 **目标文件** (desc)：

### 情况 1：目标文件相同 = 真重复

```
第 1 个: C:\Program Files\CloudMusic\cloudmusic.exe
第 2 个: C:\Program Files\CloudMusic\cloudmusic.exe
```

**原因**：同一个应用在两个地方都有快捷方式
**对用户的影响**：搜索时会看到 2 个相同的结果

### 情况 2：目标文件不同 = 不是重复

```
第 1 个: C:\Program Files\CloudMusic\cloudmusic.exe
第 2 个: C:\Program Files\CloudMusic Beta\cloudmusic.exe
```

**原因**：安装了两个不同版本
**对用户的影响**：正常，应该显示 2 个

## ⚠️ 如果命令不work

### 问题1：`window.appList` 显示 `undefined`

**解决**：
1. 等待 3-5 秒让应用加载完成
2. 查看 Console 是否有 `[Debug] appList exposed` 的消息
3. 如果没有，刷新页面（`Ctrl+R`）

### 问题2：输入命令出错

**解决**：
1. 确保在 **Console** 标签，不是其他标签
2. **完整复制**命令，包括所有符号
3. **一次只运行一个**命令

### 问题3：还是不行

**最简单的方法**：

在 Console 输入：
```javascript
window
```

然后：
1. 在弹出的自动完成列表中找 `appList`
2. 点击 `appList` 旁边的三角形展开
3. 就能看到所有应用了

## 📊 实际案例

### 案例：搜索"网易云音乐"出现两个

**步骤 1**：运行命令

```javascript
window.appList.filter(app => app.name === '网易云音乐')
```

**结果**：看到 2 个对象

**步骤 2**：查看目标文件

两个都是：`C:\Program Files\CloudMusic\cloudmusic.exe`

**步骤 3**：查看日志

在 Console 搜索 `网易云音乐`，看到：

```
[App Index] ✓ Shortcut parsed: "网易云音乐" → C:\Program Files\CloudMusic\cloudmusic.exe
[App Index] ✓ Adding app: "网易云音乐"

[App Index] ⚠️  DUPLICATE DETECTED!
   App Name: "网易云音乐"
   Current Source: C:\Users\...\网易云音乐.lnk
   Existing Source: C:\Program Files\CloudMusic\cloudmusic.exe
```

**结论**：确实是重复，因为：
1. 系统开始菜单有快捷方式
2. 用户开始菜单也有快捷方式
3. 两个都指向同一个文件

**解决方案**：
- 搜索逻辑已经会自动去重
- 或者手动删除其中一个快捷方式

## 💡 快速检查清单

```javascript
// 1. 检查 appList 是否加载
window.appList ? '✅ 已加载' : '❌ 未加载'

// 2. 查看应用总数
window.appList.length

// 3. 查找网易云音乐
window.appList.filter(app => app.name.includes('网易云音乐')).length

// 4. 如果 > 1，查看详情
window.appList.filter(app => app.name.includes('网易云音乐'))
```

---

**现在您可以轻松调试重复问题了！** 🎉

重启应用，打开开发者工具，试试这些命令吧！
