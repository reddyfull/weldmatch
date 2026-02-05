// AI Features Service Layer for Advanced WeldMatch AI Tools
import { supabase } from "@/integrations/supabase/client";

// ==================== WELD QUALITY ANALYZER ====================

export interface WeldQualityRequest {
  imageBase64: string;
  weldType: string;
  material: string;
  process: string;
  position: string;
  standard: string;
  purpose: string;
  welderId?: string;
}

export interface WeldDefect {
  type: string;
  severity: "minor" | "moderate" | "major" | "critical";
  location: string;
  description: string;
}

export interface WeldImprovementTip {
  issue: string;
  recommendation: string;
  priority: "high" | "medium" | "low";
}

export interface WeldQualityResponse {
  success: boolean;
  analysis: {
    overallScore: number;
    grade: "A" | "B" | "C" | "D" | "F";
    passesVisualInspection: boolean;
    certificationReady: boolean;
    detectedDefects: WeldDefect[];
    positiveAspects: string[];
    improvementTips: WeldImprovementTip[];
    technicalDetails: {
      estimatedPenetration: string;
      profileAssessment: string;
      heatInputAssessment: string;
      travelSpeedAssessment: string;
    };
    codeCompliance: {
      standard: string;
      wouldPass: boolean;
      concerns: string[];
    };
    summary: string;
  };
  metadata: {
    weldType: string;
    material: string;
    process: string;
    position: string;
    standard: string;
    analyzedAt: string;
  };
}

export async function analyzeWeldQuality(request: WeldQualityRequest): Promise<WeldQualityResponse> {
  const { data, error } = await supabase.functions.invoke('n8n-proxy', {
    body: {
      endpoint: '/analyze-weld-quality',
      payload: request
    }
  });

  if (error) throw new Error(error.message);
  return data;
}

// ==================== CREW OPTIMIZER ====================

export interface CrewOptimizerWelder {
  id: string;
  name: string;
  processes: string[];
  certs: string[];
  positions?: string[];
  experience: number;
  hourlyRate: number;
  location?: string;
  availability?: string;
  leadershipScore?: number;
}

export interface CrewOptimizerRequest {
  projectName: string;
  projectType: string;
  location: string;
  startDate?: string;
  endDate?: string;
  durationWeeks: number;
  budget?: number;
  budgetType: "total" | "weekly" | "per_welder";
  shiftPattern: "day" | "night" | "rotating";
  overtimeAllowed: boolean;
  totalWelders: number;
  leadWeldersNeeded: number;
  processesNeeded: string[];
  certsRequired: string[];
  positionsNeeded: string[];
  experienceMin: number;
  specialties?: string[];
  maxOvertimeHours?: number;
  minRestHours?: number;
  preferLocalWelders?: boolean;
  maxTravelDistance?: number;
  teamBalancing?: "skills" | "experience" | "mixed";
  availableWelders: CrewOptimizerWelder[];
  employerId?: string;
}

export interface CrewMember {
  welderId: string;
  name: string;
  role: "lead" | "senior" | "journeyman" | "helper";
  assignedShift: string;
  primaryTasks: string[];
  matchScore: number;
  selectionReason: string;
}

export interface CrewRisk {
  type: string;
  description: string;
  mitigation: string;
  severity: "low" | "medium" | "high";
}

export interface CrewOptimizerResponse {
  success: boolean;
  optimization: {
    recommendedCrew: CrewMember[];
    crewSummary: {
      totalSelected: number;
      leadWelders: number;
      seniorWelders: number;
      journeymen: number;
      skillsCovered: string[];
      certsCovered: string[];
      averageExperience: number;
      teamSynergyScore: number;
    };
    costProjection: {
      estimatedWeeklyLabor: number;
      estimatedTotalLabor: number;
      estimatedOvertime: number;
      withinBudget: boolean;
      budgetVariance: number;
    };
    riskAnalysis: {
      overallRisk: "low" | "medium" | "high";
      risks: CrewRisk[];
    };
    alternativeOptions: Array<{
      scenario: string;
      changes: string;
      impact: string;
      costDifference: number;
    }>;
    scheduleRecommendations: {
      optimalStartDate: string;
      shiftStructure: string;
      rotationPlan: string;
    };
    summary: string;
  };
  project: object;
  requirements: object;
  optimizedAt: string;
}

