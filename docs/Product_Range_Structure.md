# 产品展示区域结构（Product Range Section）

> 本文档记录首页"Explore Our Product Range"区域中每个产品标签页的结构、场景分类、以及使用的素材文件路径。
> 供后续开发和内容维护使用。

---

## 一、整体结构概览

```
Product Range Section
├── Sunroom（阳光房）
│   ├── Residential（住宅）
│   │   ├── 图片 × 3（Original Space / AI Design Opened / AI Design Closed）
│   │   └── 视频 × 1（Terrace / Balcony）
│   └── Commercial（商业）
│       └── 视频 × 1（Rooftop Restaurant）
│
├── Pergola（凉亭）
│   ├── Residential（住宅）
│   │   ├── 图片 × 2（Before / After）
│   │   └── 视频 × 1（3D Product Animation）
│   └── Commercial（商业）
│       ├── 图片 × 2（Before / After）
│       └── 视频 × 1（3D Product Animation）
│
├── Zip Blinds（防风卷帘）
│   ├── Residence — 02 系列（别墅）
│   │   ├── 图片 × 2（Before / After）
│   │   └── 视频 × 1（Animation）
│   └── Pergola — 01 系列（凉亭）
│       ├── 图片 × 2（Before / After）
│       └── 视频 × 1（Animation）
│
└── ADU（附属住宅单元）
    └── （无场景分标签）
        └── 视频 × 1（Product Showcase）
```

---

## 二、各产品详细文件清单

### 1. Sunroom（阳光房）

#### Residential（住宅）

| 卡片位置 | 标签 | 标题（EN） | 标题（ZH） | 类型 | 文件路径（public 目录） | 源文件路径（images 目录） |
|---------|------|-----------|-----------|------|----------------------|------------------------|
| 左 | Before | Original Space | 原始空间 | 图片 | `public/images/products/sunroom/matrix/Sunroom-01-Before.jpg` | `images/Product Matrix/SunRoom/Sunroom-01-Before.jpg` |
| 中 | After | AI Design (Opened) | AI 设计（开启） | 图片 | `public/images/products/sunroom/matrix/Sunroom-01-After-open.jpg` | `images/Product Matrix/SunRoom/Sunroom-01-After-open.jpg` |
| 右 | After | AI Design (Closed) | AI 设计（关闭） | 图片 | `public/images/products/sunroom/matrix/Sunroom-01-After-Closed.jpg` | `images/Product Matrix/SunRoom/Sunroom-01-After-Closed.jpg` |
| 下方居中 | Video | Terrace / Balcony | 阳台露台 | 视频 | `public/images/products/sunroom/matrix/Trim02-Residential-Terrace-Balcony.mp4` | `images/Product Matrix/SunRoom/Trim02-Residential-Terrace-Balcony.mp4` |

#### Commercial（商业）

| 卡片位置 | 标签 | 标题（EN） | 标题（ZH） | 类型 | 文件路径（public 目录） | 源文件路径（images 目录） |
|---------|------|-----------|-----------|------|----------------------|------------------------|
| 居中 | Video | Rooftop Restaurant | 屋顶餐厅 | 视频 | `public/images/products/sunroom/matrix/Trim01-Comercial-Rooftop-Restaurant.mp4` | `images/Product Matrix/SunRoom/Trim01-Comercial-Rooftop-Restaurant.mp4` |

---

### 2. Pergola（凉亭）

#### Residential（住宅）

| 卡片位置 | 标签 | 标题（EN） | 标题（ZH） | 类型 | 文件路径（public 目录） | 源文件路径（images 目录） |
|---------|------|-----------|-----------|------|----------------------|------------------------|
| 左 | Before | Original Space | 原始空间 | 图片 | `public/images/products/pergola/matrix/Residential-Pergola-Before-Logo.jpg` | `images/Product Matrix/Pergola/Before-Logo修正版Residential-Pergola.jpg` |
| 中 | After | AI Design Render | AI 设计渲染 | 图片 | `public/images/products/pergola/matrix/Residential-Pergola-After-Logo.jpg` | `images/Product Matrix/Pergola/After-Logo修正版Residential-Pergola.jpg` |
| 右 | Animation | 3D Product Animation | 3D 产品动画 | 视频 | `public/images/products/pergola/matrix/Residential Pergola.mp4` | `images/Product Matrix/Pergola/Residential Pergola.mp4` |

> 注：Residential 图片使用 `object-bottom` 确保底部 Nestopia Logo 可见。

#### Commercial（商业）

