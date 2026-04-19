#!/usr/bin/env python3
"""
Phase 4B: 迁移 onclick 调用到命名空间路径
将 HTML 和 JS 文件中 onclick 属性里的全局函数调用替换为 Nestopia.* 命名空间调用。
"""
import re, os, glob

# ── 映射表: (全局函数名前缀, 命名空间路径前缀) ──
# 排序规则: 长字符串在前，避免部分匹配
ONCLICK_MAP = [
    # Utils - Chatbot (b2bChat.method → Nestopia.utils.chatbot.b2bChat.method)
    ('b2bChat.', 'Nestopia.utils.chatbot.b2bChat.'),

    # Steps - Step 2
    ('triggerStep2PhotoUpload(', 'Nestopia.steps.step2.triggerStep2PhotoUpload('),
    ('openStep2IterateDialog(', 'Nestopia.steps.step2.openStep2IterateDialog('),
    ('executeStep2Iterate(', 'Nestopia.steps.step2.executeStep2Iterate('),
    ('generateStep2Design(', 'Nestopia.steps.step2.generateStep2Design('),
    ('downloadStep2Design(', 'Nestopia.steps.step2.downloadStep2Design('),
    ('toggleStep2Designer(', 'Nestopia.steps.step2.toggleStep2Designer('),
    ('selectStep2Product(', 'Nestopia.steps.step2.selectStep2Product('),
    ('clearStep2Photo(', 'Nestopia.steps.step2.clearStep2Photo('),

    # Steps - Step 3
    ('generateStep3DetailedDesign(', 'Nestopia.steps.step3.generateStep3DetailedDesign('),
    ('scheduleStep3Appointment(', 'Nestopia.steps.step3.scheduleStep3Appointment('),
    ('saveStep3Measurement(', 'Nestopia.steps.step3.saveStep3Measurement('),
    ('removeStep3Obstacle(', 'Nestopia.steps.step3.removeStep3Obstacle('),
    ('toggleStep3Panel(', 'Nestopia.steps.step3.toggleStep3Panel('),
    ('addStep3Obstacle(', 'Nestopia.steps.step3.addStep3Obstacle('),

    # Steps - Step 4 (命名空间使用短键名)
    ('calculateStep4Pricing(', 'Nestopia.steps.step4.calculatePricing('),
    ('toggleStep4Panel(', 'Nestopia.steps.step4.togglePanel('),
    ('toggleStep4Mode(', 'Nestopia.steps.step4.toggleMode('),
    ('selectStep4Tier(', 'Nestopia.steps.step4.selectTier('),
    ('selectStep4Quote(', 'Nestopia.steps.step4.selectQuote('),
    ('adjustStep4Qty(', 'Nestopia.steps.step4.adjustQty('),

    # Agents - Designer
    ('selectDesignerProduct(', 'Nestopia.agents.designer.selectDesignerProduct('),
    ('selectDesignerColor(', 'Nestopia.agents.designer.selectDesignerColor('),
    ('selectDesignerSpan(', 'Nestopia.agents.designer.selectDesignerSpan('),
    ('handleGenerateDesign(', 'Nestopia.agents.designer.handleGenerateDesign('),

    # Agents - Pricing
    ('selectProductTier(', 'Nestopia.agents.pricing.selectProductTier('),
    ('setPricingMode(', 'Nestopia.agents.pricing.setPricingMode('),
    ('adjustZbQty(', 'Nestopia.agents.pricing.adjustZbQty('),

    # Modules - Knowledge Base
    ('openKBUploadModal(', 'Nestopia.modules.knowledgeBase.openKBUploadModal('),
    ('closeKBUploadModal(', 'Nestopia.modules.knowledgeBase.closeKBUploadModal('),
    ('addKBSuggestedTag(', 'Nestopia.modules.knowledgeBase.addKBSuggestedTag('),
    ('submitKBUpload(', 'Nestopia.modules.knowledgeBase.submitKBUpload('),
    ('removeKBFile(', 'Nestopia.modules.knowledgeBase.removeKBFile('),
    ('removeKBTag(', 'Nestopia.modules.knowledgeBase.removeKBTag('),
    ('kbPrevPage(', 'Nestopia.modules.knowledgeBase.kbPrevPage('),
    ('kbNextPage(', 'Nestopia.modules.knowledgeBase.kbNextPage('),
    ('viewKBDoc(', 'Nestopia.modules.knowledgeBase.viewKBDoc('),
    ('deleteKBDoc(', 'Nestopia.modules.knowledgeBase.deleteKBDoc('),
    ('addKBTag(', 'Nestopia.modules.knowledgeBase.addKBTag('),

    # Modules - Projects
    ('openCreateProjectModal(', 'Nestopia.modules.projects.openCreateProjectModal('),
    ('closeCreateProjectModal(', 'Nestopia.modules.projects.closeCreateProjectModal('),
    ('submitCreateProject(', 'Nestopia.modules.projects.submitCreateProject('),
    ('selectProject(', 'Nestopia.modules.projects.selectProject('),
    ('viewProject(', 'Nestopia.modules.projects.viewProject('),
    ('viewIssue(', 'Nestopia.modules.projects.viewIssue('),

    # Modules - Workflow
    ('openNewProjectModal(', 'Nestopia.modules.workflow.openNewProjectModal('),
    ('filterWorkflowProjects(', 'Nestopia.modules.workflow.filterWorkflowProjects('),
    ('handleStepFileUpload(', 'Nestopia.modules.workflow.handleStepFileUpload('),
    ('openProjectDetail(', 'Nestopia.modules.workflow.openProjectDetail('),
    ('closeProjectDetail(', 'Nestopia.modules.workflow.closeProjectDetail('),
    ('advanceStep(', 'Nestopia.modules.workflow.advanceStep('),

    # Modules - Customers
    ('selectCustomerItem(', 'Nestopia.modules.customers.selectCustomerItem('),
    ('confirmDeleteCustomer(', 'Nestopia.modules.customers.confirmDeleteCustomer('),
    ('closeCustomerModal(', 'Nestopia.modules.customers.closeCustomerModal('),
    ('submitCustomerForm(', 'Nestopia.modules.customers.submitCustomerForm('),

    # Modules - Products
    ('saveProductFromModal(', 'Nestopia.modules.products.saveProductFromModal('),
    ('deleteProduct(', 'Nestopia.modules.products.deleteProduct('),

    # Modules - Overview
    ('toggleOverviewSection(', 'Nestopia.modules.overview.toggleOverviewSection('),

    # Modules - Orders
    ('showOrderDetail(', 'Nestopia.modules.orders.showOrderDetail('),

    # Utils - Quotation Editor
    ('openQuotationEditor(', 'Nestopia.utils.quotEditor.openQuotationEditor('),
    ('closeQuotationEditor(', 'Nestopia.utils.quotEditor.closeQuotationEditor('),
    ('toggleQuotLoadDropdown(', 'Nestopia.utils.quotEditor.toggleQuotLoadDropdown('),
    ('removeQuotLineItem(', 'Nestopia.utils.quotEditor.removeQuotLineItem('),
    ('removeQuotAccessory(', 'Nestopia.utils.quotEditor.removeQuotAccessory('),
    ('addQuotLineItem(', 'Nestopia.utils.quotEditor.addQuotLineItem('),
    ('addQuotAccessory(', 'Nestopia.utils.quotEditor.addQuotAccessory('),
    ('previewQuotation(', 'Nestopia.utils.quotEditor.previewQuotation('),
    ('saveQuotation(', 'Nestopia.utils.quotEditor.saveQuotation('),
    ('loadQuotation(', 'Nestopia.utils.quotEditor.loadQuotation('),
    ('deleteQuotation(', 'Nestopia.utils.quotEditor.deleteQuotation('),

    # Core - Auth
    ('logout(', 'Nestopia.auth.logout('),
    ('toggleUserDropdown(', 'Nestopia.auth.toggleUserDropdown('),

    # Core - Router
    ('navigateToProject(', 'Nestopia.router.navigateToProject('),
]


