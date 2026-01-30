#!/bin/bash

# N-Site-Prototype 部署脚本

echo "🚀 开始部署 N-Site-Prototype 项目..."

# 检查Git状态
if [[ $(git status --porcelain) ]]; then
  echo "📝 检测到未提交的更改，正在提交..."
  git add .
  git commit -m "Auto deploy: $(date)"
fi

# 推送到GitHub
echo "📤 正在推送到GitHub..."
git push origin main

if [ $? -eq 0 ]; then
  echo "✅ 代码已成功推送到GitHub!"
  echo "🌐 访问地址: https://websterzhangsh.github.io/N-Site-Prototype/"
  echo ""
  echo "💡 下一步设置GitHub Pages:"
  echo "1. 访问 https://github.com/websterzhangsh/N-Site-Prototype/settings/pages"
  echo "2. 选择 'Deploy from a branch'"
  echo "3. 选择 'main' 分支"
  echo "4. 点击 'Save'"
else
  echo "❌ 推送失败，请检查网络连接和权限设置"
fi