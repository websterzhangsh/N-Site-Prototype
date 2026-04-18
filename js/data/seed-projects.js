/**
 * seed-projects.js — 种子项目数据（演示用）
 * 从 company-operations.html 提取（Phase 1.6）
 * 命名空间: Nestopia.data.seedProjects
 */
(function() {
    'use strict';
    var N = window.Nestopia;

    var greenscapeProjects = [
        { id: 'PRJ-001', name: 'Johnson Residence Sunroom', customer: 'Mr. Johnson', customerEmail: 'johnson@email.com', customerPhone: '(310) 555-0101', customerAddress: '123 Sunshine Ave, Los Angeles, CA', type: 'Sunroom', workflowStep: 3, stage: 'measurement', riskLevel: 'high', budget: 35000, paid: 18500, timeline: '6 weeks', startDate: '2026-01-15', risks: [{title:'Permit approval delayed by city', severity:'high', status:'open'},{title:'HOA design review pending', severity:'medium', status:'monitoring'}], issues: [{id:'ISS-001', title:'Permit approval delayed by city', priority:'high', status:'open', assignedTo:'John Smith', dueDate:'2026-03-15'},{title:'HOA documentation incomplete', priority:'medium', status:'in_progress', assignedTo:'Emily Davis', dueDate:'2026-03-20'}], order: {id:'ORD-2024-0156', product:'Classic Sunroom', total:'$18,500', status:'In Production', date:'Mar 10, 2026'}, hidden: true },
        { id: 'PRJ-002', name: 'Martinez ADU Project', customer: 'Ms. Martinez', customerEmail: 'martinez@email.com', customerPhone: '(415) 555-0202', customerAddress: '456 Oak Dr, San Francisco, CA', type: 'ADU', workflowStep: 2, stage: 'design', riskLevel: 'high', budget: 95000, paid: 1100, timeline: '12 weeks', startDate: '2026-02-01', risks: [{title:'HOA approval uncertain', severity:'high', status:'open'}], issues: [{title:'Zoning variance needed', priority:'high', status:'open', assignedTo:'John Smith', dueDate:'2026-03-25'}], order: {id:'ORD-2024-0152', product:'ADU Studio', total:'$85,000', status:'Pending', date:'Feb 25, 2026'}, hidden: true },
        { id: 'PRJ-003', name: 'Smith Premium Sunroom', customer: 'Mr. Smith', customerEmail: 'smith@email.com', customerPhone: '(301) 555-0303', customerAddress: '8520 Fenton St, Silver Spring, MD', type: 'Sunroom', workflowStep: 2, stage: 'design', riskLevel: 'low', budget: 42000, paid: 4200, timeline: '8 weeks', startDate: '2026-02-15', risks: [], issues: [], order: {id:'ORD-2024-0153', product:'Premium Sunroom', total:'$32,000', status:'Pending', date:'Mar 15, 2026'}, measurement: { method: 'Manual precision', surveyor: 'John Martinez (#948721)', date: '2026-01-25', dims: "24' x 16' x 10'", foundation: 'Concrete slab 4"', wallBearing: 'Adequate - wood frame', setback: '12ft actual (5ft req) — OK', drainage: '2.1% slope — OK', obstacles: ['Downspout NE corner', 'Gas meter E wall'] } },
        { id: 'PRJ-004', name: 'Chen Pergola Space', customer: 'Ms. Chen', customerEmail: 'chen@email.com', customerPhone: '(301) 555-0404', customerAddress: '456 Oak Dr, Frederick, MD', type: 'Pergola', workflowStep: 3, stage: 'measurement', riskLevel: 'low', budget: 12000, paid: 3600, timeline: '4 weeks', startDate: '2026-02-01', risks: [{title:'Weather delay possible', severity:'low', status:'monitoring'}], issues: [], order: {id:'ORD-2024-0155', product:'Studio Pergola', total:'$6,900', status:'Pending', date:'Mar 20, 2026'}, measurement: { method: 'Hybrid', surveyor: 'Sarah Lee (#762194)', date: '2026-02-10', dims: "18' x 14' x 9'", foundation: 'Pier & beam', wallBearing: 'N/A - freestanding', setback: '8ft actual (5ft req) — OK', drainage: '1.5% slope — OK', obstacles: ['Oak tree 6ft NW', 'Sprinkler head SW corner'] } },
        { id: 'PRJ-005', name: 'Davis Pool Zip Blinds', customer: 'Mrs. Davis', customerEmail: 'davis@email.com', customerPhone: '(480) 555-0505', customerAddress: '789 Pool Ln, Scottsdale, AZ', type: 'Zip Blinds', workflowStep: 4, stage: 'quotation', riskLevel: 'low', budget: 8500, paid: 2550, timeline: '3 weeks', startDate: '2026-02-10', risks: [], issues: [], order: {id:'ORD-2024-0154', product:'Zip Blinds Set', total:'$4,200', status:'Pending', date:'Mar 25, 2026'}, measurement: { method: 'Manual precision', surveyor: 'Tom Baker (#583041)', date: '2026-01-18', openings: 3, opening_width_in: 72, opening_height_in: 96, mounting: 'face_mount', guide: 'zip_track', motor: 'motorized_solar', fabric: 'mesh_5pct' } },
        { id: 'PRJ-006', name: 'Wilson Residence Pergola', customer: 'Mr. Wilson', customerEmail: 'wilson@email.com', customerPhone: '(503) 555-0606', customerAddress: '987 Cedar Ct, Portland, OR', type: 'Pergola', workflowStep: 6, stage: 'installation', riskLevel: 'low', budget: 15000, paid: 15000, timeline: '5 weeks', startDate: '2025-11-20', risks: [], issues: [], order: {id:'ORD-2024-0151', product:'Classic Pergola', total:'$9,500', status:'Completed', date:'Feb 20, 2026'}, hidden: true },
        { id: 'PRJ-007', name: 'Taylor Backyard Sunroom', customer: 'Mr. Taylor', customerEmail: 'taylor@email.com', customerPhone: '(206) 555-0707', customerAddress: '159 Birch Ave, Seattle, WA', type: 'Sunroom', workflowStep: 5, stage: 'production', riskLevel: 'low', budget: 28000, paid: 25200, timeline: '6 weeks', startDate: '2025-12-15', risks: [], issues: [], order: {id:'ORD-2024-0149', product:'Classic Sunroom', total:'$28,000', status:'In Production', date:'Feb 15, 2026'}, hidden: true },
        { id: 'PRJ-008', name: 'Garcia Outdoor ADU', customer: 'Ms. Garcia', customerEmail: 'garcia@email.com', customerPhone: '(619) 555-0808', customerAddress: '654 Pine Rd, San Diego, CA', type: 'ADU', workflowStep: 1, stage: 'intent', riskLevel: 'low', budget: 110000, paid: 100, timeline: '16 weeks', startDate: '2026-03-01', risks: [], issues: [], order: {id:'ORD-2024-0158', product:'ADU Studio', total:'$85,000', status:'Pending', date:'Mar 12, 2026'}, hidden: true }
    ];

    var omeyaSinProjects = [
        { id: 'OMY-001', name: 'MX Zip Blinds', customer: 'Miss Xu', customerEmail: 'miss.xu@email.com', customerPhone: '+65 9123-4567', customerAddress: '88 Orchard Road, #12-01, Singapore 238839', type: 'Zip Blinds', workflowStep: 1, stage: 'intent', riskLevel: 'low', budget: 6500, paid: 0, timeline: '3 weeks', startDate: '2026-04-01', risks: [], issues: [], order: null }
    ];

    var nestopiaChnProjects = [
        { id: 'CHN-001', name: 'LZ Sunroom', customer: 'Larry Zhang', customerEmail: 'larry.zhang@email.com', customerPhone: '+86 138-0000-0001', customerAddress: '1288 Nanjing West Rd, Shanghai, China', type: 'Sunroom', workflowStep: 1, stage: 'intent', riskLevel: 'low', budget: 50000, paid: 0, timeline: '8 weeks', startDate: '2026-04-01', risks: [], issues: [], order: null },
        { id: 'CHN-002', name: 'LZ Pergola', customer: 'Larry Zhang', customerEmail: 'larry.zhang@email.com', customerPhone: '+86 138-0000-0001', customerAddress: '1288 Nanjing West Rd, Shanghai, China', type: 'Pergola', workflowStep: 1, stage: 'intent', riskLevel: 'low', budget: 15000, paid: 0, timeline: '4 weeks', startDate: '2026-04-01', risks: [], issues: [], order: null },
        { id: 'CHN-003', name: 'LZ Zip Blinds', customer: 'Larry Zhang', customerEmail: 'larry.zhang@email.com', customerPhone: '+86 138-0000-0001', customerAddress: '1288 Nanjing West Rd, Shanghai, China', type: 'Zip Blinds', workflowStep: 1, stage: 'intent', riskLevel: 'low', budget: 8000, paid: 0, timeline: '3 weeks', startDate: '2026-04-01', risks: [], issues: [], order: null }
    ];

    N.data.seedProjects = {
        greenscapeProjects: greenscapeProjects,
        omeyaSinProjects: omeyaSinProjects,
        nestopiaChnProjects: nestopiaChnProjects,
        tenantProjectsMap: {
            'default': greenscapeProjects,
            'partner1': greenscapeProjects,
            'partner2': greenscapeProjects,
            'omeya-sin': omeyaSinProjects,
            'nestopia-chn': nestopiaChnProjects
        }
    };

    console.log('[Nestopia] seed-projects.js loaded');
})();