export async function optimizeCrew(request: CrewOptimizerRequest): Promise<CrewOptimizerResponse> {
  const { data, error } = await supabase.functions.invoke('n8n-proxy', {
    body: {
      endpoint: '/optimize-crew',
      payload: request
    }
  });

  if (error) throw new Error(error.message);
  return data;
}

// ==================== INTERVIEW COACH ====================

export interface InterviewQuestion {
  id: number;
  question: string;
  type: "technical" | "behavioral" | "safety" | "situational";
  difficulty: "easy" | "medium" | "hard";
  keyPoints: string[];
  redFlags: string[];
  followUp: string;
  timeLimit: number;
  skillsTested: string[];
}

export interface GenerateQuestionsRequest {
  action: "generate";
  jobTitle: string;
  requiredProcesses: string[];
  requiredCerts: string[];
  experienceLevel: "entry" | "intermediate" | "senior" | "expert";
  questionCount: number;
  questionTypes: Array<"technical" | "behavioral" | "safety" | "situational">;
  difficulty: "easy" | "medium" | "hard";
}

export interface GenerateQuestionsResponse {
  success: boolean;
  action: "generate";
  data: {
    questions: InterviewQuestion[];
    interviewTips: string[];
    totalTime: number;
  };
}

export interface EvaluateAnswerRequest {
  action: "evaluate";
  question: string;
  answer: string;
  jobTitle?: string;
}

export interface EvaluateAnswerResponse {
  success: boolean;
  action: "evaluate";
  data: {
    score: number;
    grade: "A" | "B" | "C" | "D" | "F";
    evaluation: {
      technicalAccuracy: number;
      completeness: number;
      communication: number;
      confidence: number;
    };
    feedback: {
      summary: string;
      strengths: string[];
      improvements: string[];
      missedPoints: string[];
    };
    idealAnswer: string;
    coachingTips: Array<{
      tip: string;
      example: string;
    }>;
    followUpSuggested: string;
  };
}

export interface InterviewResponse {
  question: string;
  answer: string;
  score?: number;
}

export interface GetSummaryRequest {
  action: "summary";
  jobTitle: string;
  responses: InterviewResponse[];
}

export interface GetSummaryResponse {
  success: boolean;
  action: "summary";
  data: {
    overallScore: number;
    overallGrade: string;
    recommendation: "strong_hire" | "hire" | "maybe" | "no_hire";
    summary: string;
    categoryScores: {
      technicalKnowledge: number;
      communication: number;
      problemSolving: number;
      safetyAwareness: number;
      professionalism: number;
    };
    topStrengths: string[];
    areasForImprovement: string[];
    developmentPlan: Array<{
      skill: string;
      currentLevel: string;
      recommendation: string;
      timeline: string;
    }>;
    suggestedNextSteps: string[];
  };
}

export async function interviewCoach(
  request: GenerateQuestionsRequest | EvaluateAnswerRequest | GetSummaryRequest
): Promise<GenerateQuestionsResponse | EvaluateAnswerResponse | GetSummaryResponse> {
  const { data, error } = await supabase.functions.invoke('n8n-proxy', {
    body: {
      endpoint: '/interview-coach',
      payload: request
    }
  });

  if (error) throw new Error(error.message);
  
  // Handle n8n array-wrapped responses
  const result = Array.isArray(data) ? data[0] : data;
  
  // Transform n8n response format to expected interface
  if (request.action === 'generate' && result.mode === 'generate' && result.question) {
    // n8n returns single question, wrap in expected format
    const n8nQuestion = result.question;
    return {
      success: result.success,
      action: 'generate',
      data: {
        questions: [{
          id: 1,
          question: n8nQuestion.text,
          type: n8nQuestion.type || 'technical',
          difficulty: n8nQuestion.difficulty || 'medium',
          keyPoints: n8nQuestion.idealAnswerPoints || [],
          redFlags: n8nQuestion.redFlags || [],
          followUp: n8nQuestion.followUpQuestions?.[0] || '',
          timeLimit: n8nQuestion.timeLimit || 120,
          skillsTested: n8nQuestion.keyTopics || [],
        }],
        interviewTips: [n8nQuestion.tip || 'Take your time and think through your answer.'],
        totalTime: n8nQuestion.timeLimit || 120,
      }
    } as GenerateQuestionsResponse;
  }
  
  // Handle evaluate response
  if (request.action === 'evaluate' && result.mode === 'evaluate') {
    return {
      success: result.success,
      action: 'evaluate',
      data: result.evaluation || result.data || result
    } as EvaluateAnswerResponse;
  }
  
  // Handle summary response  
  if (request.action === 'summary' && result.mode === 'summary') {
    return {
      success: result.success,
      action: 'summary',
      data: result.summary || result.data || result
    } as GetSummaryResponse;
  }
  
  return result;
}

