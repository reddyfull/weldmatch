import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/ui/page-transition";

// Public Pages
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import RegisterWelder from "@/pages/RegisterWelder";
import RegisterEmployer from "@/pages/RegisterEmployer";
import Pricing from "@/pages/Pricing";
import NotFound from "@/pages/NotFound";

// Post-Login Flow
import PostLoginRouter from "@/pages/PostLoginRouter";
import ChooseRole from "@/pages/ChooseRole";

// Welder Pages
import WelderDashboard from "@/pages/welder/WelderDashboard";
import WelderProfileSetup from "@/pages/welder/WelderProfileSetup";
import WelderProfileEdit from "@/pages/welder/WelderProfileEdit";
import WelderDocuments from "@/pages/welder/WelderDocuments";
import WelderApplications from "@/pages/welder/WelderApplications";
import WelderJobs from "@/pages/welder/WelderJobs";
import JobDetail from "@/pages/welder/JobDetail";
import CareerCoach from "@/pages/welder/CareerCoach";
import WeldAnalyzer from "@/pages/welder/WeldAnalyzer";
import InterviewCoach from "@/pages/welder/InterviewCoach";
import CareerPathPredictor from "@/pages/welder/CareerPathPredictor";
import WelderAIChatAssistant from "@/pages/welder/AIChatAssistant";
import ResumeBuilder from "@/pages/welder/ResumeBuilder";
import CoverLetterGenerator from "@/pages/welder/CoverLetterGenerator";
import WelderMarketIntelligence from "@/pages/welder/MarketIntelligence";
import PublicProfile from "@/pages/welder/PublicProfile";
import ProfileSettings from "@/pages/welder/ProfileSettings";

// Employer Pages
import EmployerDashboard from "@/pages/employer/EmployerDashboard";
import EmployerProfileSetup from "@/pages/employer/EmployerProfileSetup";
import EmployerProfileEdit from "@/pages/employer/EmployerProfileEdit";
import EmployerJobs from "@/pages/employer/EmployerJobs";
import EmployerCandidates from "@/pages/employer/EmployerCandidates";
import JobPostingForm from "@/pages/employer/JobPostingForm";
import EmployerSettings from "@/pages/employer/EmployerSettings";
import CrewOptimizer from "@/pages/employer/CrewOptimizer";
import SafetyMonitor from "@/pages/employer/SafetyMonitor";
import EmployerAIChatAssistant from "@/pages/employer/AIChatAssistant";
import CandidateOutreach from "@/pages/employer/CandidateOutreach";
import EmployerMarketIntelligence from "@/pages/employer/MarketIntelligence";

// Admin Pages
import AdminCertifications from "@/pages/admin/AdminCertifications";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminPayments from "@/pages/admin/AdminPayments";
import AdminAuditLog from "@/pages/admin/AdminAuditLog";

// Demo Pages
import EncryptionDemo from "@/pages/demo/EncryptionDemo";

