// Options for AI Features dropdowns and selectors

// ==================== WELD QUALITY ANALYZER ====================

export const WELD_TYPES = [
  { id: "fillet_weld", label: "Fillet Weld" },
  { id: "butt_weld", label: "Butt Weld" },
  { id: "groove_weld", label: "Groove Weld" },
  { id: "pipe_weld", label: "Pipe Weld" },
  { id: "lap_joint", label: "Lap Joint" },
  { id: "tee_joint", label: "Tee Joint" },
  { id: "corner_joint", label: "Corner Joint" },
];

export const WELD_MATERIALS = [
  { id: "carbon_steel", label: "Carbon Steel" },
  { id: "stainless_steel", label: "Stainless Steel" },
  { id: "aluminum", label: "Aluminum" },
  { id: "chrome_moly", label: "Chrome-Moly" },
  { id: "inconel", label: "Inconel" },
  { id: "duplex", label: "Duplex" },
];

export const WELD_PROCESSES_FULL = [
  { id: "MIG/GMAW", label: "MIG/GMAW" },
  { id: "TIG/GTAW", label: "TIG/GTAW" },
  { id: "Stick/SMAW", label: "Stick/SMAW" },
  { id: "FCAW", label: "FCAW" },
  { id: "SAW", label: "SAW" },
];

export const WELD_POSITIONS_FULL = [
  { id: "1G", label: "1G (Flat)" },
  { id: "2G", label: "2G (Horizontal)" },
  { id: "3G", label: "3G (Vertical)" },
  { id: "4G", label: "4G (Overhead)" },
  { id: "5G", label: "5G (Pipe Horizontal)" },
  { id: "6G", label: "6G (Pipe 45°)" },
  { id: "1F", label: "1F" },
  { id: "2F", label: "2F" },
  { id: "3F", label: "3F" },
  { id: "4F", label: "4F" },
];

export const WELD_STANDARDS = [
  { id: "AWS D1.1", label: "AWS D1.1 (Structural Steel)" },
  { id: "AWS D1.2", label: "AWS D1.2 (Aluminum)" },
  { id: "API 1104", label: "API 1104 (Pipeline)" },
  { id: "ASME IX", label: "ASME IX (Pressure Vessels)" },
  { id: "AWS D17.1", label: "AWS D17.1 (Aerospace)" },
];

export const WELD_PURPOSES = [
  { id: "practice", label: "Practice/Learning" },
  { id: "certification", label: "Certification Prep" },
  { id: "production", label: "Production QC" },
  { id: "portfolio", label: "Portfolio Building" },
];

// ==================== CREW OPTIMIZER ====================

export const PROJECT_TYPES = [
  { id: "industrial", label: "Industrial" },
  { id: "commercial", label: "Commercial" },
  { id: "residential", label: "Residential" },
  { id: "pipeline", label: "Pipeline" },
  { id: "shipyard", label: "Shipyard" },
  { id: "refinery", label: "Refinery" },
  { id: "power_plant", label: "Power Plant" },
];

export const SHIFT_PATTERNS = [
  { id: "day", label: "Day Shift" },
  { id: "night", label: "Night Shift" },
  { id: "rotating", label: "Rotating" },
];

export const BUDGET_TYPES = [
  { id: "total", label: "Total Project Budget" },
  { id: "weekly", label: "Weekly Budget" },
  { id: "per_welder", label: "Per Welder Budget" },
];

export const TEAM_BALANCING = [
  { id: "skills", label: "Skills-Based" },
  { id: "experience", label: "Experience-Based" },
  { id: "mixed", label: "Mixed/Balanced" },
];

// ==================== INTERVIEW COACH ====================

export const JOB_TITLES = [
  { id: "welder", label: "Welder" },
  { id: "pipe_welder", label: "Pipe Welder" },
  { id: "structural_welder", label: "Structural Welder" },
  { id: "tig_welder", label: "TIG Welder" },
  { id: "mig_welder", label: "MIG Welder" },
  { id: "combo_welder", label: "Combo Welder" },
  { id: "welding_inspector", label: "Welding Inspector" },
  { id: "welding_supervisor", label: "Welding Supervisor" },
  { id: "welding_engineer", label: "Welding Engineer" },
];

