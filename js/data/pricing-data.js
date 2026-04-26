/**
 * pricing-data.js — Nestopia 定价数据
 * 命名空间: Nestopia.data.pricing
 *
 * v3.0 — 基于供应商报价表 2026-H005（2026.3.12 更新版）的完整 SKU 目录。
 * 包含卷帘本体、驱动系统、业务参数（利润测算公式）三大模块。
 *
 * ⚠️ 本文件是所有定价面板（Product Info、Quotation、Consumer Quote）的唯一数据源。
 *    后续将支持租户级产品定价导入功能，届时此静态目录将迁移至 Supabase。
 */
(function() {
    'use strict';
    var N = window.Nestopia;

    // ══════════════════════════════════════════════════════════
    //  1. 驱动系统目录 — 所有可选电机 / 手动驱动及其单价（RMB/套）
    // ══════════════════════════════════════════════════════════

    var zbDriveSystemCatalog = {
        'AOK-35':           { name: 'AOK-35 Zip Blinds Motor',          nameZh: 'AOK-35防风卷帘电机',                price: 255, type: 'motorized' },
        'AOK-45':           { name: 'AOK-45 Zip Blinds Motor',          nameZh: 'AOK-45防风卷帘电机',                price: 355, type: 'motorized' },
        'K45-XIAOMI':       { name: 'K45-ELR Tubular Motor (Xiaomi)',    nameZh: 'K45-ELR管状电机(小米乐屋)',         price: 250, type: 'motorized' },
        'K45-TUYA':         { name: 'K45-ELR Tubular Motor (Tuya)',      nameZh: 'K45-ELR管状电机(涂鸦乐屋)',         price: 255, type: 'motorized' },
        'WEISIDA-20N':      { name: 'Weishida 20Nm DC Waterproof Motor', nameZh: '威士达-20牛直流防水防风卷帘电机',     price: 320, type: 'motorized' },
        'WEISIDA-50N':      { name: 'Weishida 50Nm DC Waterproof Motor', nameZh: '威士达-50牛直流防水防风卷帘电机',     price: 386, type: 'motorized' },
        'SPRING-SM':        { name: 'Spring Push (\u22644m width)',      nameZh: '弹簧手推(4米宽度以下)',              price: 155, type: 'manual' },
        'SPRING-LG':        { name: 'Spring Push (>4m width)',           nameZh: '弹簧手推(4米宽度以上)',              price: 195, type: 'manual' },
        'BEAD-CHAIN':       { name: 'Bead Chain Control',                nameZh: '拉珠制头',                          price: 55,  type: 'manual' },
        'MANUAL-ELECTRIC':  { name: 'Manual + Electric Combo',           nameZh: '手电一体',                          price: 700, type: 'combo' },
        'WORM-CRANK':       { name: 'Worm Gear Hand Crank',             nameZh: '蜗杆手摇器',                        price: 125, type: 'manual' },
        'SOLAR-M45':        { name: 'M45 Solar Motor (w/ panel)',        nameZh: 'M45太阳能电机(含太阳能板及充电器)',   price: 860, type: 'motorized' }
    };

    // ══════════════════════════════════════════════════════════
    //  2. SKU 产品目录 — 基于供应商 2026-H005 报价表
    // ══════════════════════════════════════════════════════════
    //
    //  priceTiers: 面积区间定价 [{ maxArea, price }]
    //      - maxArea: 该区间上限（m²），Infinity 表示无上限
    //      - price: 该区间单价（RMB/m²）
    //  minArea: 最低计价面积（不足按此面积计），默认 3
    //  samplePrice: 样板价（RMB/块）
    //  drives: 该 SKU 兼容的驱动系统 ID 列表

    var zbSKUCatalog = {

        // ── WR100 系列 ─────────────────────────────────────

        'WR100A-63': {
            model: 'WR100A-63',
            name: 'WR100A-63 Motorized Zip Blinds',
            nameZh: 'WR100A-63防风卷帘',
            series: 'WR100',
            housing: '100\u00d7100mm Square A',
            housingZh: '100\u00d7100方形A护罩',
            fabric: 'NP4000',
            fabricOpenness: '3-10%',
            samplePrice: 820,
            priceTiers: [
                { maxArea: 6, price: 270 },
                { maxArea: Infinity, price: 250 }
            ],
            minArea: 3,
            maxWidthMM: 3000,
            maxHeightMM: 3500,
            features: 'Active fabric guide rail, snap-in side track, coated zipper track',
            featuresZh: '带活动面料导向轨，侧轨为插扣式侧轨，拉链导轨为包胶式拉链导轨',
            notes: '',
            packaging: 'Carton',
            drives: ['AOK-35', 'AOK-45', 'K45-XIAOMI', 'K45-TUYA', 'WEISIDA-20N', 'WEISIDA-50N', 'SPRING-SM', 'BEAD-CHAIN', 'MANUAL-ELECTRIC', 'WORM-CRANK']
        },

        'WR100B-63': {
            model: 'WR100B-63',
            name: 'WR100B-63 Motorized Zip Blinds',
            nameZh: 'WR100B-63防风卷帘',
            series: 'WR100',
            housing: '100\u00d7100mm Square B',
            housingZh: '100\u00d7100方形B护罩',
            fabric: 'NP4000',
            fabricOpenness: '3-10%',
            samplePrice: 845,
            priceTiers: [
                { maxArea: 6, price: 275 },
                { maxArea: Infinity, price: 240 }
            ],
            minArea: 3,
            maxWidthMM: 3000,
            maxHeightMM: 3500,
            features: 'Active fabric guide rail, snap-in side track, coated zipper track',
            featuresZh: '带活动面料导向轨，侧轨为插扣式侧轨，拉链导轨为包胶式拉链导轨',
            notes: '',
            packaging: 'Carton',
            drives: ['AOK-35', 'AOK-45']
        },

        // ── WR110 系列 ─────────────────────────────────────

        'WR110A-63': {
            model: 'WR110A-63',
            name: 'WR110A-63 Motorized Zip Blinds (\u22644m)',
            nameZh: 'WR110A-63防风卷帘',
            series: 'WR110',
            housing: '110\u00d7115mm Square',
            housingZh: '110\u00d7115方形护罩',
            fabric: 'NP4000',
            fabricOpenness: '3-10%',
            samplePrice: 865,
            priceTiers: [
                { maxArea: 6, price: 295 },
                { maxArea: Infinity, price: 270 }
            ],
            minArea: 3,
            maxWidthMM: 3800,
            maxHeightMM: 4500,
            features: 'Fabric guide strip, snap-in side track, coated zipper track, balancer technology',
            featuresZh: '带面料导向条，插扣式侧轨，包胶式拉链导轨，使用平衡器技术',
            notes: 'Gazebo use, width \u22644m',
            notesZh: '凉亭专用4米以下',
            packaging: 'Carton',
            drives: ['AOK-45', 'SPRING-SM']
        },

        'WR110A-78': {
            model: 'WR110A-78',
            name: 'WR110A-78 Motorized Zip Blinds (>4m)',
            nameZh: 'WR110A-78防风卷帘',
            series: 'WR110',
            housing: '110\u00d7115mm Square',
            housingZh: '110\u00d7115方形护罩',
            fabric: 'NP4000',
            fabricOpenness: '3-10%',
            samplePrice: 930,
            priceTiers: [
                { maxArea: 6, price: 315 },
                { maxArea: Infinity, price: 295 }
            ],
            minArea: 3,
            maxWidthMM: 5500,
            maxHeightMM: 4000,
            features: 'Fabric guide strip, snap-in side track, coated zipper track, balancer technology',
            featuresZh: '带面料导向条，插扣式侧轨，包胶式拉链导轨，使用平衡器技术',
            notes: 'Gazebo use, width >4m',
            notesZh: '凉亭专用4米以上',
            packaging: 'Carton',
            drives: ['AOK-45', 'SPRING-LG']
        },

        'WR110B-63': {
            model: 'WR110B-63',
            name: 'WR110B-63 Motorized Zip Blinds (\u22644m)',
            nameZh: 'WR110B-63防风卷帘',
            series: 'WR110',
            housing: '110\u00d7115mm Square',
            housingZh: '110\u00d7115方形护罩',
            fabric: 'NP4000',
            fabricOpenness: '3-10%',
            samplePrice: 845,
            priceTiers: [
                { maxArea: 6, price: 265 },
                { maxArea: Infinity, price: 250 }
            ],
            minArea: 3,
            maxWidthMM: 3800,
            maxHeightMM: 4500,
            features: 'Fabric guide strip, snap-in side track, coated zipper track',
            featuresZh: '带面料导向条，插扣式侧轨，包胶式拉链导轨',
            notes: 'Gazebo use, width \u22644m',
            notesZh: '凉亭专用4米以下',
            packaging: 'Carton',
            drives: ['AOK-45', 'SPRING-SM', 'BEAD-CHAIN', 'MANUAL-ELECTRIC']
        },

        'WR110B-78': {
            model: 'WR110B-78',
            name: 'WR110B-78 Motorized Zip Blinds (>4m)',
            nameZh: 'WR110B-78防风卷帘',
            series: 'WR110',
            housing: '110\u00d7115mm Square',
            housingZh: '110\u00d7115方形护罩',
            fabric: 'NP4000',
            fabricOpenness: '3-10%',
            samplePrice: 900,
            priceTiers: [
                { maxArea: 6, price: 295 },
                { maxArea: Infinity, price: 280 }
            ],
            minArea: 3,
            maxWidthMM: 5500,
            maxHeightMM: 4000,
            features: 'Fabric guide strip, snap-in side track, coated zipper track',
            featuresZh: '带面料导向条，插扣式侧轨，包胶式拉链导轨',
            notes: 'Gazebo use, width >4m',
            notesZh: '凉亭专用4米以上',
            packaging: 'Carton',
            drives: ['AOK-45', 'SPRING-LG', 'BEAD-CHAIN']
        },

        // ── WR120 系列 ─────────────────────────────────────

        'WR120A-63': {
            model: 'WR120A-63',
            name: 'WR120A-63 Motorized Zip Blinds (\u22644m)',
            nameZh: 'WR120A-63防风卷帘',
            series: 'WR120',
            housing: '120\u00d7120mm Square',
            housingZh: '120\u00d7120方形护罩',
            fabric: 'NP4000',
            fabricOpenness: '3-10%',
            samplePrice: 950,
            priceTiers: [
                { maxArea: 6, price: 320 },
                { maxArea: Infinity, price: 280 }
            ],
            minArea: 3,
            maxWidthMM: 3800,
            maxHeightMM: 5500,
            features: 'Clip-in side track, dual-layer lotus track, balancer technology',
            featuresZh: '侧轨为卡扣式侧轨，拉链导轨为双层式拉莲导轨，使用平衡器技术',
            notes: 'Outdoor use, width \u22644m. Default NP4000 fabric',
            notesZh: '户外专用，宽度4米以下，面料标配NP4000系列',
            packaging: 'Carton',
            drives: ['AOK-45', 'SPRING-SM', 'WORM-CRANK', 'BEAD-CHAIN']
        },

        'WR120A-78': {
            model: 'WR120A-78',
            name: 'WR120A-78 Motorized Zip Blinds (>4m)',
            nameZh: 'WR120A-78防风卷帘',
            series: 'WR120',
            housing: '120\u00d7120mm Square',
            housingZh: '120\u00d7120方形护罩',
            fabric: 'NP4000',
            fabricOpenness: '3-10%',
            samplePrice: 1000,
            priceTiers: [
                { maxArea: 6, price: 345 },
                { maxArea: Infinity, price: 305 }
            ],
            minArea: 3,
            maxWidthMM: 5500,
            maxHeightMM: 4000,
            features: 'Clip-in side track, dual-layer lotus track, balancer technology',
            featuresZh: '侧轨为卡扣式侧轨，拉链导轨为双层式拉莲导轨，使用平衡器技术',
            notes: 'Outdoor use, width >4m. Default NP4000 fabric',
            notesZh: '户外专用，宽度4米以上，面料标配NP4000系列',
            packaging: 'Carton',
            drives: ['AOK-45', 'SPRING-LG', 'WORM-CRANK', 'BEAD-CHAIN']
        },

        'WR120B-63': {
            model: 'WR120B-63',
            name: 'WR120B-63 Economy Zip Blinds (\u22644m)',
            nameZh: 'WR120B-63简易防风卷帘',
            series: 'WR120',
            housing: '120\u00d7120mm Square',
            housingZh: '120\u00d7120方形护罩',
            fabric: 'NP4000',
            fabricOpenness: '3-10%',
            samplePrice: 750,
            priceTiers: [
                { maxArea: 6, price: 275 },
                { maxArea: Infinity, price: 260 }
            ],
            minArea: 3,
            maxWidthMM: 3800,
            maxHeightMM: 4000,
            features: 'Clip-in side track, dual-layer lotus track, balancer technology',
            featuresZh: '侧轨为卡扣式侧轨，拉链导轨为双层式拉莲导轨，使用平衡器技术',
            notes: 'Outdoor use, width \u22644m',
            notesZh: '户外专用，宽度4米以下',
            packaging: 'Carton',
            drives: ['AOK-45', 'SPRING-SM', 'WORM-CRANK', 'BEAD-CHAIN', 'MANUAL-ELECTRIC']
        },

        'WR120B-78': {
            model: 'WR120B-78',
            name: 'WR120B-78 Economy Zip Blinds (>4m)',
            nameZh: 'WR120B-78简易防风卷帘',
            series: 'WR120',
            housing: '120\u00d7120mm Square',
            housingZh: '120\u00d7120方形护罩',
            fabric: 'NP4000',
            fabricOpenness: '3-10%',
            samplePrice: 950,
            priceTiers: [
                { maxArea: 6, price: 330 },
                { maxArea: Infinity, price: 295 }
            ],
            minArea: 3,
            maxWidthMM: 5500,
            maxHeightMM: 4000,
            features: 'Clip-in side track, dual-layer lotus track',
            featuresZh: '侧轨为卡扣式侧轨，拉链导轨为双层式拉莲导轨',
            notes: 'Outdoor use, width >4m',
            notesZh: '户外专用，宽度4米以上',
            packaging: 'Carton',
            drives: ['AOK-45', 'SPRING-LG', 'WORM-CRANK', 'BEAD-CHAIN']
        },

        'WR120C-63': {
            model: 'WR120C-63',
            name: 'WR120C-63 Connector Zip Blinds (\u22644m)',
            nameZh: 'WR120C-63防风卷帘',
            series: 'WR120',
            housing: '120\u00d7120mm Square',
            housingZh: '120\u00d7120方形护罩',
            fabric: 'NP4000',
            fabricOpenness: '3-10%',
            samplePrice: 970,
            priceTiers: [
                { maxArea: 6, price: 325 },
                { maxArea: Infinity, price: 295 }
            ],
            minArea: 3,
            maxWidthMM: 3800,
            maxHeightMM: 5500,
            features: 'Clip-in side track, dual-layer lotus track, connector joint, balancer technology',
            featuresZh: '侧轨为卡扣式侧轨，拉链导轨为双层式拉莲导轨，含驳接器，使用平衡器技术',
            notes: 'Outdoor use, width \u22644m',
            notesZh: '户外专用，宽度4米以下',
            packaging: 'Carton',
            drives: ['AOK-45', 'SPRING-SM', 'WORM-CRANK', 'BEAD-CHAIN']
        },

        'WR120C-78': {
            model: 'WR120C-78',
            name: 'WR120C-78 Connector Zip Blinds (>4m)',
            nameZh: 'WR120C-78防风卷帘',
            series: 'WR120',
            housing: '120\u00d7120mm Square',
            housingZh: '120\u00d7120方形护罩',
            fabric: 'NP4000',
            fabricOpenness: '3-10%',
            samplePrice: 1000,
            priceTiers: [
                { maxArea: 6, price: 365 },
                { maxArea: Infinity, price: 315 }
            ],
            minArea: 3,
            maxWidthMM: 5500,
            maxHeightMM: 4000,
            features: 'Clip-in side track, dual-layer lotus track, connector joint, balancer technology',
            featuresZh: '侧轨为卡扣式侧轨，拉链导轨为双层式拉莲导轨，含驳接器，使用平衡器技术',
            notes: 'Outdoor use, width >4m',
            notesZh: '户外专用，宽度4米以上',
            packaging: 'Carton',
            drives: ['AOK-45', 'SPRING-LG', 'WORM-CRANK', 'BEAD-CHAIN']
        },

        // ── 特殊系列 ───────────────────────────────────────

        'WR100x120-63': {
            model: 'WR100\u00d7120-63',
            name: 'WR100\u00d7120-63 Hidden Bottom Rail',
            nameZh: 'WR100\u00d7120-63隐藏式防风卷帘',
            series: 'Special',
            housing: '100\u00d7120mm Hidden',
            housingZh: '100\u00d7120隐藏式',
            fabric: 'NP42054050CP',
            fabricOpenness: '5%',
            samplePrice: 0,
            priceTiers: [
                { maxArea: 3, price: 335 },
                { maxArea: 6, price: 298 },
                { maxArea: Infinity, price: 275 }
            ],
            minArea: 3,
            maxWidthMM: 3000,
            maxHeightMM: 3500,
            features: 'Concealed bottom rail, bottom-up roller tube installation',
            featuresZh: '底轨可隐藏，卷管自下向上安装',
            notes: '',
            packaging: 'Carton',
            drives: ['AOK-45']
        },

        'WR100-63T': {
            model: 'WR100-63(T)',
            name: 'WR100-63 T-Belt Indoor Zip Blinds',
            nameZh: 'WR100-63防风卷帘(T带)',
            series: 'Special',
            housing: '100mm T-Belt',
            housingZh: '100mm T带',
            fabric: 'NP42054050CP',
            fabricOpenness: '5%',
            samplePrice: 0,
            priceTiers: [
                { maxArea: 3, price: 325 },
                { maxArea: 6, price: 292 },
                { maxArea: Infinity, price: 255 }
            ],
            minArea: 3,
            maxWidthMM: 3000,
            maxHeightMM: 3500,
            features: 'Indoor use',
            featuresZh: '室内用',
            notes: 'Indoor use only',
            notesZh: '室内用',
            packaging: 'Carton',
            drives: ['AOK-45']
        },

        'WR120F-63': {
            model: 'WR120F-63',
            name: 'WR120F-63 Large Format Zip Blinds',
            nameZh: 'WR120F-63防风卷帘',
            series: 'WR120',
            housing: '120mm F-Type',
            housingZh: '120mm F型',
            fabric: 'NP42054050CP',
            fabricOpenness: '5%',
            samplePrice: 0,
            priceTiers: [
                { maxArea: 6, price: 502 },
                { maxArea: 10, price: 408 },
                { maxArea: 12, price: 375 },
                { maxArea: 15, price: 350 }
            ],
            minArea: 3,
            maxWidthMM: 6000,
            maxHeightMM: 6000,
            features: 'Large format, recommended finished area 10-18m\u00b2',
            featuresZh: '大幅面，建议成品面积在10-18平方之间，10平方以下单独报价',
            notes: 'Recommended area 10-18m\u00b2',
            notesZh: '建议成品面积在10-18平方之间',
            packaging: 'Carton',
            drives: ['AOK-45', 'SOLAR-M45']
        }
    };

    // ══════════════════════════════════════════════════════════
    //  3. 业务参数 — 利润测算公式常量
    // ══════════════════════════════════════════════════════════
    //
    //  公式来源：方小姐防风卷帘利润测算表20260414.xlsx
    //
    //  卷帘本体总成本 = 折后供应商单价 + 运费清关单价 + 安装费单价
    //    - 折后供应商单价 = 供应商单价 × supplierDiscountRate
    //    - 运费清关单价 = 折后总价 × shippingCostRate / 总面积
    //    - 安装费单价 = installationFeePerSqm
    //
    //  市场询价 = 总成本单价 × marketMarkup
    //  优惠价格 = 市场询价 × preferentialDiscount
    //
    //  电机/配件 = 供应商价格 × (1 + accessoryMarkupRate)

    var zbBusinessParams = {
        // 供应商折扣率（含税价 × 此值 = 折后单价）
        supplierDiscountRate: 0.9,

        // 运费清关比例（占折后总价的百分比）
        shippingCostRate: 0.30,

        // 安装费（RMB/m²）— 可在 UI 中调整
        installationFeePerSqm: 191,

        // 市场加价系数（总成本 × 此值 = 市场询价）
        marketMarkup: 2.92,

        // 优惠折扣率（市场询价 × 此值 = 优惠价格）— 可在 UI 中调整
        preferentialDiscount: 0.50,

        // 电机/配件加价率（供应商价 × (1 + rate) = 售价）
        accessoryMarkupRate: 0.13,

        // 最低计价面积（m²）：不足此面积按此面积计
        minBillableArea: 3,

        // 面料升级附加费（RMB/m²）
        fabricUpgrades: {
            'NP4000': { name: 'NP4000 Standard (PVC+Polyester, 5-30%)', surcharge: 0 },
            'NP3000': { name: 'NP3000 Premium', surcharge: 15 },
            'NP2000': { name: 'NP2000 Blackout (PVC+Polyester, 0-5%)', surcharge: 20 },
            'NB3000': { name: 'NB3000 Fiberglass (PVC+Fiberglass, 5%)', surcharge: 20 }
        },

        // 高度附加费（基准高度 1.51m，低于基准额外加价）
        heightSurcharges: [
            { maxHeight: 1.0,      surcharge: 70, label: '\u22641.0m' },
            { maxHeight: 1.3,      surcharge: 60, label: '1.01\u20131.3m' },
            { maxHeight: 1.5,      surcharge: 50, label: '1.31\u20131.5m' },
            { maxHeight: Infinity, surcharge: 0,  label: '\u22651.51m (standard)' }
        ],

        // 木箱包装附加费（护罩长度超过 2m）
        woodenCratePerMeter: 50,
        woodenCrateThreshold: 2.0
    };

    // ══════════════════════════════════════════════════════════
    //  4. 汇率 & 通用配件预设
    // ══════════════════════════════════════════════════════════

    var defaultExchangeRates = {
        USD: 7.25,
        SGD: 5.3612
    };

    // 通用配件预设（报价单中常用附件行项目模板）
    var zbAccessoryPresets = [
        { name: 'WR120 Corner Post / 转角立柱', price: 180 },
        { name: 'Square Tube Post / 方管立柱', price: 120 },
        { name: 'Multi-Frequency Remote / 多频遥控器', price: 45 },
        { name: 'Installation Fee / 安装费', price: 0 }
    ];

    // ══════════════════════════════════════════════════════════
    //  5. 工具函数
    // ══════════════════════════════════════════════════════════

    /**
     * 根据面积查找 SKU 对应的单价（RMB/m²）
     * @param {string} skuKey - SKU 标识符
     * @param {number} areaSqm - 实际面积（m²）
     * @returns {number} 单价（RMB/m²），找不到返回 0
     */
    function lookupUnitPrice(skuKey, areaSqm) {
        var sku = zbSKUCatalog[skuKey];
        if (!sku) return 0;
        var billedArea = Math.max(areaSqm, sku.minArea || zbBusinessParams.minBillableArea);
        var tiers = sku.priceTiers;
        for (var i = 0; i < tiers.length; i++) {
            if (billedArea <= tiers[i].maxArea) return tiers[i].price;
        }
        return tiers[tiers.length - 1].price;
    }

    /**
     * 计算单个 Opening 的完整成本结构
     * @param {string} skuKey - SKU
     * @param {number} widthMM - 宽度（mm）
     * @param {number} heightMM - 高度（mm）
     * @param {object} [params] - 可选覆盖业务参数
     * @returns {object} { area, billedArea, supplierUnit, discountedUnit, shippingUnit, installUnit, cogsUnit, marketUnit, prefUnit, totalCOGS, totalMarket, totalPref }
     */
    function calcOpeningCost(skuKey, widthMM, heightMM, params) {
        var p = params || zbBusinessParams;
        var sku = zbSKUCatalog[skuKey];
        if (!sku) return null;

        var area = (widthMM / 1000) * (heightMM / 1000);
        var billedArea = Math.max(area, sku.minArea || p.minBillableArea);
        var supplierUnit = lookupUnitPrice(skuKey, billedArea);
        var discountedUnit = Math.round(supplierUnit * (p.supplierDiscountRate || 0.9) * 100) / 100;

        // 运费清关按折后单价 × 比例（简化：直接在单价上加比例）
        var shippingUnit = Math.round(discountedUnit * (p.shippingCostRate || 0.30) * 100) / 100;
        var installUnit = p.installationFeePerSqm || 191;

        var cogsUnit = Math.round((discountedUnit + shippingUnit + installUnit) * 100) / 100;
        var marketUnit = Math.round(cogsUnit * (p.marketMarkup || 2.92) * 100) / 100;
        var prefUnit = Math.round(marketUnit * (p.preferentialDiscount || 0.50) * 100) / 100;

        return {
            area: Math.round(area * 1000) / 1000,
            billedArea: billedArea,
            supplierUnit: supplierUnit,
            discountedUnit: discountedUnit,
            shippingUnit: shippingUnit,
            installUnit: installUnit,
            cogsUnit: cogsUnit,
            marketUnit: marketUnit,
            prefUnit: prefUnit,
            totalCOGS: Math.round(cogsUnit * billedArea),
            totalMarket: Math.round(marketUnit * billedArea),
            totalPref: Math.round(prefUnit * billedArea)
        };
    }

    /**
     * 计算配件/电机售价（供应商价 × 1.13）
     * @param {number} supplierPrice - 供应商价格
     * @param {object} [params] - 可选覆盖
     * @returns {number} 售价
     */
    function calcAccessoryPrice(supplierPrice, params) {
        var rate = (params && params.accessoryMarkupRate !== undefined) ? params.accessoryMarkupRate : zbBusinessParams.accessoryMarkupRate;
        return Math.round(supplierPrice * (1 + rate));
    }

    // ══════════════════════════════════════════════════════════
    //  6. 命名空间导出
    // ══════════════════════════════════════════════════════════

    N.data.pricing = {
        zbSKUCatalog: zbSKUCatalog,
        zbDriveSystemCatalog: zbDriveSystemCatalog,
        zbBusinessParams: zbBusinessParams,
        zbAccessoryPresets: zbAccessoryPresets,
        defaultExchangeRates: defaultExchangeRates,

        // 工具函数
        lookupUnitPrice: lookupUnitPrice,
        calcOpeningCost: calcOpeningCost,
        calcAccessoryPrice: calcAccessoryPrice,

        // Legacy — 旧版数据结构保留向后兼容
        zbProductTiers: {
            good: { name: 'ZB-100 Standard', tube: '65mm', fabric: 'Standard', tiers: [{ maxArea: 5, label: '<5 sqm', retail: 45, wholesale: 37 }, { maxArea: Infinity, label: '\u22655 sqm', retail: 38, wholesale: 31 }] },
            better: { name: 'ZB-200 Professional', tube: '65-75mm', fabric: 'Premium', tiers: [{ maxArea: 5, label: '<5 sqm', retail: 62, wholesale: 51 }, { maxArea: Infinity, label: '\u22655 sqm', retail: 52, wholesale: 43 }] },
            best: { name: 'ZB-300 Elite', tube: '75mm', fabric: 'Elite', tiers: [{ maxArea: 3, label: '<3 sqm', retail: 85, wholesale: 70 }, { maxArea: 6, label: '3\u20136 sqm', retail: 72, wholesale: 59 }, { maxArea: Infinity, label: '>6 sqm', retail: 58, wholesale: 48 }] }
        },
        zbDriveSystems: {
            'bead-chain': { name: 'Bead Chain', category: 'Manual', retail: 18, wholesale: 14 },
            'spring-crank': { name: 'Spring Crank', category: 'Manual', retail: 35, wholesale: 28 },
            'electric-std': { name: 'Standard Electric', category: 'Electric', retail: 68, wholesale: 55 },
            'electric-prem': { name: 'Premium Electric', category: 'Electric', retail: 92, wholesale: 75 },
            'dual-mode': { name: 'Dual Mode', category: 'Premium', retail: 165, wholesale: 135 },
            'solar-kit': { name: 'Solar Power Kit', category: 'Premium', retail: 215, wholesale: 176 }
        },
        zbFabricUpgrades: { 'np4000': { name: 'NP-Standard', surcharge: 0 }, 'np6000': { name: 'NP-Premium', surcharge: 8 }, 'np8000': { name: 'NP-Elite', surcharge: 18 } },
        zbHeightSurcharges: [{ maxHeight: 1.0, surcharge: 15, label: '\u22641.0m' }, { maxHeight: 1.3, surcharge: 8, label: '1.01\u20131.3m' }, { maxHeight: 1.5, surcharge: 4, label: '1.31\u20131.5m' }, { maxHeight: Infinity, surcharge: 0, label: '\u22651.51m (standard)' }],
        zbHardwareCostPerUnit: 30
    };

    // ── 全局别名桥接 ──
    window.zbSKUCatalog          = zbSKUCatalog;
    window.zbDriveSystemCatalog  = zbDriveSystemCatalog;
    window.zbBusinessParams      = zbBusinessParams;
    window.zbProductTiers        = N.data.pricing.zbProductTiers;
    window.zbDriveSystems        = N.data.pricing.zbDriveSystems;
    window.zbFabricUpgrades      = N.data.pricing.zbFabricUpgrades;
    window.zbHeightSurcharges    = N.data.pricing.zbHeightSurcharges;
    window.zbHardwareCostPerUnit = N.data.pricing.zbHardwareCostPerUnit;
    window.zbAccessoryPresets    = zbAccessoryPresets;

    console.log('[Nestopia] pricing-data.js v3.0 loaded — ' + Object.keys(zbSKUCatalog).length + ' SKUs');
})();
