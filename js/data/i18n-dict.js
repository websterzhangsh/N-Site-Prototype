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
                modalTitle: 'Zip Blinds Quotation / 防风卷帘报价单',
                labelClient: 'Client / 客户姓名', labelContact: 'Contact / 客户电话',
                labelCS: 'Customer Service / 客服',
                labelProfileColor: 'Profile Color / 型材颜色', labelFabric: 'Fabric / 面料',
                labelFabricColor: 'Fabric Color / 面料颜色',
                labelProductItems: 'Product Items / 产品明细', btnAddRow: 'Add Row',
                thProduct: 'Product / 品类', thWidth: 'Width(mm)', thHeight: 'Height(mm)',
                thArea: 'Area(m²)', thUnitPrice: 'Unit Price(¥/m²)',
                thQty: 'Qty', thAmount: 'Amount(¥)',
                labelAccessories: 'Accessories / 附件', btnAddAccessory: 'Add Accessory',
                thAccItem: 'Item / 品名', thAccSpec: 'Spec',
                thAccUnitPrice: 'Unit Price(¥)', thAccQty: 'Qty', thAccAmount: 'Amount(¥)',
                labelCurrency: 'Currency / 币种',
                optRMB: 'RMB ¥ / 人民币', optSGD: 'SGD S$ / 新加坡元',
                optUSD: 'USD $ / 美元', labelExchangeRate: 'Exchange Rate / 汇率',
                labelRemarks: 'Remarks / 备注',
                defaultRemarks: '1. Include customs duties, logistics, and shipping fees / 包含海关费及物流运输等费用\n2. Warranty: Aluminum alloy 10 years, motor 3 years, zip blinds 2 years / 质保：铝合金十年，电机三年，防风卷帘两年\n3. Payment: 50% deposit before production, balance before shipment / 付款：生产前付50%定金，发货前付清余款',
                labelSummary: 'Quotation Summary / 报价汇总',
                labelSubProducts: 'Product Subtotal:', labelSubAccessories: 'Accessory Subtotal:',
                labelTotalRMB: 'Total Price (RMB):', labelTotalForeign: 'Total Price',
                labelDiscount: 'Discount (%) / 折扣调整',
                footerNote: 'Quotation will open as a printable HTML page',
                btnGenerate: 'Generate Quotation',
                customOption: 'Custom / 自定义', specPlaceholder: 'Spec',
                printTitle: 'Zip Blinds Quotation / 防风卷帘报价单',
                printDate: 'Date / 日期', printClient: 'Client / 客户姓名',
                printCSRep: 'CS Rep / 客服', printContact: 'Contact / 客户电话',
                printCSContact: 'CS Contact / 客服电话',
                printSectionDims: 'Product Dimensions / 产品尺寸或规格',
                printThNo: 'No.', printThProduct: 'Product / 品类',
                printThWidth: 'Width(mm)', printThHeight: 'Height(mm)',
                printThArea: 'Area(M²)', printThUnitPrice: 'Unit Price(¥/M²)',
                printThQty: 'Qty', printThAmount: 'Amount(¥)',
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
                printSignDate: 'Signature & Date / 签名及日期',
                printBtn: 'Print / 打印'
            }
        }
    };

    console.log('[Nestopia] i18n-dict.js loaded');
})();