export const EXPERIENCE_LEVELS = [
  { id: "entry", label: "Entry Level (0-2 years)" },
  { id: "intermediate", label: "Intermediate (2-5 years)" },
  { id: "senior", label: "Senior (5-10 years)" },
  { id: "expert", label: "Expert (10+ years)" },
];

export const QUESTION_TYPES = [
  { id: "technical", label: "Technical" },
  { id: "behavioral", label: "Behavioral" },
  { id: "safety", label: "Safety" },
  { id: "situational", label: "Situational" },
];

export const DIFFICULTY_LEVELS = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];

// ==================== SAFETY COMPLIANCE ====================

export const WORK_TYPES = [
  { id: "welding", label: "Welding" },
  { id: "cutting", label: "Cutting" },
  { id: "grinding", label: "Grinding" },
  { id: "fabrication", label: "Fabrication" },
];

export const WORK_LOCATIONS = [
  { id: "shop_floor", label: "Shop Floor" },
  { id: "field_site", label: "Field Site" },
  { id: "confined_space", label: "Confined Space" },
  { id: "elevated", label: "Elevated/Heights" },
];

export const INDUSTRIES = [
  { id: "construction", label: "Construction" },
  { id: "petrochemical", label: "Petrochemical" },
  { id: "manufacturing", label: "Manufacturing" },
  { id: "shipbuilding", label: "Shipbuilding" },
  { id: "aerospace", label: "Aerospace" },
  { id: "automotive", label: "Automotive" },
];

export const CHECKLIST_TYPES = [
  { id: "comprehensive", label: "Comprehensive Inspection" },
  { id: "quick", label: "Quick Check" },
  { id: "ppe-only", label: "PPE Only" },
];

export const SAFETY_FOCUS_AREAS = [
  { id: "ppe", label: "PPE" },
  { id: "fire_safety", label: "Fire Safety" },
  { id: "ventilation", label: "Ventilation" },
  { id: "electrical", label: "Electrical" },
  { id: "housekeeping", label: "Housekeeping" },
  { id: "cylinders", label: "Cylinders" },
  { id: "welding_screens", label: "Welding Screens" },
  { id: "emergency", label: "Emergency Equipment" },
];

export const SAFETY_STANDARDS = [
  { id: "OSHA", label: "OSHA" },
  { id: "NFPA", label: "NFPA" },
  { id: "API", label: "API" },
  { id: "ANSI", label: "ANSI" },
];

// ==================== CAREER PATH ====================

export const EDUCATION_LEVELS = [
  { id: "high_school", label: "High School" },
  { id: "trade_school", label: "Trade School" },
  { id: "associate", label: "Associate Degree" },
  { id: "bachelor", label: "Bachelor's Degree" },
  { id: "master", label: "Master's Degree" },
];

export const TIMELINES = [
  { id: "1_year", label: "1 Year" },
  { id: "2_5_years", label: "2-5 Years" },
  { id: "5_plus_years", label: "5+ Years" },
];

export const SPECIALTIES = [
  { id: "pipe", label: "Pipe Welding" },
  { id: "underwater", label: "Underwater Welding" },
  { id: "aerospace", label: "Aerospace Welding" },
  { id: "nuclear", label: "Nuclear Welding" },
  { id: "robotic", label: "Robotic Welding" },
  { id: "structural", label: "Structural Welding" },
];

export const INDUSTRY_PREFERENCES = [
  { id: "oil_gas", label: "Oil & Gas" },
  { id: "aerospace", label: "Aerospace" },
  { id: "shipbuilding", label: "Shipbuilding" },
  { id: "power_gen", label: "Power Generation" },
  { id: "construction", label: "Construction" },
  { id: "manufacturing", label: "Manufacturing" },
  { id: "automotive", label: "Automotive" },
];

export const CERTIFICATIONS_LIST = [
  { id: "AWS D1.1", label: "AWS D1.1" },
  { id: "AWS D1.2", label: "AWS D1.2" },
  { id: "API 1104", label: "API 1104" },
  { id: "ASME IX", label: "ASME IX" },
  { id: "CWI", label: "AWS CWI" },
  { id: "6G", label: "6G Certification" },
  { id: "AWS D17.1", label: "AWS D17.1 (Aerospace)" },
];
