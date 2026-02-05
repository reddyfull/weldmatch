import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/ui/page-transition";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Loading component for lazy-loaded routes
const RouteLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Public Pages - Keep Index eager for fast initial load
import Index from "@/pages/Index";

// Lazy load all other pages for code splitting
const Login = lazy(() => import("@/pages/Login"));
const RegisterWelder = lazy(() => import("@/pages/RegisterWelder"));
const RegisterEmployer = lazy(() => import("@/pages/RegisterEmployer"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Post-Login Flow
const PostLoginRouter = lazy(() => import("@/pages/PostLoginRouter"));
const ChooseRole = lazy(() => import("@/pages/ChooseRole"));

// Welder Pages
const WelderDashboard = lazy(() => import("@/pages/welder/WelderDashboard"));
const WelderProfileSetup = lazy(() => import("@/pages/welder/WelderProfileSetup"));
const WelderProfileEdit = lazy(() => import("@/pages/welder/WelderProfileEdit"));
const WelderDocuments = lazy(() => import("@/pages/welder/WelderDocuments"));
const WelderApplications = lazy(() => import("@/pages/welder/WelderApplications"));
const WelderJobs = lazy(() => import("@/pages/welder/WelderJobs"));
const JobDetail = lazy(() => import("@/pages/welder/JobDetail"));
const CareerCoach = lazy(() => import("@/pages/welder/CareerCoach"));
const WeldAnalyzer = lazy(() => import("@/pages/welder/WeldAnalyzer"));
const InterviewCoach = lazy(() => import("@/pages/welder/InterviewCoach"));
const CareerPathPredictor = lazy(() => import("@/pages/welder/CareerPathPredictor"));
const WelderAIChatAssistant = lazy(() => import("@/pages/welder/AIChatAssistant"));
const ResumeBuilder = lazy(() => import("@/pages/welder/ResumeBuilder"));
const CoverLetterGenerator = lazy(() => import("@/pages/welder/CoverLetterGenerator"));
const WelderMarketIntelligence = lazy(() => import("@/pages/welder/MarketIntelligence"));
const PublicProfile = lazy(() => import("@/pages/welder/PublicProfile"));
const ProfileSettings = lazy(() => import("@/pages/welder/ProfileSettings"));

// Employer Pages
const EmployerDashboard = lazy(() => import("@/pages/employer/EmployerDashboard"));
const EmployerProfileSetup = lazy(() => import("@/pages/employer/EmployerProfileSetup"));
const EmployerProfileEdit = lazy(() => import("@/pages/employer/EmployerProfileEdit"));
const EmployerJobs = lazy(() => import("@/pages/employer/EmployerJobs"));
const EmployerCandidates = lazy(() => import("@/pages/employer/EmployerCandidates"));
const JobPostingForm = lazy(() => import("@/pages/employer/JobPostingForm"));
const EmployerSettings = lazy(() => import("@/pages/employer/EmployerSettings"));
const CrewOptimizer = lazy(() => import("@/pages/employer/CrewOptimizer"));
const SafetyMonitor = lazy(() => import("@/pages/employer/SafetyMonitor"));
const EmployerAIChatAssistant = lazy(() => import("@/pages/employer/AIChatAssistant"));
const CandidateOutreach = lazy(() => import("@/pages/employer/CandidateOutreach"));
const EmployerMarketIntelligence = lazy(() => import("@/pages/employer/MarketIntelligence"));

// Admin Pages
const AdminCertifications = lazy(() => import("@/pages/admin/AdminCertifications"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminPayments = lazy(() => import("@/pages/admin/AdminPayments"));
const AdminAuditLog = lazy(() => import("@/pages/admin/AdminAuditLog"));

// Demo Pages
const EncryptionDemo = lazy(() => import("@/pages/demo/EncryptionDemo"));

// Wrapper component to add transition to each page
function AnimatedPage({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}

// Wrapper for lazy-loaded pages with suspense
function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<RouteLoader />}>
      <PageTransition>{children}</PageTransition>
    </Suspense>
  );
}

export default function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public Routes - Index is eager loaded for fast initial paint */}
        <Route path="/" element={<AnimatedPage><Index /></AnimatedPage>} />
        <Route path="/login" element={<LazyPage><Login /></LazyPage>} />
        <Route path="/pricing" element={<LazyPage><Pricing /></LazyPage>} />
        <Route path="/register/welder" element={<LazyPage><RegisterWelder /></LazyPage>} />
        <Route path="/register/employer" element={<LazyPage><RegisterEmployer /></LazyPage>} />
        
        {/* Post-Login Flow */}
        <Route path="/dashboard" element={<LazyPage><PostLoginRouter /></LazyPage>} />
        <Route path="/choose-role" element={<LazyPage><ChooseRole /></LazyPage>} />
        
        {/* Welder Routes */}
        <Route path="/welder/dashboard" element={<LazyPage><WelderDashboard /></LazyPage>} />
        <Route path="/welder/profile/setup" element={<LazyPage><WelderProfileSetup /></LazyPage>} />
        <Route path="/welder/profile/edit" element={<LazyPage><WelderProfileEdit /></LazyPage>} />
        <Route path="/welder/documents" element={<LazyPage><WelderDocuments /></LazyPage>} />
        <Route path="/welder/applications" element={<LazyPage><WelderApplications /></LazyPage>} />
        <Route path="/welder/jobs" element={<LazyPage><WelderJobs /></LazyPage>} />
        <Route path="/welder/jobs/:jobId" element={<LazyPage><JobDetail /></LazyPage>} />
        <Route path="/welder/career-coach" element={<LazyPage><CareerCoach /></LazyPage>} />
        <Route path="/welder/weld-analyzer" element={<LazyPage><WeldAnalyzer /></LazyPage>} />
        <Route path="/welder/interview-coach" element={<LazyPage><InterviewCoach /></LazyPage>} />
        <Route path="/welder/career-path" element={<LazyPage><CareerPathPredictor /></LazyPage>} />
        <Route path="/welder/chat" element={<LazyPage><WelderAIChatAssistant /></LazyPage>} />
        <Route path="/welder/resume-builder" element={<LazyPage><ResumeBuilder /></LazyPage>} />
        <Route path="/welder/cover-letter" element={<LazyPage><CoverLetterGenerator /></LazyPage>} />
        <Route path="/welder/market-intelligence" element={<LazyPage><WelderMarketIntelligence /></LazyPage>} />
        <Route path="/welder/profile/settings" element={<LazyPage><ProfileSettings /></LazyPage>} />
        
        {/* Public Welder Profile */}
        <Route path="/w/:username" element={<LazyPage><PublicProfile /></LazyPage>} />
        
        {/* Employer Routes */}
        <Route path="/employer/dashboard" element={<LazyPage><EmployerDashboard /></LazyPage>} />
        <Route path="/employer/profile/setup" element={<LazyPage><EmployerProfileSetup /></LazyPage>} />
        <Route path="/employer/profile/edit" element={<LazyPage><EmployerProfileEdit /></LazyPage>} />
        <Route path="/employer/jobs" element={<LazyPage><EmployerJobs /></LazyPage>} />
        <Route path="/employer/candidates" element={<LazyPage><EmployerCandidates /></LazyPage>} />
        <Route path="/employer/jobs/new" element={<LazyPage><JobPostingForm /></LazyPage>} />
        <Route path="/employer/settings" element={<LazyPage><EmployerSettings /></LazyPage>} />
        <Route path="/employer/crew-optimizer" element={<LazyPage><CrewOptimizer /></LazyPage>} />
        <Route path="/employer/safety-monitor" element={<LazyPage><SafetyMonitor /></LazyPage>} />
        <Route path="/employer/chat" element={<LazyPage><EmployerAIChatAssistant /></LazyPage>} />
        <Route path="/employer/outreach" element={<LazyPage><CandidateOutreach /></LazyPage>} />
        <Route path="/employer/market-intelligence" element={<LazyPage><EmployerMarketIntelligence /></LazyPage>} />
        
        {/* Admin Routes */}
        <Route path="/admin/certifications" element={<LazyPage><AdminCertifications /></LazyPage>} />
        <Route path="/admin/payments" element={<LazyPage><AdminPayments /></LazyPage>} />
        <Route path="/admin/users" element={<LazyPage><AdminUsers /></LazyPage>} />
        <Route path="/admin/audit-log" element={<LazyPage><AdminAuditLog /></LazyPage>} />
        <Route path="/admin/dashboard" element={<LazyPage><AdminCertifications /></LazyPage>} />
        
        {/* Demo Routes */}
        <Route path="/demo/encryption" element={<LazyPage><EncryptionDemo /></LazyPage>} />
        
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<LazyPage><NotFound /></LazyPage>} />
      </Routes>
    </AnimatePresence>
  );
}
