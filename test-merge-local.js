/**
 * 本地测试脚本 - 使用优化后的 prompt 测试图像融合
 * 运行: node test-merge-local.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// API Key - 从环境变量获取或直接设置
const API_KEY = process.env.DASHSCOPE_API_KEY || '';

if (!API_KEY) {
  console.error('错误: 请设置 DASHSCOPE_API_KEY 环境变量');
  console.log('运行方式: DASHSCOPE_API_KEY=your_key node test-merge-local.js');
  process.exit(1);
}

// 图片路径
const IMAGES_DIR = path.join(__dirname, 'images');
const BACKGROUND_IMAGE = path.join(IMAGES_DIR, 'backyard.webp');
const SUNROOM_IMAGE = path.join(IMAGES_DIR, 'sun room image.jpg');

// 将图片转换为 base64
function imageToBase64(filePath) {
  const imageBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  let mimeType = 'image/jpeg';
  if (ext === '.png') mimeType = 'image/png';
  else if (ext === '.webp') mimeType = 'image/webp';
  return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
}

// 优化后的 prompt
const OPTIMIZED_PROMPT = `请将第二张图片中的阳光房（sunroom/glass conservatory）融合到第一张图片的后院场景中。

核心要求：
1. 【位置】阳光房必须紧贴主建筑物墙壁，作为房屋的延伸部分（attached sunroom），不能独立放置在草坪中央
2. 【大小】阳光房尺寸要适中，宽度不超过主建筑的1/3，高度与主建筑一层齐平，保持合理比例
3. 【透视】阳光房的透视角度必须与主建筑保持一致
4. 【融合】添加自然过渡，包括阴影、光照方向一致性

禁止事项 - NO 喧宾夺主：
- 阳光房不能比主建筑更突出或更大
- 阳光房不能放在草坪中央或离主建筑太远
- 不能破坏原有后院的整体布局`;

async function callDashScopeAPI() {
  console.log('=== 开始测试图像融合 ===');
  console.log('背景图:', BACKGROUND_IMAGE);
  console.log('阳光房图:', SUNROOM_IMAGE);
  console.log('\n优化后的 Prompt:\n', OPTIMIZED_PROMPT);
  console.log('\n正在调用 API...');

  const backgroundBase64 = imageToBase64(BACKGROUND_IMAGE);
  const sunroomBase64 = imageToBase64(SUNROOM_IMAGE);

  const requestBody = JSON.stringify({
    model: 'qwen-image-edit-max',
    input: {
      messages: [
        {
          role: 'user',
          content: [
            { image: backgroundBase64 },
            { image: sunroomBase64 },
            { text: OPTIMIZED_PROMPT }
          ]
        }
      ]
    },
    parameters: {
      n: 1,
      size: '1024*1024'
    }
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'dashscope.aliyuncs.com',
      port: 443,
      path: '/api/v1/services/aigc/multimodal-generation/generation',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          reject(new Error('JSON 解析失败: ' + data));
        }
      });
    });

    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
}

async function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : require('http');
    const file = fs.createWriteStream(outputPath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // 处理重定向
        downloadImage(response.headers.location, outputPath).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(outputPath);
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

async function main() {
  try {
    const response = await callDashScopeAPI();
    console.log('\nAPI 响应:', JSON.stringify(response, null, 2));

    // 提取图像 URL
    let resultImage = null;
    
    if (response.output?.choices?.[0]?.message?.content) {
      const content = response.output.choices[0].message.content;
      if (Array.isArray(content)) {
        for (const item of content) {
          if (item.image) {
            resultImage = item.image;
            break;
          }
        }
      }
    }
    
    if (!resultImage && response.output?.results?.[0]) {
      resultImage = response.output.results[0].url || response.output.results[0];
    }

    if (resultImage) {
      // 生成带时间戳的文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const outputFileName = `merged-sunroom-optimized-${timestamp}.png`;
      const outputPath = path.join(IMAGES_DIR, outputFileName);

      if (resultImage.startsWith('http')) {
        console.log('\n正在下载生成的图片...');
        await downloadImage(resultImage, outputPath);
        console.log('✅ 图片已保存到:', outputPath);
      } else if (resultImage.startsWith('data:')) {
        // Base64 格式
        const base64Data = resultImage.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));
        console.log('✅ 图片已保存到:', outputPath);
      } else {
        console.log('图片 URL:', resultImage);
      }
    } else {
      console.error('❌ 未能从响应中提取图片');
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

main();
