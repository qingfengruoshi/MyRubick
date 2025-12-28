# 调试搜索重复问题指南

## 🎯 目的

诊断为什么搜索某些应用（如"网易云音乐"）时会出现重复的结果。

## 📊 已添加的调试日志

### 应用索引阶段

#### 1. 扫描开始
```
[App Index] ========================================
[App Index] Starting Windows application indexing
[App Index] ========================================
```

#### 2. 目录扫描
```
[App Index] Scanning directory: C:\ProgramData\Microsoft\Windows\Start Menu\Programs, found 45 items
[App Index] Scanning directory: C:\Users\...\AppData\Roaming\Microsoft\Windows\Start Menu\Programs, found 23 items
```

#### 3. 文件处理
```
✓ 成功解析快捷方式:
[App Index] ✓ Shortcut parsed: "网易云音乐" → C:\Program Files\CloudMusic\cloudmusic.exe

✗ 解析失败（使用备用方案）:
[App Index] ✗ readShortcutLink failed for: SomeApp.lnk
[App Index] ✓ PowerShell fallback success: "SomeApp" → C:\...\app.exe

✗ 完全失败:
[App Index] ✗ PowerShell fallback also failed for: BrokenLink.lnk
```

#### 4. 直接可执行文件
```
[App Index] Direct .exe file: "AppName" → C:\...\app.exe
```

#### 5. 过滤掉的文件
```
[App Index] ✗ Filtered out: "uninstall" (uninstaller or invalid target)
```

#### 6. 添加应用
```
正常添加:
[App Index] ✓ Adding app: "网易云音乐"
   Target: C:\Program Files\CloudMusic\cloudmusic.exe
   Keywords: [网易云音乐, cloudmusic]

检测到重复:
[App Index] ⚠️  DUPLICATE DETECTED!
   App Name: "网易云音乐"
   Current Source: C:\Users\...\AppData\Roaming\...\网易云音乐.lnk
   Existing Source: C:\Program Files\CloudMusic\cloudmusic.exe
   Adding anyway (will be handled by search dedup logic)
```

#### 7. 索引完成统计
```
[App Index] ========================================
[App Index] Indexing complete! Total apps: 156
[App Index] ========================================

[App Index] ⚠️  Duplicate app names found:
   "网易云音乐" appears 2 times
     [1] C:\Program Files\CloudMusic\cloudmusic.exe
     [2] C:\Program Files\CloudMusic\cloudmusic.exe
```

---

## 🔍 如何使用调试日志

### 步骤 1: 启动应用

```bash
npm run electron:serve
```

### 步骤 2: 打开开发者工具

按 `F12` 或 `Ctrl+Shift+I`

### 步骤 3: 查看控制台

切换到 **Console** 标签

### 步骤 4: 使用调试命令

**重要提示**：应用启动后，`appList` 会自动暴露到 `window` 对象。

在 Console 中运行以下命令：

#### 基础检查

```javascript
// 1. 确认 appList 已加载
window.appList
// 应该返回一个数组

// 2. 查看总数
window.appList.length
// 例如: 156

// 3. 查看所有应用名称
window.appList.map(app => app.name)
```

#### 查找特定应用

```javascript
// 查找网易云音乐
window.appList.filter(app => app.name.includes('网易云音乐'))
```

#### 查找重复项（推荐）

```javascript
// 查找所有重复的应用名称
const names = {};
window.appList.forEach(app => {
  names[app.name] = (names[app.name] || 0) + 1;
});
const duplicates = Object.entries(names).filter(([name, count]) => count > 1);
console.table(duplicates);
```

#### 查看详细信息

```javascript
// 查看特定应用的完整信息
window.appList.filter(app => app.name === '网易云音乐').forEach(app => {
  console.log('Name:', app.name);
  console.log('Target:', app.desc);
  console.log('Keywords:', app.keyWords);
  console.log('---');
});
```

---

## ⚠️ 常见问题

### 问题：`window.appList` 显示 `undefined`

**原因**：应用还在加载中，appList 尚未初始化

**解决方案**：

1. **等待几秒钟**，让应用完成索引
2. **查看是否有加载完成的日志**：
   ```
   [Debug] appList exposed to window. Use window.appList to access.
   ```
