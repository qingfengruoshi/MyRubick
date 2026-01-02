# 前端窗口高度计算逻辑总结

前端计算高度的核心逻辑位于 `src/common/utils/getWindowHeight.ts` 文件中，并在 `App.vue` 中被调用。

## 1. 核心常量定义
代码中定义了几个固定高度值：
*   **WINDOW_MIN_HEIGHT (60px)**: 窗口最小高度，仅显示搜索框时的高度。
*   **WINDOW_MAX_HEIGHT (620px)**: 窗口最大高度上限。
*   **PRE_ITEM_HEIGHT (70px)**: 单行列表高度，即每个搜索结果的高度。
*   **HISTORY_HEIGHT (70px)**: 显示历史记录区域的固定高度。

## 2. 计算逻辑
函数 `getWindowHeight(searchList, historyList)` 根据是否有搜索结果采用不同的计算方式：

### 无搜索结果时 (`!searchList.length`)
*   **基础高度**: 60px。
*   **历史记录加成**: 如果存在历史记录 (`historyList.length > 0`)，则额外增加 70px。
*   **最终高度**: 
    *   **130px** (有历史记录)
    *   **60px** (无历史记录)

### 有搜索结果时
*   **计算公式**: `搜索结果数量 * 70px + 60px`
*   **限制**: 计算结果永远不会超过 **620px**。
    *   如果计算结果 > 620px，则取 620px（此时内容区域内部滚动）。
    *   如果计算结果 <= 620px，则取实际计算出的高度。

## 3. 触发机制
在 `src/renderer/App.vue` 中，通过 `watch` 监听以下数据的变化：
*   搜索结果列表 (`options`)
*   插件历史记录 (`pluginHistory`)
*   当前插件状态 (`currentPlugin`)

一旦这些数据发生变化，监听器会立即调用 `getWindowHeight` 计算新的高度，并通过 IPC (`window.rubick.setExpendHeight`) 通知主进程调整窗口大小。
