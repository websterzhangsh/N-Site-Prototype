/**
 * product-catalog.js — 产品目录数据（源自 产品选型与报价表.xlsx）
 * 从 company-operations.html 提取（Phase 1.3）
 * 命名空间: Nestopia.data.productCatalog
 */
(function() {
    'use strict';
    var N = window.Nestopia;

    N.data.productCatalog = {
            // ===== SUNROOM 可移动阳光房 =====
            'sr-l-classic': {
                name: 'L-Classic Sunroom', category: 'sunroom', catLabel: 'Sunroom',
                series: 'Classic Series', shape: 'L-Type', control: 'Manual',
                status: 'Active', leadTime: '3-4 weeks', fileCount: 15,
                icon: '/images/products/icons/sunroom-l-type.png',
                image: '/images/gallery/sunroom-elegant.jpg',
                desc: 'L-shaped retractable sunroom with manual slide operation. Premium aluminum alloy frame with polycarbonate panels, doors, windows, and precision track mechanism.',
                components: ['Aluminum alloy profiles', 'Polycarbonate (PC) panels', 'Doors & windows', 'Slide track & rail system', 'Connectors & hardware'],
                colors: 'Standard & Non-standard',
                spans: ['≤4m', '≤5m', '≤6m', '≤7m', '>7m'],
                extras: [], optionSet: 'sunroom', noteSet: 'sunroom',
                cost: {
                    unit: 'sqft', currency: 'USD',
                    tiers: [
                        { span: '≤4m', priceRange: [26, 30] },
                        { span: '≤5m', priceRange: [28, 32] },
                        { span: '≤6m', priceRange: [30, 35] },
                        { span: '≤7m', priceRange: [33, 38] },
                        { span: '>7m',  priceRange: [36, 42] }
                    ],
                    note: 'Material cost only — installation, foundation, and permits not included.'
                },
                price: {
                    unit: 'sqft', currency: 'USD',
                    tiers: [
                        { span: '≤4m', retail: [36, 42], wholesale: [30, 35] },
                        { span: '≤5m', retail: [39, 45], wholesale: [32, 37] },
                        { span: '≤6m', retail: [42, 49], wholesale: [35, 40] },
                        { span: '≤7m', retail: [46, 53], wholesale: [38, 44] },
                        { span: '>7m',  retail: [50, 59], wholesale: [41, 48] }
                    ],
                    note: 'Suggested selling price — installation, foundation, and permits not included.'
                }
            },
            'sr-l-smart': {
                name: 'L-Smart Sunroom', category: 'sunroom', catLabel: 'Sunroom',
                series: 'Smart Series', shape: 'L-Type', control: 'Motorized',
                status: 'Active', leadTime: '4-5 weeks', fileCount: 18,
                image: '/images/hero/sunroom-living.jpg',
                desc: 'L-shaped retractable sunroom with motorized operation. One-touch retraction via motor and drive control system. Premium aluminum alloy frame with polycarbonate panels.',
                components: ['Aluminum alloy profiles', 'Polycarbonate (PC) panels', 'Doors & windows', 'Slide track & rail system', 'Motor & drive control system', 'Connectors & hardware'],
                colors: 'Standard & Non-standard',
                spans: ['≤4m', '≤5m', '≤6m', '≤7m', '>7m'],
                extras: ['Motor & drive control system'], optionSet: 'sunroom', noteSet: 'sunroom',
                cost: {
                    unit: 'sqft', currency: 'USD',
                    tiers: [
                        { span: '≤4m', priceRange: [32, 36] },
                        { span: '≤5m', priceRange: [34, 39] },
                        { span: '≤6m', priceRange: [36, 42] },
                        { span: '≤7m', priceRange: [40, 46] },
                        { span: '>7m',  priceRange: [44, 52] }
                    ],
                    note: 'Material cost only — installation, foundation, and permits not included.'
                },
                price: {
                    unit: 'sqft', currency: 'USD',
                    tiers: [
                        { span: '≤4m', retail: [45, 50], wholesale: [37, 41] },
                        { span: '≤5m', retail: [48, 55], wholesale: [39, 45] },
                        { span: '≤6m', retail: [50, 59], wholesale: [41, 48] },
                        { span: '≤7m', retail: [56, 64], wholesale: [46, 53] },
                        { span: '>7m',  retail: [62, 73], wholesale: [51, 60] }
                    ],
                    note: 'Suggested selling price — installation, foundation, and permits not included.'
                }
            },
            'sr-l-pro': {
                name: 'L-Pro Sunroom', category: 'sunroom', catLabel: 'Sunroom',
                series: 'Pro Series', shape: 'L-Type', control: 'Solar + Motor',
                status: 'Active', leadTime: '5-6 weeks', fileCount: 22,
                image: '/images/gallery/sunroom-pool.jpg',
                desc: 'L-shaped retractable sunroom with integrated solar power & energy storage system. The most advanced model featuring photovoltaic capability for sustainable, off-grid operation.',
                components: ['Aluminum alloy profiles', 'Polycarbonate (PC) panels', 'Doors & windows', 'Slide track & rail system', '(Motor & drive control system)', 'Solar power & energy storage system', 'Connectors & hardware'],
                colors: 'Standard & Non-standard',
                spans: ['≤4m', '≤5m', '≤6m', '≤7m', '>7m'],
                extras: ['Solar power & energy storage system', '(Motor & drive control system)'], optionSet: 'sunroom', noteSet: 'sunroom',
                cost: {
                    unit: 'sqft', currency: 'USD',
                    tiers: [
                        { span: '≤4m', priceRange: [40, 46] },
                        { span: '≤5m', priceRange: [43, 49] },
                        { span: '≤6m', priceRange: [46, 53] },
                        { span: '≤7m', priceRange: [50, 58] },
                        { span: '>7m',  priceRange: [55, 65] }
                    ],
                    note: 'Material cost only — installation, foundation, and permits not included.'
                },
                price: {
                    unit: 'sqft', currency: 'USD',
                    tiers: [
                        { span: '≤4m', retail: [56, 64], wholesale: [46, 53] },
                        { span: '≤5m', retail: [60, 69], wholesale: [49, 56] },
                        { span: '≤6m', retail: [64, 74], wholesale: [53, 61] },
                        { span: '≤7m', retail: [70, 81], wholesale: [58, 67] },
                        { span: '>7m',  retail: [77, 91], wholesale: [63, 75] }
                    ],
                    note: 'Suggested selling price — installation, foundation, and permits not included.'
                }
            },
            'sr-m-classic': {
                name: 'M-Classic Sunroom', category: 'sunroom', catLabel: 'Sunroom',
                series: 'Classic Series', shape: 'M-Type', control: 'Manual',
                status: 'Active', leadTime: '3-4 weeks', fileCount: 12,
                image: '/images/gallery/sunroom-commercial.jpg',
                desc: 'M-shaped retractable sunroom with manual slide operation. Designed for broader spans and commercial applications with premium aluminum alloy construction.',
                components: ['Aluminum alloy profiles', 'Polycarbonate (PC) panels', 'Doors & windows', 'Slide track & rail system', 'Connectors & hardware'],
                colors: 'Standard & Non-standard',
                spans: ['≤4m', '≤5m', '≤6m', '≤7m', '>7m'],
                extras: [], optionSet: 'sunroom', noteSet: 'sunroom',
                cost: {
                    unit: 'sqft', currency: 'USD',
                    tiers: [
                        { span: '≤4m', priceRange: [27, 31] },
                        { span: '≤5m', priceRange: [29, 34] },
                        { span: '≤6m', priceRange: [31, 37] },
                        { span: '≤7m', priceRange: [35, 40] },
                        { span: '>7m',  priceRange: [38, 44] }
                    ],
                    note: 'Material cost only — installation, foundation, and permits not included.'
                },
                price: {
                    unit: 'sqft', currency: 'USD',
                    tiers: [
                        { span: '≤4m', retail: [38, 43], wholesale: [31, 36] },
                        { span: '≤5m', retail: [41, 48], wholesale: [33, 39] },
                        { span: '≤6m', retail: [43, 52], wholesale: [36, 43] },
                        { span: '≤7m', retail: [49, 56], wholesale: [40, 46] },
                        { span: '>7m',  retail: [53, 62], wholesale: [44, 51] }
                    ],
                    note: 'Suggested selling price — installation, foundation, and permits not included.'
                }
            },
            'sr-m-smart': {
                name: 'M-Smart Sunroom', category: 'sunroom', catLabel: 'Sunroom',
                series: 'Smart Series', shape: 'M-Type', control: 'Motorized',
                status: 'Active', leadTime: '4-5 weeks', fileCount: 14,
                image: '/images/gallery/sunroom-pool-villa.jpg',
                desc: 'M-shaped retractable sunroom with motorized operation. Ideal for commercial and swimming pool enclosures with full motor and drive control system.',
                components: ['Aluminum alloy profiles', 'Polycarbonate (PC) panels', 'Doors & windows', 'Slide track & rail system', 'Motor & drive control system', 'Connectors & hardware'],
                colors: 'Standard & Non-standard',
                spans: ['≤4m', '≤5m', '≤6m', '≤7m', '>7m'],
                extras: ['Motor & drive control system'], optionSet: 'sunroom', noteSet: 'sunroom',
                cost: {
                    unit: 'sqft', currency: 'USD',
                    tiers: [
                        { span: '≤4m', priceRange: [33, 38] },
                        { span: '≤5m', priceRange: [36, 41] },
                        { span: '≤6m', priceRange: [38, 44] },
                        { span: '≤7m', priceRange: [42, 48] },
                        { span: '>7m',  priceRange: [46, 54] }
                    ],
                    note: 'Material cost only — installation, foundation, and permits not included.'
                },
                price: {
                    unit: 'sqft', currency: 'USD',
                    tiers: [
                        { span: '≤4m', retail: [46, 53], wholesale: [38, 44] },
                        { span: '≤5m', retail: [50, 57], wholesale: [41, 47] },
                        { span: '≤6m', retail: [53, 62], wholesale: [44, 51] },
                        { span: '≤7m', retail: [59, 67], wholesale: [48, 55] },
                        { span: '>7m',  retail: [64, 76], wholesale: [53, 62] }
                    ],
                    note: 'Suggested selling price — installation, foundation, and permits not included.'
                }
            },
            'sr-m-pro': {
                name: 'M-Pro Sunroom', category: 'sunroom', catLabel: 'Sunroom',
                series: 'Pro Series', shape: 'M-Type', control: 'Solar + Motor',
                status: 'Active', leadTime: '5-6 weeks', fileCount: 20,
                image: '/images/gallery/sunroom-pool.jpg',
                desc: 'M-shaped retractable sunroom with solar power storage and optional motorized operation. Premium model for commercial and large residential projects.',
                components: ['Aluminum alloy profiles', 'Polycarbonate (PC) panels', 'Doors & windows', 'Slide track & rail system', '(Motor & drive control system)', 'Solar power & energy storage system', 'Connectors & hardware'],
                colors: 'Standard & Non-standard',
                spans: ['≤4m', '≤5m', '≤6m', '≤7m', '>7m'],
                extras: ['Solar power & energy storage system', '(Motor & drive control system)'], optionSet: 'sunroom', noteSet: 'sunroom',
                cost: {
                    unit: 'sqft', currency: 'USD',
                    tiers: [
                        { span: '≤4m', priceRange: [42, 48] },
                        { span: '≤5m', priceRange: [45, 51] },
                        { span: '≤6m', priceRange: [48, 56] },
                        { span: '≤7m', priceRange: [52, 60] },
                        { span: '>7m',  priceRange: [58, 68] }
                    ],
                    note: 'Material cost only — installation, foundation, and permits not included.'
                },
                price: {
                    unit: 'sqft', currency: 'USD',
                    tiers: [
                        { span: '≤4m', retail: [59, 67], wholesale: [48, 55] },
                        { span: '≤5m', retail: [63, 71], wholesale: [52, 59] },
                        { span: '≤6m', retail: [67, 78], wholesale: [55, 64] },
                        { span: '≤7m', retail: [73, 84], wholesale: [60, 69] },
                        { span: '>7m',  retail: [81, 95], wholesale: [67, 78] }
                    ],
                    note: 'Suggested selling price — installation, foundation, and permits not included.'
                }
            },
            // ===== PERGOLA 凉亭 =====
            'pg-basic': {
                name: 'Pergola Basic', category: 'pergola', catLabel: 'Pergola',
                series: 'Basic Type', shape: '', control: 'Manual (Fixed Roof)',
                status: 'Active', leadTime: '2-3 weeks', fileCount: 10,
                image: '/images/gallery/pavilion-garden.jpg',
                desc: 'Manual pergola with fixed aluminum alloy roof and integrated LED control system. Clean, durable design perfect for residential outdoor living spaces.',
                components: ['Aluminum alloy frame', 'Fixed aluminum roof panels', 'LED lighting control system', 'Connectors & hardware'],
                colors: 'Standard & Non-standard',
                spans: ['≤3m', '≤4m', '≤5m', '≤6m', '>6m'],
                extras: [], optionSet: 'pergola', noteSet: 'pergola',
                cost: {
                    unit: 'sqft', currency: 'USD',
                    tiers: [
                        { span: '≤3m', priceRange: [18, 22] },
                        { span: '≤4m', priceRange: [20, 24] },
                        { span: '≤5m', priceRange: [22, 27] },
                        { span: '≤6m', priceRange: [24, 30] },
                        { span: '>6m',  priceRange: [27, 34] }
                    ],
                    note: 'Material cost only — installation, foundation, and permits not included.'
                },
                price: {
                    unit: 'sqft', currency: 'USD',
                    tiers: [
                        { span: '≤3m', retail: [25, 31], wholesale: [21, 25] },
                        { span: '≤4m', retail: [28, 34], wholesale: [23, 28] },
                        { span: '≤5m', retail: [31, 38], wholesale: [25, 31] },
                        { span: '≤6m', retail: [34, 42], wholesale: [28, 35] },
                        { span: '>6m',  retail: [38, 48], wholesale: [31, 39] }
                    ],
                    note: 'Suggested selling price — installation, foundation, and permits not included.'
                }
            },
            'pg-classic': {
                name: 'Pergola Classic', category: 'pergola', catLabel: 'Pergola',
                series: 'Classic Type', shape: '', control: 'Motorized Louvers',
                status: 'Active', leadTime: '3-4 weeks', fileCount: 14,
                image: '/images/hero/pavilion-dining.jpg',
                desc: 'Motorized pergola with rotating aluminum louver roof and integrated motor/LED control system. Adjustable louvers provide flexible shade and weather control for all-season comfort.',
                components: ['Aluminum alloy frame', 'Motorized rotating louvers', 'Motor & LED control system', 'Connectors & hardware'],
                colors: 'Standard & Non-standard',
                spans: ['≤3m', '≤4m', '≤5m', '≤6m', '>6m'],
                extras: ['Motorized rotating louver system', 'Motor control system'], optionSet: 'pergola', noteSet: 'pergola',
                cost: {
                    unit: 'sqft', currency: 'USD',
                    tiers: [
                        { span: '≤3m', priceRange: [28, 33] },
                        { span: '≤4m', priceRange: [30, 36] },
                        { span: '≤5m', priceRange: [33, 39] },
                        { span: '≤6m', priceRange: [36, 43] },
                        { span: '>6m',  priceRange: [40, 48] }
                    ],
                    note: 'Material cost only — installation, foundation, and permits not included.'
                },
                price: {
                    unit: 'sqft', currency: 'USD',
                    tiers: [
                        { span: '≤3m', retail: [39, 46], wholesale: [32, 38] },
                        { span: '≤4m', retail: [42, 50], wholesale: [35, 41] },
                        { span: '≤5m', retail: [46, 55], wholesale: [38, 45] },
                        { span: '≤6m', retail: [50, 60], wholesale: [41, 49] },
                        { span: '>6m',  retail: [56, 67], wholesale: [46, 55] }
                    ],
                    note: 'Suggested selling price — installation, foundation, and permits not included.'
                }
            },
            // ===== ZIP BLINDS 防风卷帘 =====
            'zb-manual': {
                name: 'Zip Blinds Standard', category: 'blinds', catLabel: 'Zip Blinds',
                series: 'Standard', shape: '', control: 'Manual',
                status: 'Active', leadTime: '1-2 weeks', fileCount: 8,
                image: '/images/products/zip-blinds/zipblinds-gallery-5.jpg',
                desc: 'Manual zip blind system for outdoor wind and weather protection. Aluminum alloy frame with premium fabric and guide channels for secure, windproof operation.',
                components: ['Aluminum alloy frame channels', 'Premium outdoor fabric', 'Square tube posts', 'Corner posts', 'Guide rail system'],
                colors: 'Standard & Non-standard',
                spans: ['≤3.8m', '≤5.5m', '>5.5m'],
                extras: [], optionSet: 'blinds', noteSet: 'blinds',
                cost: {
                    unit: 'sqft', currency: 'USD',
                    tiers: [
                        { span: '≤3.8m', priceRange: [12, 15] },
                        { span: '≤5.5m', priceRange: [14, 18] },
                        { span: '>5.5m',  priceRange: [17, 22] }
                    ],
                    note: 'Material cost only — installation not included.'
                },
                price: {
                    unit: 'sqm', currency: 'USD',
                    mode: 'strategy',
                    tiers: [
                        { label: 'ZB-100 Standard', retail: [38, 45], wholesale: [31, 37] },
                        { label: 'ZB-200 Professional', retail: [52, 62], wholesale: [43, 51] },
                        { label: 'ZB-300 Elite', retail: [58, 85], wholesale: [48, 70] }
                    ],
                    note: 'Base fabric price per sqm. Drive system and surcharges applied via quotation engine.'
                }
            },
            'zb-motorized': {
                name: 'Zip Blinds Motorized', category: 'blinds', catLabel: 'Zip Blinds',
                series: 'Motorized', shape: '', control: 'Electric Motor',
                status: 'Active', leadTime: '2-3 weeks', fileCount: 12,
                image: '/images/products/zip-blinds/zipblinds-gallery-1.jpg',
                desc: 'Motorized zip blind system with electric motor for effortless remote control operation. Same premium construction with added convenience of smart motor control.',
                components: ['Aluminum alloy frame channels', 'Premium outdoor fabric', 'Square tube posts', 'Corner posts', 'Guide rail system', 'Electric motor & control system'],
                colors: 'Standard & Non-standard',
                spans: ['≤3.8m', '≤5.5m', '>5.5m'],
                extras: ['Electric motor & control system'], optionSet: 'blinds', noteSet: 'blinds',
                cost: {
                    unit: 'sqft', currency: 'USD',
                    tiers: [
                        { span: '≤3.8m', priceRange: [18, 22] },
                        { span: '≤5.5m', priceRange: [21, 26] },
                        { span: '>5.5m',  priceRange: [25, 32] }
                    ],
                    note: 'Material cost only — installation not included.'
                },
                price: {
                    unit: 'sqm', currency: 'USD',
                    mode: 'strategy',
                    tiers: [
                        { label: 'ZB-100 Standard', retail: [38, 45], wholesale: [31, 37] },
                        { label: 'ZB-200 Professional', retail: [52, 62], wholesale: [43, 51] },
                        { label: 'ZB-300 Elite', retail: [58, 85], wholesale: [48, 70] }
                    ],
                    note: 'Base fabric price per sqm. Motorized drive ($68-$215/unit) added in quotation engine.'
                }
            },
            // ===== ADU =====
            'adu-studio': {
                name: 'Studio ADU', category: 'adu', catLabel: 'ADU',
                series: 'Standard', shape: '', control: 'N/A',
                status: 'Active', leadTime: '100 days', fileCount: 24,
                image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&q=80',
                desc: 'Complete studio ADU with kitchenette and full bathroom. Modular design enables 100-day delivery. Perfect for rental income or guest housing.',
                components: ['Modular steel frame', 'Insulated wall panels', 'Roofing system', 'Kitchenette', 'Full bathroom', 'Electrical & plumbing'],
                colors: 'Custom design options',
                spans: ['300-500 sqft'],
                extras: [], optionSet: 'adu', noteSet: 'adu',
                cost: {
                    unit: 'sqft', currency: 'USD',
                    tiers: [
                        { span: '300-500 sqft', priceRange: [180, 220] }
                    ],
                    note: 'Turnkey material cost per sqft — permits, site prep, and utility connections not included.'
                },
                price: {
                    unit: 'sqft', currency: 'USD',
                    tiers: [
                        { span: '300-500 sqft', retail: [252, 308], wholesale: [207, 253] }
                    ],
                    note: 'Suggested selling price — permits, site prep, and utility connections not included.'
                }
            },
            'adu-2bed': {
                name: 'Two-Bedroom ADU', category: 'adu', catLabel: 'ADU',
                series: 'Premium', shape: '', control: 'N/A',
                status: 'Draft', leadTime: '120 days', fileCount: 6,
                image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&q=80',
                desc: 'Full two-bedroom ADU with complete kitchen, two bathrooms, and separate entrance. Modular design for fast delivery. Maximize rental potential.',
                components: ['Modular steel frame', 'Insulated wall panels', 'Roofing system', 'Full kitchen', 'Two bathrooms', 'Two bedrooms', 'Living area', 'Electrical & plumbing'],
                colors: 'Custom design options',
                spans: ['500-800 sqft'],
                extras: [], optionSet: 'adu', noteSet: 'adu',
                cost: {
                    unit: 'sqft', currency: 'USD',
                    tiers: [
                        { span: '500-800 sqft', priceRange: [200, 250] }
                    ],
                    note: 'Turnkey material cost per sqft — permits, site prep, and utility connections not included.'
                },
                price: {
                    unit: 'sqft', currency: 'USD',
                    tiers: [
                        { span: '500-800 sqft', retail: [280, 350], wholesale: [230, 288] }
                    ],
                    note: 'Suggested selling price — permits, site prep, and utility connections not included.'
                }
            }
    };

    console.log('[Nestopia] product-catalog.js loaded');
})();
