---
title: React Hooks 学习笔记
date: 2026-04-06
tags: [React, 前端, Hooks]
excerpt: 整理 useState、useEffect、useCallback 的使用要点
---

## useState

状态管理的基础 Hook，每次调用 `setState` 都会触发重新渲染。

```js
const [count, setCount] = useState(0)
```

## useEffect

> 副作用处理：数据请求、订阅、手动操作 DOM 都放在这里。

依赖数组为空时只在挂载时执行一次：

```js
useEffect(() => {
  fetchData()
}, [])
```

## 重要提示

==不要在循环、条件或嵌套函数中调用 Hook==，这是 React 的核心规则。

相关笔记：[[useCallback 优化]] | [[自定义 Hook 封装]]

**加粗文字**示例，以及四级标题：

#### 第四级标题

图片示例（相对路径）：

![示意图](../../public/images/react-hooks.png)