3. **如果还是没有，刷新页面**（`Ctrl+R`）

### 问题：输入命令时出现语法错误

**解决方案**：

1. 确保在 **Console** 标签，不是 Elements 或 Network
2. 复制完整命令，包括分号
3. 一次只运行一个命令

### 最简单的检查方法

如果上面的命令不work，直接在 Console 输入：

```javascript
window
```

然后在弹出的对象列表中找 `appList`，点击展开查看。

---

## 🐛 常见重复原因

### 原因 1: 系统和用户开始菜单都有快捷方式

**现象**：
```
[App Index] Scanning directory: C:\ProgramData\Microsoft\Windows\Start Menu\Programs
[App Index] ✓ Shortcut parsed: "网易云音乐" → C:\...\cloudmusic.exe

[App Index] Scanning directory: C:\Users\...\AppData\Roaming\Microsoft\Windows\Start Menu\Programs
[App Index] ✓ Shortcut parsed: "网易云音乐" → C:\...\cloudmusic.exe

[App Index] ⚠️  DUPLICATE DETECTED!
   "网易云音乐" appears 2 times
```

**原因**：
- 安装时同时在系统级和用户级开始菜单创建了快捷方式
- 两个快捷方式指向同一个可执行文件

**解决方案**：
在搜索逻辑中根据目标路径去重（已在 `options.ts` 中实现）

### 原因 2: 同一应用有多个版本

**现象**：
```
[App Index] ✓ Adding app: "网易云音乐"
   Target: C:\Program Files\CloudMusic\cloudmusic.exe
   
[App Index] ✓ Adding app: "网易云音乐 Beta"
   Target: C:\Program Files\CloudMusic Beta\cloudmusic.exe
```

**原因**：
- 安装了正式版和测试版
- 文件名相似但路径不同

**解决方案**：
这是正常的，不需要去重

### 原因 3: 快捷方式名称相同但目标不同

**现象**：
```
[App Index] ✓ Adding app: "网易云音乐"
   Target: C:\Program Files (x86)\CloudMusic\cloudmusic.exe
   
[App Index] ✓ Adding app: "网易云音乐"
   Target: C:\Program Files\CloudMusic\cloudmusic.exe
```

**原因**：
- 32位和64位版本都安装了
- 或者旧版本没卸载干净

**解决方案**：
检查是否真的需要两个版本

---

## 📋 诊断步骤

### 1. 查看完整的索引日志

启动应用后，在开发者工具 Console 中：

1. 查找所有包含 "网易云音乐" 的日志
2. 看看是在哪个路径被扫描到的
3. 检查目标可执行文件路径是否相同

### 2. 检查文件系统

根据日志中显示的路径，手动检查：

```powershell
# 系统级开始菜单
dir "C:\ProgramData\Microsoft\Windows\Start Menu\Programs" -Recurse | Where-Object { $_.Name -like "*网易云音乐*" }

# 用户级开始菜单
dir "$env:APPDATA\Microsoft\Windows\Start Menu\Programs" -Recurse | Where-Object { $_.Name -like "*网易云音乐*" }
```

### 3. 检查快捷方式目标

```powershell
# 读取快捷方式目标
$sh = New-Object -ComObject WScript.Shell
$s = $sh.CreateShortcut("C:\...\网易云音乐.lnk")
$s.TargetPath
```

### 4. 查看搜索结果去重

在 Console 运行：

```javascript
// 查看搜索逻辑中的去重
const descMap = new Map();
window.appList.forEach(app => {
  if (descMap.has(app.desc)) {
    console.warn('Duplicate target:', app.desc, 'Name:', app.name);
  } else {
    descMap.set(app.desc, app.name);
  }
});
```

---

## 🔧 解决方案

### 方案 1: 在索引时去重（不推荐）

修改 `win.ts`，在添加前检查：

```typescript
// 已添加！在第 154-161 行
const existingApp = fileLists.find(app => 
  app.desc === appInfo.desc // 按目标路径去重
);

if (existingApp) {
  console.warn('Skipping duplicate:', appName);
  return; // 跳过重复的
}
```

