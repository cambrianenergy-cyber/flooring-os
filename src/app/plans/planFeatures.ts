export const PLAN_FEATURES = {
  square_start: {
    users: 5,
    ai: false,
    automations: false,
    integrations: false,
    analytics: "basic",
    multiLocation: false
  },
  square_scale: {
    users: 7,
    ai: "limited",
    automations: false,
    integrations: true,
    analytics: "standard",
    multiLocation: false
  },
  square_pro: {
    users: 15,
    ai: "advanced",
    automations: true,
    integrations: true,
    analytics: "advanced",
    multiLocation: false
  },
  square_elite: {
    users: 25,
    ai: "full",
    automations: true,
    integrations: true,
    analytics: "executive",
    multiLocation: true
  }
};