// ==================== SAFETY COMPLIANCE MONITOR ====================

export interface SafetyViolation {
  id: string;
  category: string;
  severity: "observation" | "minor" | "major" | "critical" | "imminent_danger";
  description: string;
  location: string;
  oshaStandard: string;
  correctiveAction: string;
  estimatedCost: "low" | "medium" | "high";
  timeToCorrect: "immediate" | "hours" | "days";
}

export interface SafetyComplianceRequest {
  imageBase64: string;
  workType: string;
  location: string;
  industry: string;
  checklistType: "comprehensive" | "quick" | "ppe-only";
  focusAreas: Array<"ppe" | "fire_safety" | "ventilation" | "electrical" | "housekeeping" | "cylinders" | "welding_screens" | "emergency">;
  standards: string[];
  employerId?: string;
  jobSiteId?: string;
}

export interface SafetyComplianceResponse {
  success: boolean;
  inspection: {
    overallComplianceScore: number;
    complianceLevel: "compliant" | "minor_issues" | "major_issues" | "critical_violations";
    immediateActionRequired: boolean;
    violations: SafetyViolation[];
    compliantItems: Array<{
      category: string;
      observation: string;
    }>;
    categoryScores: {
      ppe: number;
      fireSafety: number;
      ventilation: number;
      electrical: number;
      housekeeping: number;
      cylinderSafety: number;
      weldingScreens: number;
      emergencyEquipment: number;
    };
    riskAssessment: {
      overallRisk: "low" | "medium" | "high" | "critical";
      primaryRisks: string[];
      potentialConsequences: string[];
    };
    recommendations: Array<{
      priority: "immediate" | "high" | "medium" | "low";
      action: string;
      benefit: string;
      estimatedCost: string;
    }>;
    trainingNeeds: string[];
    documentationRequired: string[];
    summary: string;
  };
  statistics: {
    totalViolations: number;
    violationsBySeverity: Record<string, number>;
    totalCompliantItems: number;
  };
  metadata: {
    workType: string;
    location: string;
    inspectedAt: string;
  };
}

export async function checkSafetyCompliance(request: SafetyComplianceRequest): Promise<SafetyComplianceResponse> {
  const { data, error } = await supabase.functions.invoke('n8n-proxy', {
    body: {
      endpoint: '/safety-compliance',
      payload: request
    }
  });

  if (error) throw new Error(error.message);
  return data;
}

// ==================== CAREER PATH PREDICTOR ====================

export interface CareerPathRequest {
  name?: string;
  currentTitle: string;
  yearsExperience: number;
  currentProcesses: string[];
  currentCertifications: string[];
  currentPositions: string[];
  currentSalary?: number;
  salaryPeriod: "hourly" | "annual";
  location: string;
  education: string;
  industries: string[];
  targetRole?: string;
  targetSalary?: number;
  timeline: string;
  willingToRelocate: boolean;
  willingToTravel: boolean;
  interestedInManagement: boolean;
  interestedInSpecialties: string[];
  preferredIndustries: string[];
  welderId?: string;
}

