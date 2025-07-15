#!/usr/bin/env node

import { execSync } from 'child_process';

interface MergeOptions {
  squash?: boolean;
  commitMessage?: string;
  push?: boolean;
}

function run(cmd: string): void {
  execSync(cmd, { stdio: 'inherit' });
}

function getCurrentBranch(): string {
  return execSync('git branch --show-current').toString().trim();
}

function getMainBranch(): string {
  try {
    run('git show-ref --verify refs/heads/master');
    return 'master';
  } catch {
    try {
      run('git show-ref --verify refs/heads/main');
      return 'main';
    } catch {
      throw new Error('未找到主干分支(master或main)');
    }
  }
}

function pushToRemote(branch: string): void {
  try {
    console.log(`正在推送 ${branch} 分支到远程仓库...`);
    run(`git push origin ${branch}`);
    console.log(`成功推送 ${branch} 分支到远程仓库`);
  } catch (error) {
    console.error(`推送失败:`, error);
    throw error;
  }
}

function mergeToBranch(targetBranch: string, options: MergeOptions = {}): void {
  const { squash = false, commitMessage = '', push = false } = options;
  const sourceBranch = getCurrentBranch();
  
  if (sourceBranch === targetBranch) {
    console.log(`当前已在目标分支 ${targetBranch}，无需合并`);
    if (push) {
      pushToRemote(targetBranch);
    }
    return;
  }

  // 切换到目标分支
  run(`git checkout ${targetBranch}`);
  // 拉取最新代码
  run(`git pull origin ${targetBranch}`);

  // 构建合并命令
  let mergeCmd = `git merge${squash ? ' --squash' : ''} ${sourceBranch}`;
  if (!squash && commitMessage) {
    mergeCmd += ` -m "${commitMessage}"`;
  }
  run(mergeCmd);

  // squash 合并需要手动提交
  if (squash) {
    const msg = commitMessage || `Merge branch '${sourceBranch}' into ${targetBranch}`;
    run(`git commit -m "${msg}"`);
  }

  console.log(`成功将分支 '${sourceBranch}' 合并到 '${targetBranch}'`);

  // 如果需要推送到远程
  if (push) {
    pushToRemote(targetBranch);
  }
}

// 解析命令行参数
const args: string[] = process.argv.slice(2);
let toTest = false;
let squash = false;
let commitMessage = '';
let push = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--test') toTest = true;
  if (args[i] === '--squash') squash = true;
  if (args[i] === '--push') push = true;
  if (args[i] === '-m' && i + 1 < args.length) {
    commitMessage = args[i + 1]!;
    i++;
  }
}

// 显示帮助信息
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Git合并工具使用说明：

用法: git-merge [选项]

选项:
  --test        合并到test分支（默认合并到main/master）
  --squash      使用squash合并
  --push        合并完成后推送到远程仓库
  -m <message>  指定合并提交信息
  --help, -h    显示帮助信息

示例:
  git-merge                           # 合并到主干分支
  git-merge --test                    # 合并到test分支
  git-merge --squash -m "feat: 新功能"  # squash合并并指定提交信息
  git-merge --push                    # 合并后推送到远程
  git-merge --test --push             # 合并到test分支并推送到远程
  `);
  process.exit(0);
}

try {
  const targetBranch = toTest ? 'test' : getMainBranch();
  mergeToBranch(targetBranch, { squash, commitMessage, push });
} catch (e) {
  const error = e as Error;
  console.error('操作失败:', error.message);
  process.exit(1);
} 