// Wrapper component to add transition to each page
function AnimatedPage({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}

export default function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<AnimatedPage><Index /></AnimatedPage>} />
        <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
        <Route path="/pricing" element={<AnimatedPage><Pricing /></AnimatedPage>} />
        <Route path="/register/welder" element={<AnimatedPage><RegisterWelder /></AnimatedPage>} />
        <Route path="/register/employer" element={<AnimatedPage><RegisterEmployer /></AnimatedPage>} />
        
        {/* Post-Login Flow */}
        <Route path="/dashboard" element={<AnimatedPage><PostLoginRouter /></AnimatedPage>} />
        <Route path="/choose-role" element={<AnimatedPage><ChooseRole /></AnimatedPage>} />
        
        {/* Welder Routes */}
        <Route path="/welder/dashboard" element={<AnimatedPage><WelderDashboard /></AnimatedPage>} />
        <Route path="/welder/profile/setup" element={<AnimatedPage><WelderProfileSetup /></AnimatedPage>} />
        <Route path="/welder/profile/edit" element={<AnimatedPage><WelderProfileEdit /></AnimatedPage>} />
        <Route path="/welder/documents" element={<AnimatedPage><WelderDocuments /></AnimatedPage>} />
        <Route path="/welder/applications" element={<AnimatedPage><WelderApplications /></AnimatedPage>} />
        <Route path="/welder/jobs" element={<AnimatedPage><WelderJobs /></AnimatedPage>} />
        <Route path="/welder/jobs/:jobId" element={<AnimatedPage><JobDetail /></AnimatedPage>} />
        <Route path="/welder/career-coach" element={<AnimatedPage><CareerCoach /></AnimatedPage>} />
        <Route path="/welder/weld-analyzer" element={<AnimatedPage><WeldAnalyzer /></AnimatedPage>} />
        <Route path="/welder/interview-coach" element={<AnimatedPage><InterviewCoach /></AnimatedPage>} />
        <Route path="/welder/career-path" element={<AnimatedPage><CareerPathPredictor /></AnimatedPage>} />
        <Route path="/welder/chat" element={<AnimatedPage><WelderAIChatAssistant /></AnimatedPage>} />
        <Route path="/welder/resume-builder" element={<AnimatedPage><ResumeBuilder /></AnimatedPage>} />
        <Route path="/welder/cover-letter" element={<AnimatedPage><CoverLetterGenerator /></AnimatedPage>} />
        <Route path="/welder/market-intelligence" element={<AnimatedPage><WelderMarketIntelligence /></AnimatedPage>} />
        <Route path="/welder/profile/settings" element={<AnimatedPage><ProfileSettings /></AnimatedPage>} />
        
        {/* Public Welder Profile */}
        <Route path="/w/:username" element={<AnimatedPage><PublicProfile /></AnimatedPage>} />
        
        {/* Employer Routes */}
        <Route path="/employer/dashboard" element={<AnimatedPage><EmployerDashboard /></AnimatedPage>} />
        <Route path="/employer/profile/setup" element={<AnimatedPage><EmployerProfileSetup /></AnimatedPage>} />
        <Route path="/employer/profile/edit" element={<AnimatedPage><EmployerProfileEdit /></AnimatedPage>} />
        <Route path="/employer/jobs" element={<AnimatedPage><EmployerJobs /></AnimatedPage>} />
        <Route path="/employer/candidates" element={<AnimatedPage><EmployerCandidates /></AnimatedPage>} />
        <Route path="/employer/jobs/new" element={<AnimatedPage><JobPostingForm /></AnimatedPage>} />
        <Route path="/employer/settings" element={<AnimatedPage><EmployerSettings /></AnimatedPage>} />
        <Route path="/employer/crew-optimizer" element={<AnimatedPage><CrewOptimizer /></AnimatedPage>} />
        <Route path="/employer/safety-monitor" element={<AnimatedPage><SafetyMonitor /></AnimatedPage>} />
        <Route path="/employer/chat" element={<AnimatedPage><EmployerAIChatAssistant /></AnimatedPage>} />
        <Route path="/employer/outreach" element={<AnimatedPage><CandidateOutreach /></AnimatedPage>} />
        <Route path="/employer/market-intelligence" element={<AnimatedPage><EmployerMarketIntelligence /></AnimatedPage>} />
        
        {/* Admin Routes */}
        <Route path="/admin/certifications" element={<AnimatedPage><AdminCertifications /></AnimatedPage>} />
        <Route path="/admin/payments" element={<AnimatedPage><AdminPayments /></AnimatedPage>} />
        <Route path="/admin/users" element={<AnimatedPage><AdminUsers /></AnimatedPage>} />
        <Route path="/admin/audit-log" element={<AnimatedPage><AdminAuditLog /></AnimatedPage>} />
        <Route path="/admin/dashboard" element={<AnimatedPage><AdminCertifications /></AnimatedPage>} />
        
        {/* Demo Routes */}
        <Route path="/demo/encryption" element={<AnimatedPage><EncryptionDemo /></AnimatedPage>} />
        
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<AnimatedPage><NotFound /></AnimatedPage>} />
      </Routes>
    </AnimatePresence>
  );
}
