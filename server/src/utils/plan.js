const PLAN_FEATURES = {
    free: {
        maxComplaintsPerDay: 2,
        autoAssign: false,
        sla: false,
        automation: false,
        analytics: false,
        priorityRouting: false,
        defaultPriority: 'LOW',
        slaHours: 72,
    },
    god: {
        maxComplaintsPerDay: Infinity,
        autoAssign: true,
        sla: true,
        automation: true,
        analytics: true,
        priorityRouting: false, // saved for titan
        defaultPriority: 'MEDIUM',
        slaHours: 48,
    },
    titan: {
        maxComplaintsPerDay: Infinity,
        autoAssign: true,
        sla: true,
        automation: true,
        analytics: true,
        priorityRouting: true,
        defaultPriority: 'HIGH',
        slaHours: 24,
    },
};

export function getPlanFeatures(plan = 'free') {
    return PLAN_FEATURES[plan] || PLAN_FEATURES.free;
}


