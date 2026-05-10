#!/usr/bin/env python3
"""
gitea-code-scanner.py - 扫描 Gitea 代码仓库并登记索引
定时任务：每小时扫描一次
"""
import requests
import json
import time
import os
from datetime import datetime

GITEA_URL = "https://git.osc.life"
TOKEN = "abf62dcacd144af029a87674ee4f045d9fb451ce"
CODE_MEMORY_PATH = "/home/yushanhe/.hermes/repos/code-memory-shared"
BUSINESS_MEMORY_PATH = "/home/yushanhe/.hermes/repos/business-memory-shared"

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# 业务关键词映射
BUSINESS_KEYWORDS = {
    "ai": ["ai", "llm", "gpt", "agent", "agentic", "openai", "deepseek", "claude"],
    "web": ["web", "frontend", "react", "vue", "angular", "html", "css"],
    "backend": ["api", "server", "backend", "fastapi", "flask", "spring", "node"],
    "robot": ["robot", "rpa", "automation", "bot", "crawl"],
    "docker": ["docker", "container", "k8s", "kubernetes", "deploy"],
    "data": ["data", "ml", "machine-learning", "deep-learning", "torch", "tensorflow"],
    "tool": ["tool", "cli", "command", "utility", "script"],
    "awesome": ["awesome", "list", "curated", "collection"],
}

def get_all_repos():
    """获取用户所有仓库"""
    repos = []
    page = 1
    while True:
        resp = requests.get(
            f"{GITEA_URL}/api/v1/user/repos",
            headers=HEADERS,
            params={"per_page": 100, "page": page}
        )
        if resp.status_code != 200:
            break
        data = resp.json()
        if not data:
            break
        repos.extend(data)
        page += 1
    return repos

def classify_repo(name, description=""):
    """根据仓库名和描述分类业务类型"""
    name_lower = name.lower()
    desc_lower = (description or "").lower()
    text = f"{name_lower} {desc_lower}"

    categories = []
    for category, keywords in BUSINESS_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                categories.append(category)
                break
    return categories if categories else ["uncategorized"]

def load_index_file(path):
    """加载索引文件"""
    index_file = os.path.join(path, "REPO_INDEX.md")
    if os.path.exists(index_file):
        with open(index_file, 'r') as f:
            content = f.read()
        # 提取已登记的仓库名
        registered = set()
        for line in content.split('\n'):
            if line.startswith('- '):
                parts = line.split('|')
                if len(parts) > 0:
                    registered.add(parts[0].replace('- ', '').strip())
        return registered, index_file, content
    return set(), index_file, f"# 仓库索引\n\n## 更新于 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n| 仓库 | 类型 | 业务关联 | 添加时间 |\n|------|------|----------|----------|\n"

def update_code_index(repos):
    """更新 code-memory-shared 索引"""
    print(f"\n📝 更新 code-memory-shared 索引...")

    registered, index_file, content = load_index_file(CODE_MEMORY_PATH)
    lines = [f"# 仓库索引\n\n## 更新于 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"]
    lines.append("| 仓库 | 类型 | 描述 | 添加时间 |\n")
    lines.append("|------|------|------|----------|\n")

    new_count = 0
    for repo in repos:
        name = repo['name']
        desc = repo.get('description', '') or ''
        private = repo.get('private', False)
        repo_type = "私有" if private else "公开"
        timestamp = datetime.now().strftime('%Y-%m-%d')

        if name not in registered:
            registered.add(name)
            new_count += 1

        lines.append(f"| {name} | {repo_type} | {desc[:50]} | {timestamp} |\n")

    with open(index_file, 'w') as f:
        f.writelines(lines)

    print(f"  ✅ 新增 {new_count} 个仓库, 共 {len(repos)} 个仓库已索引")
    return new_count

def update_business_index(repos):
    """更新 business-memory-shared 索引"""
    print(f"\n📝 更新 business-memory-shared 索引...")

    index_file = os.path.join(BUSINESS_MEMORY_PATH, "BUSINESS_ASSOCIATION.md")
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    # 按业务分类整理
    business_map = {cat: [] for cat in BUSINESS_KEYWORDS.keys()}
    business_map["uncategorized"] = []

    for repo in repos:
        categories = classify_repo(repo['name'], repo.get('description', ''))
        for cat in categories:
            if cat in business_map:
                business_map[cat].append(f"- {repo['name']}")

    # 生成关联文档
    lines = [f"# 业务关联索引\n\n## 更新于 {timestamp}\n\n"]
    for cat, items in business_map.items():
        if items:
            lines.append(f"## {cat.upper()}\n\n")
            lines.extend(items)
            lines.append("\n")

    with open(index_file, 'w') as f:
        f.writelines(lines)

    categorized = sum(1 for v in business_map.values() if v)
    print(f"  ✅ 已将 {categorized} 个业务类别关联到仓库")
    return categorized

def git_commit(path, message):
    """提交到 Git"""
    import subprocess
    os.chdir(path)
    subprocess.run(["git", "add", "-A"], capture_output=True)
    result = subprocess.run(["git", "diff", "--cached", "--quiet"], capture_output=True)
    if result.returncode == 0:
        print(f"  ⏭️  没有变更，跳过提交")
        return
    subprocess.run(["git", "commit", "-m", message], capture_output=True)
    subprocess.run(["git", "push", "origin", "main"], capture_output=True)
    print(f"  ✅ 已提交并推送")

def main():
    print("=" * 60)
    print("🔍 Gitea 代码仓库扫描器")
    print("=" * 60)
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # 1. 获取所有仓库
    print("\n📡 获取 Gitea 仓库列表...")
    repos = get_all_repos()
    print(f"  ✅ 共发现 {len(repos)} 个仓库")

    # 过滤掉 memory 相关仓库
    code_repos = [r for r in repos if 'memory' not in r['name'].lower()]
    print(f"  📦 其中 {len(code_repos)} 个为代码仓库（排除 memory 仓库）")

    if not code_repos:
        print("  ⏭️  没有新代码仓库需要登记")
        return

    # 2. 更新 code-memory-shared 索引
    new_count = update_code_index(code_repos)

    # 3. 更新 business-memory-shared 关联
    update_business_index(code_repos)

    # 4. Git 提交
    if new_count > 0:
        print("\n📤 提交到 Git...")
        msg = f"[AUTO] 扫描登记 {new_count} 个新代码仓库 - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        git_commit(CODE_MEMORY_PATH, msg)
        git_commit(BUSINESS_MEMORY_PATH, msg)

    print("\n" + "=" * 60)
    print("✅ 扫描完成")
    print("=" * 60)

if __name__ == "__main__":
    main()
