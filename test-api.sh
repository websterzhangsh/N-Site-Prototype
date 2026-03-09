#!/bin/bash
# 直接测试阿里通义 qwen-image-edit-max API

API_KEY="sk-2a49382372b64f8ea457eb895b5448d9"

# 使用测试图片 URL（阿里云官方示例）
curl -X POST "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "qwen-image-edit-max",
    "input": {
      "messages": [
        {
          "role": "user",
          "content": [
            {"image": "https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/4601562561/p432880.png"},
            {"text": "请将这张图片中的天空变成日落时分的橙红色"}
          ]
        }
      ]
    },
    "parameters": {
      "n": 1
    }
  }' | python3 -m json.tool