export interface CareerPath {
  pathName: string;
  description: string;
  suitabilityScore: number;
  timeline: string;
  salaryProgression: {
    current: string;
    year1: string;
    year3: string;
    year5: string;
  };
  requiredSteps: Array<{
    step: number;
    action: string;
    duration: string;
    cost: string;
    roi: string;
  }>;
  risks: string[];
  advantages: string[];
}

export interface RecommendedCertification {
  certification: string;
  priority: number;
  reason: string;
  cost: string;
  timeToComplete: string;
  expectedSalaryIncrease: string;
  roi: string;
  demandTrend: "growing" | "stable" | "declining";
}

export interface CareerPathResponse {
  success: boolean;
  prediction: {
    marketAnalysis: {
      currentDemand: {
        overall: "high" | "medium" | "low";
        bySpecialty: Record<string, {
          demand: string;
          trend: string;
          salaryRange: string;
        }>;
        hotLocations: Array<{
          location: string;
          industries: string[];
          avgSalary: string;
        }>;
      };
      futureOutlook: {
        twoYear: string;
        fiveYear: string;
        emergingOpportunities: string[];
      };
    };
    profileAssessment: {
      currentMarketValue: string;
      strengthsAnalysis: Array<{
        strength: string;
        marketValue: string;
      }>;
      gapsIdentified: Array<{
        gap: string;
        impact: string;
        priority: "high" | "medium" | "low";
      }>;
      competitivePosition: string;
    };
    careerPaths: CareerPath[];
    recommendedCertifications: RecommendedCertification[];
    skillDevelopment: Array<{
      skill: string;
      currentLevel: string;
      targetLevel: string;
      resources: string[];
      timeline: string;
    }>;
    actionPlan: {
      immediate: Array<{ action: string; deadline: string; impact: string }>;
      shortTerm: Array<{ action: string; deadline: string; impact: string }>;
      longTerm: Array<{ action: string; deadline: string; impact: string }>;
    };
    salaryNegotiationInsights: {
      currentFairValue: string;
      negotiationPoints: string[];
      marketComparison: string;
    };
    summary: string;
  };
  profile: object;
  goals: object;
  analyzedAt: string;
}

export async function predictCareerPath(request: CareerPathRequest): Promise<CareerPathResponse> {
  const { data, error } = await supabase.functions.invoke('n8n-proxy', {
    body: {
      endpoint: '/career-path',
      payload: request
    }
  });

  if (error) throw new Error(error.message);
  return data;
}

// ==================== UTILITY FUNCTIONS ====================

export function getGradeColor(grade: string): string {
  switch (grade) {
    case "A": return "text-green-600";
    case "B": return "text-blue-600";
    case "C": return "text-yellow-600";
    case "D": return "text-orange-600";
    case "F": return "text-red-600";
    default: return "text-muted-foreground";
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "observation":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "minor":
    case "moderate":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "major":
      return "text-orange-600 bg-orange-50 border-orange-200";
    case "critical":
    case "imminent_danger":
      return "text-red-600 bg-red-50 border-red-200";
    default:
      return "text-muted-foreground bg-muted border-border";
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "high":
    case "immediate":
      return "text-red-600 bg-red-50";
    case "medium":
      return "text-yellow-600 bg-yellow-50";
    case "low":
      return "text-green-600 bg-green-50";
    default:
      return "text-muted-foreground bg-muted";
  }
}

export function getRiskColor(risk: string): string {
  switch (risk) {
    case "low":
      return "text-green-600";
    case "medium":
      return "text-yellow-600";
    case "high":
      return "text-orange-600";
    case "critical":
      return "text-red-600";
    default:
      return "text-muted-foreground";
  }
}

export function getScoreColor(score: number): string {
  if (score >= 90) return "text-green-600";
  if (score >= 70) return "text-blue-600";
  if (score >= 50) return "text-yellow-600";
  if (score >= 30) return "text-orange-600";
  return "text-red-600";
}

export function getScoreBgColor(score: number): string {
  if (score >= 90) return "bg-green-500";
  if (score >= 70) return "bg-blue-500";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 30) return "bg-orange-500";
  return "bg-red-500";
}
