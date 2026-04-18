/**
 * i18n-dict.js — 报价单双语字典
 * 从 company-operations.html 提取（Phase 1.1）
 * 命名空间: Nestopia.data.i18nDict
 */
(function() {
    'use strict';
    var N = window.Nestopia;

    N.data.i18nDict = {
        quotI18n: {
            en: {
                modalTitle: 'Zip Blinds Quotation',
                labelClient: 'Client', labelContact: 'Contact', labelCS: 'Customer Service',
                labelProfileColor: 'Profile Color', labelFabric: 'Fabric', labelFabricColor: 'Fabric Color / Code',
                labelProductItems: 'Product Items', btnAddRow: 'Add Row',
                thProduct: 'Product', thWidth: 'Width(mm)', thHeight: 'Height(mm)', thArea: 'Area(m²)',
                thUnitPrice: 'Unit Price(¥/m²)', thQty: 'Qty', thAmount: 'Amount(¥)',
                labelAccessories: 'Accessories', btnAddAccessory: 'Add Accessory',
                thAccItem: 'Item', thAccSpec: 'Spec', thAccUnitPrice: 'Unit Price(¥)',
                thAccQty: 'Qty', thAccAmount: 'Amount(¥)',
                labelCurrency: 'Currency', optRMB: 'RMB (¥)', optSGD: 'SGD (S$)', optUSD: 'USD ($)',
                labelExchangeRate: 'Exchange Rate', labelRemarks: 'Remarks',
                defaultRemarks: '1. Include customs duties, logistics, and shipping fees\n2. Warranty: Aluminum alloy 10 years, motor 3 years, zip blinds 2 years\n3. Payment: 50% deposit before production, balance before shipment',
                labelSummary: 'Quotation Summary', labelSubProducts: 'Product Subtotal:',
                labelSubAccessories: 'Accessory Subtotal:', labelTotalRMB: 'Total Price (RMB):',
                labelTotalForeign: 'Total Price', labelDiscount: 'Discount (%)',
                footerNote: 'Quotation will open as a printable HTML page',
                btnGenerate: 'Generate Quotation', customOption: 'Custom', specPlaceholder: 'Spec',
                printTitle: 'Zip Blinds Quotation', printDate: 'Date', printClient: 'Client',
                printCSRep: 'CS Rep', printContact: 'Contact', printCSContact: 'CS Contact',
                printSectionDims: 'Product Dimensions',
                printThNo: 'No.', printThProduct: 'Product', printThWidth: 'Width(mm)',
                printThHeight: 'Height(mm)', printThArea: 'Area(M²)', printThUnitPrice: 'Unit Price(¥/M²)',
                printThQty: 'Qty', printThAmount: 'Amount(¥)',
                printSubtotal: 'Product Subtotal', printDiscount: 'Discount',
                printTotalRMB: 'Preferential Total Price (RMB)',
                printTotalSGD: 'Preferential Total Price (SGD)', printTotalUSD: 'Preferential Total Price (USD)',
                printRemarks: 'Special Remarks', printProfileColor: 'Profile Color', printFabric: 'Fabric',
                printExchangeRate: 'to RMB exchange rate',
                printSeller: 'Seller', printBuyer: 'Buyer', printSignDate: 'Signature & Date', printBtn: 'Print'
            },
            bilingual: {
                modalTitle: '防风卷帘报价单 / Zip Blinds Quotation',
                labelClient: '客户姓名 / Client', labelContact: '客户电话 / Contact',
                labelCS: '客服 / Customer Service',
                labelProfileColor: '型材颜色 / Profile Color', labelFabric: '面料 / Fabric',
                labelFabricColor: '面料颜色/色号',
                labelProductItems: '产品明细 / Product Items', btnAddRow: '添加行',
                thProduct: '品类 / Product', thWidth: '宽(mm)', thHeight: '高(mm)',
                thArea: '面积(m²)', thUnitPrice: '单价(元/m²)',
                thQty: '数量', thAmount: '金额(元)',
                labelAccessories: '附件 / Accessories', btnAddAccessory: '添加附件',
                thAccItem: '品名 / Item', thAccSpec: '规格',
                thAccUnitPrice: '单价(元)', thAccQty: '数量', thAccAmount: '金额(元)',
                labelCurrency: '币种 / Currency',
                optRMB: '人民币 RMB (¥)', optSGD: '新加坡元 SGD (S$)',
                optUSD: '美元 USD ($)', labelExchangeRate: '汇率 / Exchange Rate',
                labelRemarks: '备注 / Remarks',
                defaultRemarks: '1、包含海关费及物流运输等费用 / Include customs duties, logistics, and shipping fees\n2、正常质保期：铝合金材质部分质保十年，电机质保三年，防风卷帘质保两年\n3、付款条件：下单生产前需付50%定金，发货前付清余款 / Payment: 50% deposit before production, balance before shipment',
                labelSummary: '报价汇总 / Quotation Summary',
                labelSubProducts: '产品小计:', labelSubAccessories: '附件小计:',
                labelTotalRMB: '优惠总价 (RMB):', labelTotalForeign: '优惠总价',
                labelDiscount: '折扣调整 / Discount (%)',
                footerNote: '报价单将以可打印 HTML 页面打开',
                btnGenerate: 'Generate Quotation (报价单)',
                customOption: '自定义 / Custom', specPlaceholder: '规格',
                printTitle: 'Zip Blinds Quotation / 防风卷帘报价单',
                printDate: 'Date / 日期', printClient: 'Client / 客户姓名',
                printCSRep: 'CS Rep / 客服', printContact: 'Contact / 客户电话',
                printCSContact: 'CS Contact / 客服电话',
                printSectionDims: 'Product Dimensions / 产品尺寸或规格',
                printThNo: 'No.序号', printThProduct: 'Product / 品类',
                printThWidth: 'Width宽(mm)', printThHeight: 'Height高(mm)',
                printThArea: 'Area面积(M²)', printThUnitPrice: 'Unit Price单价(元/M²)',
                printThQty: 'Qty数量', printThAmount: 'Amount金额(元)',
                printSubtotal: 'Product Subtotal / 产品小计',
                printDiscount: 'Discount / 折扣',
                printTotalRMB: 'Preferential Total Price (RMB) / 优惠总价（人民币）',
                printTotalSGD: 'Preferential Total Price (SGD) / 优惠总价（新币）',
                printTotalUSD: 'Preferential Total Price (USD) / 优惠总价（美元）',
                printRemarks: 'Special Remarks / 特殊说明',
                printProfileColor: 'Profile Color / 型材颜色',
                printFabric: 'Fabric / 面料',
                printExchangeRate: 'to RMB exchange rate / 兑人民币汇率',
                printSeller: 'Seller / 卖方', printBuyer: 'Buyer / 买方',
                printSignDate: 'Signature / 签名 & Date / 日期',
                printBtn: 'Print / 打印'
            }
        }
    };

    console.log('[Nestopia] i18n-dict.js loaded');
})();
