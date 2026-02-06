#!/usr/bin/env python3
"""
本地测试脚本 - 使用优化后的 prompt 测试图像融合
运行: python3 test-merge-local.py
"""

import os
import sys
import json
import base64
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path

# API Key - 从环境变量获取
API_KEY = os.environ.get('DASHSCOPE_API_KEY', '')

if not API_KEY:
    print('错误: 请设置 DASHSCOPE_API_KEY 环境变量')
    print('运行方式: DASHSCOPE_API_KEY=your_key python3 test-merge-local.py')
    sys.exit(1)

# 图片路径
SCRIPT_DIR = Path(__file__).parent
IMAGES_DIR = SCRIPT_DIR / 'images'
BACKGROUND_IMAGE = IMAGES_DIR / 'backyard view point 1.webp'
SUNROOM_IMAGE = IMAGES_DIR / 'sun room image.jpg'

def image_to_base64(file_path):
    """将图片转换为 base64"""
    with open(file_path, 'rb') as f:
        image_data = f.read()
    
    ext = file_path.suffix.lower()
    mime_types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp'
    }
    mime_type = mime_types.get(ext, 'image/jpeg')
    
    base64_str = base64.b64encode(image_data).decode('utf-8')
    return f'data:{mime_type};base64,{base64_str}'

# 优化后的 prompt
OPTIMIZED_PROMPT = """请将第二张图片中的阳光房（sunroom/glass conservatory）融合到第一张图片的后院场景中。

核心要求：
1. 【位置】阳光房必须紧贴主建筑物墙壁，作为房屋的延伸部分（attached sunroom），不能独立放置在草坪中央
2. 【大小】阳光房尺寸要适中，宽度不超过主建筑的1/3，高度与主建筑一层齐平，保持合理比例
3. 【透视】阳光房的透视角度必须与主建筑保持一致
4. 【融合】添加自然过渡，包括阴影、光照方向一致性

禁止事项 - NO 喧宾夺主：
- 阳光房不能比主建筑更突出或更大
- 阳光房不能放在草坪中央或离主建筑太远
- 不能破坏原有后院的整体布局"""

def call_dashscope_api():
    """调用 DashScope API"""
    print('=== 开始测试图像融合 ===')
    print(f'背景图: {BACKGROUND_IMAGE}')
    print(f'阳光房图: {SUNROOM_IMAGE}')
    print(f'\n优化后的 Prompt:\n{OPTIMIZED_PROMPT}')
    print('\n正在调用 API...')
    
    background_base64 = image_to_base64(BACKGROUND_IMAGE)
    sunroom_base64 = image_to_base64(SUNROOM_IMAGE)
    
    request_body = {
        'model': 'qwen-image-edit-max',
        'input': {
            'messages': [
                {
                    'role': 'user',
                    'content': [
                        {'image': background_base64},
                        {'image': sunroom_base64},
                        {'text': OPTIMIZED_PROMPT}
                    ]
                }
            ]
        },
        'parameters': {
            'n': 1,
            'size': '1024*1024'
        }
    }
    
    data = json.dumps(request_body).encode('utf-8')
    
    req = urllib.request.Request(
        'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
        data=data,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {API_KEY}'
        },
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f'HTTP 错误 {e.code}: {error_body}')
        return json.loads(error_body) if error_body else None

def download_image(url, output_path):
    """下载图片"""
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        with open(output_path, 'wb') as f:
            f.write(response.read())
    return output_path

def main():
    try:
        response = call_dashscope_api()
        print(f'\nAPI 响应: {json.dumps(response, indent=2, ensure_ascii=False)}')
        
        # 提取图像 URL
        result_image = None
        
        if response and response.get('output', {}).get('choices'):
            content = response['output']['choices'][0].get('message', {}).get('content', [])
            if isinstance(content, list):
                for item in content:
                    if isinstance(item, dict) and 'image' in item:
                        result_image = item['image']
                        break
        
        if not result_image and response and response.get('output', {}).get('results'):
            results = response['output']['results']
            if results:
                result_image = results[0].get('url') if isinstance(results[0], dict) else results[0]
        
        if result_image:
            # 生成带时间戳的文件名
            timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
            output_filename = f'merged-sunroom-optimized-{timestamp}.png'
            output_path = IMAGES_DIR / output_filename
            
            if result_image.startswith('http'):
                print('\n正在下载生成的图片...')
                download_image(result_image, output_path)
                print(f'✅ 图片已保存到: {output_path}')
            elif result_image.startswith('data:'):
                # Base64 格式
                base64_data = result_image.split(',', 1)[1]
                with open(output_path, 'wb') as f:
                    f.write(base64.b64decode(base64_data))
                print(f'✅ 图片已保存到: {output_path}')
            else:
                print(f'图片 URL: {result_image}')
        else:
            print('❌ 未能从响应中提取图片')
            
    except Exception as e:
        print(f'❌ 错误: {e}')
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