| 卡片位置 | 标签 | 标题（EN） | 标题（ZH） | 类型 | 文件路径（public 目录） | 源文件路径（images 目录） |
|---------|------|-----------|-----------|------|----------------------|------------------------|
| 左 | Before | Original Commercial Space | 商业空间原貌 | 图片 | `public/images/products/pergola/matrix/Commercial Pergola - before design.jpg` | `images/Product Matrix/Pergola/Commercial Pergola - before design.jpg` |
| 中 | After | AI Commercial Design | AI 商业设计方案 | 图片 | `public/images/products/pergola/matrix/Commercial Pergola - after design.jpg` | `images/Product Matrix/Pergola/Commercial Pergola - after design.jpg` |
| 右 | Animation | 3D Product Animation | 3D 产品动画 | 视频 | `public/images/products/pergola/matrix/Commercial Pergola.mp4` | `images/Product Matrix/Pergola/Commercial Pergola.mp4` |

---

### 3. Zip Blinds（防风卷帘）

#### Residence — 02 系列（别墅）

| 卡片位置 | 标签 | 标题（EN） | 标题（ZH） | 类型 | 文件路径 |
|---------|------|-----------|-----------|------|---------|
| 左 | Before | Open Patio | 开放式露台 | 图片 | `/images/products/zip-blinds/zipblinds-02-before.jpg` |
| 中 | After | With Zip Blinds | Zip Blinds 安装后 | 图片 | `/images/products/zip-blinds/zipblinds-02-after.jpg` |
| 右 | Animation | Zip Blinds in Action | Zip Blinds 动画展示 | 视频 | `/images/products/zip-blinds/zipblinds-02-animation.mp4` |

#### Pergola — 01 系列（凉亭）

| 卡片位置 | 标签 | 标题（EN） | 标题（ZH） | 类型 | 文件路径 |
|---------|------|-----------|-----------|------|---------|
| 左 | Before | Open Pergola | 开放式凉亭 | 图片 | `/images/products/zip-blinds/zipblinds-01-before.jpg` |
| 中 | After | With Zip Blinds | Zip Blinds 安装后 | 图片 | `/images/products/zip-blinds/zipblinds-01-after.jpg` |
| 右 | Animation | Zip Blinds in Action | Zip Blinds 动画展示 | 视频 | `/images/products/zip-blinds/zipblinds-01-animation.mp4` |

> 注：Zip Blinds 文件路径使用 `/images/` 前缀（非 `public/`），与其他产品路径规范略有不同，后续可统一。

---

### 4. ADU（附属住宅单元）

> 当前无场景分标签。

| 卡片位置 | 标签 | 标题（EN） | 标题（ZH） | 类型 | 文件路径（public 目录） | 源文件路径（images 目录） |
|---------|------|-----------|-----------|------|----------------------|------------------------|
| 居中 | Showcase | ADU Product Showcase | ADU 产品展示 | 视频 | `public/images/products/adu/Trim-2-ADU.mp4` | `images/Product Matrix/ADU/Trim-2-ADU.mp4` |

---

## 三、技术实现要点

### 标签切换机制

| 产品 | 标签类型 | Tab CSS Class | Data 属性 | Content ID 前缀 |
|------|---------|---------------|----------|----------------|
| Sunroom | Residential / Commercial | `.scenario-tab` | `data-scenario="sunroom-residential"` | `scenario-sunroom-` |
| Pergola | Residential / Commercial | `.scenario-tab` | `data-scenario="residential"` | `scenario-` |
| Zip Blinds | Residence / Pergola | `.zb-tab` | `data-zb="residence"` | `zb-` |
| ADU | （无标签切换） | — | — | — |

### JS 切换逻辑

- **Sunroom / Pergola**：共用 `.scenario-tab` 类，JS 通过 `tab.closest('.product-content')` 限定切换范围在当前产品区域内
- **Zip Blinds**：使用独立的 `.zb-tab` 类和 `data-zb` 属性，切换逻辑独立

### 卡片布局

- 图片卡：`aspect-[4/3]` + `object-cover`
- 视频卡（行内）：`aspect-[4/3]` + `object-cover`
- 视频卡（独立行）：`aspect-video`（16:9）+ `max-w-2xl mx-auto` 居中

---

## 四、待补充内容

- [ ] Sunroom Residential：后续可增加更多样例图片/视频
- [ ] Sunroom Commercial：后续可增加更多样例
- [ ] ADU：后续可添加 Residential / Commercial 分标签
- [ ] 统一所有产品的文件路径规范（`public/images/` vs `/images/`）
- [ ] 为所有产品图片添加 Nestopia Logo 水印版本

---

*最后更新：2026-03-21*