def replace_in_onclick_value(value):
    """在 onclick 属性值中应用函数名替换"""
    for old, new in ONCLICK_MAP:
        value = value.replace(old, new)
    return value


def process_file(filepath):
    """处理单个文件，替换所有 onclick 属性中的函数调用"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    total_replacements = 0

    # 匹配 onclick="..." 模式（非贪婪，不跨行）
    # 处理普通双引号: onclick="..."
    def replace_onclick(match):
        nonlocal total_replacements
        prefix = match.group(1)  # 'onclick="'
        value = match.group(2)   # onclick 内容
        new_value = replace_in_onclick_value(value)
        if new_value != value:
            total_replacements += 1
        return prefix + new_value + '"'

    # 标准 onclick="..." (HTML 和 JS 模板字符串)
    content = re.sub(r'(onclick=")([^"]*)"', replace_onclick, content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return total_replacements
    return 0


def main():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # 处理文件列表
    files = [os.path.join(base, 'company-operations.html')]
    files += sorted(glob.glob(os.path.join(base, 'js', '*', '*.js')))

    total = 0
    for f in files:
        if not os.path.exists(f):
            continue
        count = process_file(f)
        if count > 0:
            name = os.path.relpath(f, base)
            print(f'  ✅ {name}: {count} onclick(s) migrated')
            total += count

    print(f'\n📊 总计: {total} 个 onclick 属性已迁移到命名空间')


if __name__ == '__main__':
    main()
