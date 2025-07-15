# Git Merge Terminal Tool

一个使用 TypeScript 构建的 Git 分支合并工具。

## 功能

- 自动检测主干分支（master 或 main）
- 支持合并到主干分支或测试分支
- 支持 squash 合并
- 支持自定义提交消息

## 安装

```bash
pnpm install
```

## 构建

```bash
pnpm run build
```

## 使用方法

### 开发模式（直接运行 TypeScript）

```bash
pnpm run dev [参数]
```

### 生产模式（运行编译后的 JavaScript）

```bash
pnpm run start [参数]
```

或者直接运行：

```bash
node dist/index.js [参数]
```

## 命令参数

- `--test`: 合并到测试分支（默认为 'test'）
- `--squash`: 使用 squash 合并
- `-m <消息>`: 自定义提交消息

## 示例

```bash
# 合并到主干分支
pnpm run start

# 合并到测试分支
pnpm run start --test

# 使用 squash 合并并添加自定义消息
pnpm run start --squash -m "Feature: Add new functionality"

# 合并到测试分支并使用 squash
pnpm run start --test --squash -m "Fix: Bug fixes"
```

## 项目结构

```
gitMergeTerminal/
├── src/
│   └── index.ts       # TypeScript 源代码
├── dist/              # 编译后的 JavaScript 文件
├── package.json       # 项目配置
├── tsconfig.json      # TypeScript 配置
└── README.md          # 说明文档
```

## 开发

- 使用 TypeScript 5.0+ 开发
- 严格类型检查
- 支持 ES2020 语法
- 包含完整的类型定义 