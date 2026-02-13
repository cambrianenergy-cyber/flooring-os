export const ONBOARDING_STEPS = [
  {
    key: "onboarding-complete",
    label: "Onboarding Complete!",
    fields: [
      {
        name: "congrats",
        type: "message",
        label: "Congratulations! Your onboarding is complete.",
        description: "You’re ready to start using your workspace. Here’s what you’ve set up:",
      },
      {
        name: "checklist",
        type: "checklist",
        label: "Setup Checklist",
        items: [
          "Industry and business details",
          "Team and roles",
          "Service offerings",
          "Workflow preferences",
          "Branding and logo",
          "Payment setup",
          "First job/project",
          "Workspace customization",
          "Tutorials selected"
        ],
      },
      {
        name: "startButton",
        type: "button",
        label: "Start Using Workspace",
        action: "goToDashboard",
      },
    ],
  },
  {
    key: "tutorial-cards",
    label: "Tutorial Cards & Guided Tour",
    fields: [
      {
        name: "tutorials",
        type: "multi-select",
        label: "Choose tutorials to help you get started",
        description: "Select the topics you want to see as in-app cards or a guided tour. You can change this later in your workspace settings.",
        optionsByIndustry: {
          construction: [
            "How to create your first estimate",
            "How to schedule a job",
            "How to send an invoice",
            "How to track job progress"
          ],
          hvac: [
            "How to create a service call",
            "How to manage maintenance contracts",
            "How to invoice customers"
          ],
          plumbing: [
            "How to dispatch a plumber",
            "How to handle emergency jobs",
            "How to collect payments"
          ],
          // ...add more for other industries
        },
        required: false,
      },
    ],
  },
  {
    key: "workspace-customization",
    label: "Workspace Customization",
    fields: [
      {
        name: "inviteUsers",
        type: "team-list",
        label: "Invite More Users",
        description: "Add more team members to your workspace.",
        roles: ["Owner", "Admin", "Field Tech", "Office Manager"],
        min: 0,
        max: 20,
        required: false,
      },
      {
        name: "integrations",
        type: "multi-select",
        label: "Integrations",
        description: "Select integrations to connect (optional)",
        options: ["QuickBooks", "SMS Notifications", "Google Calendar", "Zapier", "Other"],
        required: false,
      },
    ],
  },
  {
    key: "first-job-setup",
    label: "First Job/Project Setup",
    fields: [
      {
        name: "jobName",
        type: "text",
        label: "Sample Job/Project Name",
        required: true,
      },
      {
        name: "jobType",
        type: "select",
        label: "Job Type",
        optionsByIndustry: {
          construction: ["Remodel", "New Build", "Repair", "Consulting"],
          hvac: ["Install", "Repair", "Maintenance", "Duct Cleaning"],
          plumbing: ["Leak Repair", "Install", "Inspection", "Emergency"],
          electrical: ["Wiring", "Panel Upgrade", "Lighting", "Inspection"],
          solar: ["Panel Install", "Battery Storage", "Maintenance", "Consulting"],
          alarms: ["Install", "Monitoring", "Repair", "Consulting"],
          gutters: ["Install", "Cleaning", "Repair", "Guards"],
          roofing: ["Install", "Repair", "Inspection", "Cleaning"],
        },
        required: true,
      },
      {
        name: "jobDescription",
        type: "text",
        label: "Description",
        required: false,
      },
      {
        name: "jobDate",
        type: "date",
        label: "Scheduled Date",
        required: false,
      },
    ],
  },
  {
    key: "industry",
    label: "Select Your Industry",
    fields: [
      {
        name: "industry",
        type: "select-grid",
        label: "What do you do?",
        options: [
          { key: "construction", label: "Construction", image: "/images/construction.jpg" },
          { key: "hvac", label: "HVAC", image: "/images/hvac.jpg" },
          { key: "plumbing", label: "Plumbing", image: "/images/plumbing.jpg" },
          { key: "electrical", label: "Electrical", image: "/images/electrical.jpg" },
          { key: "solar", label: "Solar", image: "/images/solar.jpg" },
          { key: "alarms", label: "Alarms", image: "/images/alarms.jpg" },
          { key: "gutters", label: "Gutters", image: "/images/gutters.jpg" },
          { key: "roofing", label: "Roofing", image: "/images/roofing.jpg" },
        ],
        required: true,
      },
    ],
  },
  {
    key: "payment-setup",
    label: "Payment Setup",
    fields: [
      {
        name: "stripeConnect",
        type: "stripe-connect",
        label: "Connect your Stripe account to enable payments and payouts.",
        required: true,
      },
      {
        name: "depositPolicy",
        type: "select",
        label: "Deposit Policy",
        options: ["No deposit", "10% upfront", "50% upfront", "Full upfront"],
        required: true,
      },
    ],
  },
  {
    key: "branding-logo",
    label: "Branding & Logo",
    fields: [
      {
        name: "logo",
        type: "file",
        label: "Upload your company logo",
        accept: ".png,.jpg,.jpeg,.svg",
        required: false,
      },
      {
        name: "brandColor",
        type: "color",
        label: "Choose your brand color",
        required: false,
      },
    ],
  },
  {
    key: "workflow-preferences",
    label: "Workflow Preferences",
    fields: [
      {
        name: "jobTypes",
        type: "multi-select",
        label: "What job types do you handle?",
        description: "Select all that apply. Options are tailored to your industry.",
        optionsByIndustry: {
          construction: ["Remodel", "New Build", "Repair", "Consulting"],
          hvac: ["Install", "Repair", "Maintenance", "Duct Cleaning"],
          plumbing: ["Leak Repair", "Install", "Inspection", "Emergency"],
          electrical: ["Wiring", "Panel Upgrade", "Lighting", "Inspection"],
          solar: ["Panel Install", "Battery Storage", "Maintenance", "Consulting"],
          alarms: ["Install", "Monitoring", "Repair", "Consulting"],
          gutters: ["Install", "Cleaning", "Repair", "Guards"],
          roofing: ["Install", "Repair", "Inspection", "Cleaning"],
        },
        required: true,
      },
      {
        name: "estimateTemplate",
        type: "select",
        label: "Preferred Estimate Template",
        options: ["Simple", "Detailed", "Custom"],
        required: true,
      },
      {
        name: "scheduling",
        type: "select",
        label: "Scheduling Preference",
        options: ["Manual", "Calendar Integration", "Auto-assign"],
        required: true,
      },
    ],
  },
  {
    key: "service-offerings",
    label: "Service Offerings",
    fields: [
      {
        name: "services",
        type: "multi-select",
        label: "What services do you provide?",
        description: "Select all that apply. Options are tailored to your industry.",
        // Example: in a real app, options could be generated dynamically by industry
        optionsByIndustry: {
          construction: ["Remodeling", "New Builds", "Repairs", "Consulting"],
          hvac: ["Installation", "Repair", "Maintenance", "Duct Cleaning"],
          plumbing: ["Leak Repair", "Installations", "Inspections", "Emergency Service"],
          electrical: ["Wiring", "Panel Upgrades", "Lighting", "Inspections"],
          solar: ["Panel Install", "Battery Storage", "Maintenance", "Consulting"],
          alarms: ["Alarm Install", "Monitoring", "Repairs", "Consulting"],
          gutters: ["Install", "Cleaning", "Repair", "Guards"],
          roofing: ["Install", "Repair", "Inspection", "Cleaning"],
        },
        required: true,
      },
    ],
  },
  {
    key: "business-details",
    label: "Business Details",
    fields: [
      {
        name: "businessName",
        type: "text",
        label: "Business Name",
        required: true,
      },
      {
        name: "businessAddress",
        type: "text",
        label: "Business Address",
      },
      // Add more fields or make dynamic per industry
    ],
  },
  {
    key: "team-roles",
    label: "Team & Roles",
    fields: [
      {
        name: "teamMembers",
        type: "team-list",
        label: "Add your team members",
        description: "Invite your team and assign their roles. You can add more later.",
        roles: ["Owner", "Admin", "Field Tech", "Office Manager"],
        min: 1,
        max: 10,
        required: true,
      },
    ],
  },
];
