from typing import Any, Optional
import subprocess
import os
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP server
mcp = FastMCP("git-merge")

def run_git_command(command: list[str]) -> str:
    """执行Git命令"""
    try:
        result = subprocess.run(
            command, capture_output=True, text=True, check=True, cwd=os.getcwd()
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        raise Exception(f"Git命令执行失败: {e.stderr}")

def get_current_branch() -> str:
    """获取当前分支名"""
    return run_git_command(["git", "branch", "--show-current"])

def get_main_branch() -> str:
    """获取主干分支名"""
    try:
        # 尝试获取main分支
        run_git_command(["git", "show-ref", "--verify", "refs/heads/main"])
        return "main"
    except:
        try:
            # 尝试获取master分支
            run_git_command(["git", "show-ref", "--verify", "refs/heads/master"])
            return "master"
        except:
            raise Exception("未找到主干分支(main或master)")

@mcp.tool()
async def merge_to_main(source_branch: Optional[str] = None, commit_message: str = "", squash: bool = False) -> str:
    """将当前分支合并到主干分支(main/master)
    
    Args:
        source_branch: 源分支名称，如果不指定则使用当前分支
        commit_message: 合并提交信息
        squash: 是否压缩合并
    """
    try:
        # 获取源分支
        if not source_branch:
            source_branch = get_current_branch()

        # 获取主干分支
        main_branch = get_main_branch()

        if source_branch == main_branch:
            return f"当前已在主干分支 {main_branch}，无需合并"

        # 确保工作区干净
        status = run_git_command(["git", "status", "--porcelain"])
        if status:
            return "工作区有未提交的更改，请先提交或暂存更改"

        # 切换到主干分支
        run_git_command(["git", "checkout", main_branch])

        # 拉取最新代码
        run_git_command(["git", "pull", "origin", main_branch])

        # 执行合并
        merge_cmd = ["git", "merge"]
        if squash:
            merge_cmd.append("--squash")
        if commit_message:
            merge_cmd.extend(["-m", commit_message])
        merge_cmd.append(source_branch)

        run_git_command(merge_cmd)

        # 如果是压缩合并且没有提供提交信息，需要手动提交
        if squash and not commit_message:
            run_git_command([
                "git",
                "commit",
                "-m",
                f"Merge branch '{source_branch}' into {main_branch}",
            ])

        return f"成功将分支 '{source_branch}' 合并到主干分支 '{main_branch}'"

    except Exception as e:
        return f"合并失败: {str(e)}"

@mcp.tool()
async def merge_to_test(source_branch: Optional[str] = None, test_branch: str = "test", commit_message: str = "", squash: bool = False) -> str:
    """将当前分支合并到测试分支
    
    Args:
        source_branch: 源分支名称，如果不指定则使用当前分支
        test_branch: 测试分支名称，默认为test
        commit_message: 合并提交信息
        squash: 是否压缩合并
    """
    try:
        # 获取源分支
        if not source_branch:
            source_branch = get_current_branch()

        if source_branch == test_branch:
            return f"当前已在测试分支 {test_branch}，无需合并"

        # 确保工作区干净
        status = run_git_command(["git", "status", "--porcelain"])
        if status:
            return "工作区有未提交的更改，请先提交或暂存更改"

        # 检查测试分支是否存在，不存在则创建
        try:
            run_git_command(["git", "show-ref", "--verify", f"refs/heads/{test_branch}"])
        except:
            # 创建测试分支
            main_branch = get_main_branch()
            run_git_command(["git", "checkout", "-b", test_branch, main_branch])

        # 切换到测试分支
        run_git_command(["git", "checkout", test_branch])

        # 拉取最新代码（如果远程存在）
        try:
            run_git_command(["git", "pull", "origin", test_branch])
        except:
            pass  # 远程可能不存在测试分支

        # 执行合并
        merge_cmd = ["git", "merge"]
        if squash:
            merge_cmd.append("--squash")
        if commit_message:
            merge_cmd.extend(["-m", commit_message])
        merge_cmd.append(source_branch)

        run_git_command(merge_cmd)

        # 如果是压缩合并且没有提供提交信息，需要手动提交
        if squash and not commit_message:
            run_git_command([
                "git",
                "commit",
                "-m",
                f"Merge branch '{source_branch}' into {test_branch}",
            ])

        return f"成功将分支 '{source_branch}' 合并到测试分支 '{test_branch}'"

    except Exception as e:
        return f"合并失败: {str(e)}"

if __name__ == "__main__":
    # Initialize and run the server
    mcp.run(transport='stdio')