**缺点**：
- 可能会遗漏有效的不同版本
- 不灵活

### 方案 2: 在搜索时去重（推荐，已实现）

在 `options.ts` 中使用 Map 去重：

```typescript
// options.ts - 第 100 行
const descMap = new Map();

appPlugins.filter((plugin) => {
  if (!descMap.get(plugin)) {
    descMap.set(plugin, true);
    // ... 处理搜索匹配
  }
  return false; // 跳过重复
});
```

**优点**：
- 保留索引完整性
- 搜索时按需去重
- 更灵活

### 方案 3: 手动清理快捷方式

根据日志找到重复的快捷方式，手动删除其中一个：

```powershell
# 删除用户级快捷方式（保留系统级）
Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\网易云音乐.lnk"
```

---

## 📝 示例输出

完整的调试日志示例：

```
[App Index] ========================================
[App Index] Starting Windows application indexing
[App Index] ========================================
[App Index] Scanning directory: C:\ProgramData\Microsoft\Windows\Start Menu\Programs, found 89 items
[App Index] Scanning directory: C:\ProgramData\Microsoft\Windows\Start Menu\Programs\网易云音乐, found 2 items
[App Index] ✓ Shortcut parsed: "网易云音乐" → C:\Program Files\CloudMusic\cloudmusic.exe
[App Index] ✓ Adding app: "网易云音乐"
   Target: C:\Program Files\CloudMusic\cloudmusic.exe
   Keywords: [网易云音乐, cloudmusic]
[App Index] ✓ Shortcut parsed: "卸载网易云音乐" → C:\Program Files\CloudMusic\uninstall.exe
[App Index] ✗ Filtered out: "卸载网易云音乐" (uninstaller or invalid target)

[App Index] Scanning directory: C:\Users\...\AppData\Roaming\Microsoft\Windows\Start Menu\Programs, found 45 items
[App Index] ✓ Shortcut parsed: "网易云音乐" → C:\Program Files\CloudMusic\cloudmusic.exe
[App Index] ⚠️  DUPLICATE DETECTED!
   App Name: "网易云音乐"
   Current Source: C:\Users\...\AppData\Roaming\...\网易云音乐.lnk
   Existing Source: C:\Program Files\CloudMusic\cloudmusic.exe
   Adding anyway (will be handled by search dedup logic)

[App Index] ========================================
[App Index] Indexing complete! Total apps: 156
[App Index] ========================================
[App Index] ⚠️  Duplicate app names found:
   "网易云音乐" appears 2 times
     [1] C:\Program Files\CloudMusic\cloudmusic.exe
     [2] C:\Program Files\CloudMusic\cloudmusic.exe
```

---

## 💡 快速诊断命令

在开发者工具 Console 直接运行：

```javascript
// 1. 查看所有应用
console.table(window.appList);

// 2. 查找特定应用
window.appList.filter(app => app.name.includes('网易云音乐'));

// 3. 查找重复的应用名称
const names = {};
window.appList.forEach(app => {
  names[app.name] = (names[app.name] || 0) + 1;
});
Object.entries(names).filter(([name, count]) => count > 1);

// 4. 查找重复的目标路径
const descs = {};
window.appList.forEach(app => {
  descs[app.desc] = (descs[app.desc] || 0) + 1;
});
Object.entries(descs).filter(([desc, count]) => count > 1);
```

---

## ✅ 预期结果

正常情况下，即使索引中有重复，搜索结果也应该去重：

```javascript
// 索引中：2 个网易云音乐
fileLists.length = 156
fileLists.filter(app => app.name === '网易云音乐').length = 2

// 搜索结果：1 个网易云音乐（已去重）
searchResults.filter(app => app.name === '网易云音乐').length = 1
```

---

## 🎯 总结

- ✅ 日志已添加到 `win.ts`
- ✅ 会显示重复检测信息
- ✅ 会显示索引统计
- ✅ 可以追踪每个应用的来源
- ✅ 搜索时已有去重逻辑

**下一步**：
1. 重启应用查看日志
2. 搜索"网易云音乐"
3. 在 Console 查看重复详情
4. 根据日志确定重复原因

如果需要进一步帮助，请提供控制台的日志输出！
