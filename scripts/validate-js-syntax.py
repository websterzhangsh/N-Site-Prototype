#!/usr/bin/env python3
"""
validate-js-syntax.py — 从 HTML 文件提取所有 <script> 块并验证 JS 语法
防止因语法错误导致整个页面 JavaScript 瘫痪的回归问题。

用法:
  python3 scripts/validate-js-syntax.py                        # 默认检查 company-operations.html
  python3 scripts/validate-js-syntax.py path/to/file.html      # 检查指定文件

退出码:
  0 — 所有块语法正确
  1 — 发现语法错误
  2 — 找不到 Node.js（跳过检查并警告）
"""

import re
import os
import sys
import glob
import shutil
import subprocess
import tempfile

# ── 配置 ──────────────────────────────────────────
DEFAULT_FILE = "company-operations.html"
# Node.js 搜索路径（按优先级）
NODE_SEARCH_PATHS = [
    # 系统 PATH
    None,  # shutil.which('node')
    # NVM 安装
    os.path.expanduser("~/.nvm/versions/node/*/bin/node"),
    # Homebrew
    "/usr/local/bin/node",
    "/opt/homebrew/bin/node",
    # 临时下载的 Node（Qoder 会话用）
    "/tmp/node-v*/bin/node",
]


def find_node():
    """查找 Node.js 可执行文件"""
    # 1. 系统 PATH
    node = shutil.which("node")
    if node:
        return node
    # 2. 已知路径 + glob 模式
    for pattern in NODE_SEARCH_PATHS[1:]:
        matches = sorted(glob.glob(pattern), reverse=True)
        if matches:
            return matches[0]
    return None


def extract_inline_scripts(html_content, filepath):
    """
    提取所有内联 <script> 块（跳过 <script src="..."> 外部脚本）
    返回: [(block_index, start_line, end_line, js_code), ...]
    """
    # 找所有 script 标签，然后过滤掉有 src 属性的外部脚本
    tag_pattern = re.compile(
        r"<script(\s[^>]*)?>(.+?)</script>", re.DOTALL | re.IGNORECASE
    )

    blocks = []
    for match in tag_pattern.finditer(html_content):
        attrs = match.group(1) or ""
        code = match.group(2)

        # 跳过外部脚本
        if re.search(r'\bsrc\s*=', attrs, re.IGNORECASE):
            continue

        # 跳过空块或只有空白的块
        if not code.strip():
            continue

        # 计算起始行号
        start_pos = match.start(2)
        start_line = html_content[:start_pos].count("\n") + 1
        end_line = start_line + code.count("\n")

        blocks.append(
            {
                "code": code,
                "start_line": start_line,
                "end_line": end_line,
                "char_count": len(code),
                "line_count": code.count("\n") + 1,
            }
        )

    return blocks


def validate_js_syntax(node_bin, js_code, block_label):
    """
    使用 Node.js vm.Script 验证 JS 语法
    返回: (ok: bool, error_msg: str | None)
    """
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".js", delete=False, encoding="utf-8"
    ) as f:
        f.write(js_code)
        tmp_path = f.name

    try:
        result = subprocess.run(
            [
                node_bin,
                "-e",
                f"""
const fs = require('fs');
const vm = require('vm');
const code = fs.readFileSync('{tmp_path}', 'utf8');
try {{
    new vm.Script(code, {{ filename: '{block_label}' }});
    process.exit(0);
}} catch(e) {{
    // 输出格式化的错误信息
    const lines = code.split('\\n');
    let ctx = '';
    if (e.lineNumber) {{
        const ln = e.lineNumber;
        const start = Math.max(0, ln - 3);
        const end = Math.min(lines.length, ln + 2);
        for (let i = start; i < end; i++) {{
            const marker = (i === ln - 1) ? '>>>' : '   ';
            ctx += marker + ' ' + (i + 1) + ' | ' + lines[i] + '\\n';
        }}
    }}
    console.error(e.message);
    if (ctx) console.error('\\n' + ctx);
    process.exit(1);
}}
""",
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode == 0:
            return True, None
        else:
            return False, result.stderr.strip()
    except subprocess.TimeoutExpired:
        return False, "验证超时（10s）"
    except Exception as e:
        return False, f"验证失败: {e}"
    finally:
        os.unlink(tmp_path)


def main():
    # ── 解析参数 ──
    target = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_FILE
    if not os.path.isabs(target):
        # 相对路径：基于 git repo 根目录
        repo_root = (
            subprocess.check_output(
                ["git", "rev-parse", "--show-toplevel"], text=True
            ).strip()
        )
        target = os.path.join(repo_root, target)

    if not os.path.exists(target):
        print(f"[validate-js] 文件不存在: {target}")
        sys.exit(1)

    # ── 查找 Node.js ──
    node_bin = find_node()
    if not node_bin:
        print(
            "[validate-js] ⚠️  找不到 Node.js — 跳过语法检查"
        )
        print(
            "  提示: 安装 Node.js 后 pre-commit hook 将自动启用语法验证"
        )
        sys.exit(2)

    # ── 读取文件 ──
    with open(target, "r", encoding="utf-8") as f:
        html = f.read()

    total_lines = html.count("\n") + 1
    filename = os.path.basename(target)

    # ── 提取 script 块 ──
    blocks = extract_inline_scripts(html, target)
    if not blocks:
        print(f"[validate-js] {filename}: 未找到内联 <script> 块")
        sys.exit(0)

    # ── 逐块验证 ──
    print(
        f"[validate-js] {filename} ({total_lines} 行) — 检查 {len(blocks)} 个 <script> 块..."
    )

    errors = []
    for i, block in enumerate(blocks):
        label = f"block-{i+1} (L{block['start_line']}–L{block['end_line']}, {block['line_count']} 行)"
        ok, err = validate_js_syntax(node_bin, block["code"], label)

        if ok:
            print(f"  ✅ Block {i+1}: L{block['start_line']}–{block['end_line']} ({block['line_count']} 行) — OK")
        else:
            print(f"  ❌ Block {i+1}: L{block['start_line']}–{block['end_line']} ({block['line_count']} 行) — SYNTAX ERROR")
            if err:
                # 缩进错误信息
                for line in err.split("\n"):
                    print(f"     {line}")
            errors.append((i + 1, block, err))

    # ── 结果汇总 ──
    print()
    if errors:
        print(
            f"💥 {len(errors)}/{len(blocks)} 个 script 块有语法错误 — commit 被阻止"
        )
        print(
            "  修复上述错误后重试 git commit。"
        )
        print(
            "  如需临时跳过检查: git commit --no-verify"
        )
        sys.exit(1)
    else:
        print(f"✅ 全部 {len(blocks)} 个 script 块语法正确")
        sys.exit(0)


if __name__ == "__main__":
    main()
