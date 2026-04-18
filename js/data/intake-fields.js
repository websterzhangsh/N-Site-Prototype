/**
 * intake-fields.js — Intake 表单模块字段定义（A.1 ~ A.8）
 * 从 company-operations.html 提取（Phase 1.5）
 * 命名空间: Nestopia.data.intakeFields
 */
(function() {
    'use strict';
    var N = window.Nestopia;

    N.data.intakeFields = {
        INTAKE_MODULE_FIELDS: {
            'A.1': {
                title: 'Customer Basics',
                fields: [
                    { key: 'a1_client_name', label: 'Client Name', type: 'text', required: true, placeholder: 'Full name' },
                    { key: 'a1_address_street', label: 'Street Address', type: 'text', required: true, placeholder: '123 Main St' },
                    { key: 'a1_address_city', label: 'City', type: 'text', required: true, placeholder: 'Los Angeles' },
                    { key: 'a1_address_state', label: 'State', type: 'text', required: true, placeholder: 'CA' },
                    { key: 'a1_address_zip', label: 'ZIP Code', type: 'text', required: true, placeholder: '90001' },
                    { key: 'a1_phone', label: 'Phone', type: 'text', required: true, placeholder: '(310) 555-0100' },
                    { key: 'a1_email', label: 'Email', type: 'email', required: true, placeholder: 'client@email.com' },
                    { key: 'a1_preferred_contact', label: 'Preferred Contact Method', type: 'select', required: true, options: [
                        { value: 'phone', label: 'Phone' }, { value: 'sms', label: 'SMS' },
                        { value: 'email', label: 'Email' }, { value: 'video', label: 'Video Call' }
                    ]},
                    { key: 'a1_other_decision_makers', label: 'Other Decision Makers (Name / Relationship)', type: 'text', required: false, placeholder: 'e.g. Jane Doe / Spouse' }
                ]
            },
            'A.2': {
                title: 'Project Overview',
                fields: [
                    { key: 'a2_usage_scenario', label: 'Usage Scenario', type: 'select', required: true, options: [
                        { value: 'residential_house', label: 'Residential (House)' }, { value: 'residential_apartment', label: 'Residential (Apartment)' },
                        { value: 'commercial_restaurant', label: 'Commercial (Restaurant)' }, { value: 'commercial_cafe', label: 'Commercial (Cafe)' },
                        { value: 'office', label: 'Office / Conference' }, { value: 'hotel_resort', label: 'Hotel / Resort' },
                        { value: 'poolside', label: 'Poolside' }, { value: 'other', label: 'Other' }
                    ]},
                    { key: 'a2_install_location', label: 'Installation Location', type: 'select', required: true, options: [
                        { value: 'patio_ground', label: 'Patio (Ground Level)' }, { value: 'terrace_upper', label: 'Terrace (Upper Floor)' },
                        { value: 'raised_platform', label: 'Raised Platform' }, { value: 'rooftop', label: 'Rooftop' },
                        { value: 'commercial_space', label: 'Commercial Space' }, { value: 'other', label: 'Other' }
                    ]},
                    { key: 'a2_primary_usage', label: 'Primary Usage (multi-select)', type: 'multiselect', required: true, options: [
                        { value: 'leisure', label: 'Leisure / Tea Room' }, { value: 'gym', label: 'Gym / Yoga' },
                        { value: 'study', label: 'Study / Workspace' }, { value: 'dining', label: 'Dining / Entertaining' },
                        { value: 'kids_play', label: "Kids' Play Area" }, { value: 'pets', label: 'Pet Area' },
                        { value: 'garden', label: 'Garden / Greenhouse' }, { value: 'pool_cover', label: 'Pool / Patio Cover' },
                        { value: 'other', label: 'Other' }
                    ]},
                    { key: 'a2_wall_connected', label: 'Attached to Existing Wall?', type: 'select', required: true, options: [
                        { value: 'true', label: 'Yes (attached to house/garage)' }, { value: 'false', label: 'No (freestanding structure)' }
                    ]},
                    { key: 'a2_dimension_length_ft', label: 'Length (ft)', type: 'number', required: true, placeholder: 'e.g. 20' },
                    { key: 'a2_dimension_width_ft', label: 'Width (ft)', type: 'number', required: true, placeholder: 'e.g. 15' },
                    { key: 'a2_dimension_height_ft', label: 'Height (ft)', type: 'number', required: true, placeholder: 'e.g. 10' },
                    { key: 'a2_special_constraints', label: 'Special Constraints', type: 'textarea', required: false, placeholder: 'e.g. Max wall height 8ft due to roof overhang' }
                ]
            },
            'A.3': {
                title: 'Usage & Lifestyle',
                fields: [
                    { key: 'a3_usage_duration', label: 'Usage Duration', type: 'select', required: true, options: [
                        { value: 'year_round', label: 'Year-round (needs insulation/HVAC)' },
                        { value: 'three_season', label: 'Three-season (Spring–Fall)' },
                        { value: 'seasonal', label: 'Seasonal / Temporary' }
                    ]},
                    { key: 'a3_household_size', label: 'Household Size', type: 'number', required: true, placeholder: 'e.g. 4' },
                    { key: 'a3_frequent_visitors', label: 'Frequent Visitors / Parties?', type: 'select', required: true, options: [
                        { value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }
                    ]},
                    { key: 'a3_activities', label: 'Planned Activities (multi-select)', type: 'multiselect', required: true, options: [
                        { value: 'reading', label: 'Reading / Relaxing' }, { value: 'dining', label: 'Dining / Tea' },
                        { value: 'exercise', label: 'Exercise / Yoga' }, { value: 'gardening', label: 'Gardening' },
                        { value: 'kids_play', label: "Children's Play" }, { value: 'entertaining', label: 'Family / Social Gatherings' },
                        { value: 'other', label: 'Other' }
                    ]},
                    { key: 'a3_functional_needs', label: 'Functional Needs (multi-select)', type: 'multiselect', required: true, options: [
                        { value: 'shade_blinds', label: 'Shade / Blinds' }, { value: 'motorized_windows', label: 'Motorized Windows / Doors' },
                        { value: 'smart_control', label: 'Smart Control (App)' }, { value: 'lighting', label: 'Lighting System' },
                        { value: 'hvac', label: 'HVAC / Floor Heating' }, { value: 'outdoor_kitchen', label: 'Outdoor Kitchen / Bar' },
                        { value: 'solar', label: 'Solar Panel / Energy Storage' }
                    ]}
                ]
            },
            'A.4': {
                title: 'Budget & Timeline',
                fields: [
                    { key: 'a4_budget_range', label: 'Overall Project Budget', type: 'select', required: true, options: [
                        { value: '10k_20k', label: '$10K – $20K' }, { value: '20k_35k', label: '$20K – $35K' },
                        { value: '35k_50k', label: '$35K – $50K' }, { value: '50k_75k', label: '$50K – $75K' },
                        { value: '75k_100k', label: '$75K – $100K' }, { value: '100k_plus', label: '$100K+' }
                    ]},
                    { key: 'a4_ideal_start', label: 'Ideal Start Time', type: 'select', required: true, options: [
                        { value: 'asap', label: 'ASAP (within 1 month)' }, { value: '1_3_months', label: '1 – 3 months' },
                        { value: '3_6_months', label: '3 – 6 months' }, { value: 'undecided', label: 'Not decided yet' }
                    ]},
                    { key: 'a4_important_dates', label: 'Important Dates', type: 'text', required: false, placeholder: 'e.g. Need it ready for Thanksgiving party' }
                ]
            },
            'A.5': {
                title: 'Community & HOA Compliance',
                fields: [
                    { key: 'a5_has_hoa', label: 'Is there an HOA?', type: 'select', required: true, options: [
                        { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unsure', label: 'Not Sure' }
                    ]},
                    { key: 'a5_hoa_name', label: 'HOA Name', type: 'text', required: false, placeholder: 'e.g. Sunset Hills HOA' },
                    { key: 'a5_hoa_design_guidelines', label: 'HOA Design Guidelines Available?', type: 'select', required: true, options: [
                        { value: 'has_can_provide', label: 'Yes, I can provide the document' },
                        { value: 'has_need_lookup', label: 'Yes, but I need to look it up' },
                        { value: 'none', label: 'No guidelines' },
                        { value: 'unsure', label: 'Not sure' }
                    ]},
                    { key: 'a5_setback_awareness', label: 'Aware of local setback/height restrictions?', type: 'select', required: true, options: [
                        { value: 'aware', label: 'Yes, I understand the restrictions' },
                        { value: 'need_help', label: 'No, I need assistance' }
                    ]}
                ],
                uploads: [
                    { key: 'hoa_design_guidelines', label: 'Upload HOA Design Guidelines', accept: '.pdf,.doc,.docx,.jpg,.png', icon: 'fa-file-pdf', hint: 'PDF, DOC, or image files' }
                ]
            },
            'A.6': {
                title: 'Style & Aesthetic Preferences',
                fields: [
                    { key: 'a6_style_preference', label: 'Overall Style Preference', type: 'textarea', required: true, placeholder: 'Describe your preferred style or select from product catalog...' },
                    { key: 'a6_color_preference', label: 'Color Preference', type: 'text', required: false, placeholder: 'e.g. White frame with dark tint glass' }
                ],
                uploads: [
                    { key: 'intake_ref_image_liked', label: 'Reference Images You Like (3–5)', accept: 'image/*', icon: 'fa-images', hint: 'Upload 3–5 photos of designs you like', multiple: true },
                    { key: 'intake_ref_image_disliked', label: 'Reference Images You Dislike (1–2)', accept: 'image/*', icon: 'fa-image', hint: 'Upload 1–2 photos of designs you want to avoid', multiple: true }
                ]
            },
            'A.7': {
                title: 'Decision Process',
                fields: [
                    { key: 'a7_decision_maker', label: 'Final Decision Maker', type: 'select', required: true, options: [
                        { value: 'self', label: 'Myself' }, { value: 'spouse', label: 'Spouse / Partner' },
                        { value: 'family_joint', label: 'Family Members (Joint)' }, { value: 'other', label: 'Other' }
                    ]},
                    { key: 'a7_decision_timeline', label: 'Decision Timeline', type: 'select', required: true, options: [
                        { value: 'within_1_week', label: 'Within 1 week' }, { value: '2_4_weeks', label: '2 – 4 weeks' },
                        { value: '1_3_months', label: '1 – 3 months' }, { value: 'undecided', label: 'Not decided' }
                    ]}
                ]
            },
            'A.8': {
                title: 'Additional Notes',
                fields: [
                    { key: 'a8_additional_notes', label: 'Anything else we should know?', type: 'textarea', required: false, placeholder: 'Any other requirements, concerns, or information you\'d like to share...' }
                ]
            }
        }
    };

    console.log('[Nestopia] intake-fields.js loaded');
})();
