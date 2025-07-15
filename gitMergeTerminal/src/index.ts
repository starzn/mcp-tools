#!/usr/bin/env node

import { execSync } from 'child_process';

interface MergeOptions {
  squash?: boolean;
  commitMessage?: string;
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

function mergeToBranch(targetBranch: string, options: MergeOptions = {}): void {
  const { squash = false, commitMessage = '' } = options;
  const sourceBranch = getCurrentBranch();
  
  if (sourceBranch === targetBranch) {
    console.log(`当前已在目标分支 ${targetBranch}，无需合并`);
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
}

// 解析命令行参数
const args: string[] = process.argv.slice(2);
let toTest = false;
let squash = false;
let commitMessage = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--test') toTest = true;
  if (args[i] === '--squash') squash = true;
  if (args[i] === '-m' && i + 1 < args.length) {
    commitMessage = args[i + 1]!;
    i++;
  }
}

try {
  const targetBranch = toTest ? 'test' : getMainBranch();
  mergeToBranch(targetBranch, { squash, commitMessage });
} catch (e) {
  const error = e as Error;
  console.error('合并失败:', error.message);
  process.exit(1);
} 