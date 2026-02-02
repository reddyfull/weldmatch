import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Public Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import RegisterWelder from "./pages/RegisterWelder";
import RegisterEmployer from "./pages/RegisterEmployer";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";

// Post-Login Flow
import PostLoginRouter from "./pages/PostLoginRouter";
import ChooseRole from "./pages/ChooseRole";

// Welder Pages
import WelderDashboard from "./pages/welder/WelderDashboard";
import WelderProfileSetup from "./pages/welder/WelderProfileSetup";
import WelderProfileEdit from "./pages/welder/WelderProfileEdit";
import WelderDocuments from "./pages/welder/WelderDocuments";
import WelderApplications from "./pages/welder/WelderApplications";
import WelderJobs from "./pages/welder/WelderJobs";
import JobDetail from "./pages/welder/JobDetail";
import CareerCoach from "./pages/welder/CareerCoach";
import WeldAnalyzer from "./pages/welder/WeldAnalyzer";
import InterviewCoach from "./pages/welder/InterviewCoach";
import CareerPathPredictor from "./pages/welder/CareerPathPredictor";
import WelderAIChatAssistant from "./pages/welder/AIChatAssistant";
import ResumeBuilder from "./pages/welder/ResumeBuilder";
import CoverLetterGenerator from "./pages/welder/CoverLetterGenerator";
import WelderMarketIntelligence from "./pages/welder/MarketIntelligence";
import PublicProfile from "./pages/welder/PublicProfile";
import ProfileSettings from "./pages/welder/ProfileSettings";

// Employer Pages
import EmployerDashboard from "./pages/employer/EmployerDashboard";
import EmployerProfileSetup from "./pages/employer/EmployerProfileSetup";
import EmployerProfileEdit from "./pages/employer/EmployerProfileEdit";
import EmployerJobs from "./pages/employer/EmployerJobs";
import EmployerCandidates from "./pages/employer/EmployerCandidates";
import JobPostingForm from "./pages/employer/JobPostingForm";
import EmployerSettings from "./pages/employer/EmployerSettings";
import CrewOptimizer from "./pages/employer/CrewOptimizer";
import SafetyMonitor from "./pages/employer/SafetyMonitor";
import EmployerAIChatAssistant from "./pages/employer/AIChatAssistant";
import CandidateOutreach from "./pages/employer/CandidateOutreach";
import EmployerMarketIntelligence from "./pages/employer/MarketIntelligence";

// Admin Pages
import AdminCertifications from "./pages/admin/AdminCertifications";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminAuditLog from "./pages/admin/AdminAuditLog";

// Demo Pages
import EncryptionDemo from "./pages/demo/EncryptionDemo";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/register/welder" element={<RegisterWelder />} />
            <Route path="/register/employer" element={<RegisterEmployer />} />
            
            {/* Post-Login Flow */}
            <Route path="/dashboard" element={<PostLoginRouter />} />
            <Route path="/choose-role" element={<ChooseRole />} />
            
            {/* Welder Routes */}
            <Route path="/welder/dashboard" element={<WelderDashboard />} />
            <Route path="/welder/profile/setup" element={<WelderProfileSetup />} />
            <Route path="/welder/profile/edit" element={<WelderProfileEdit />} />
            <Route path="/welder/documents" element={<WelderDocuments />} />
            <Route path="/welder/applications" element={<WelderApplications />} />
            <Route path="/welder/jobs" element={<WelderJobs />} />
            <Route path="/welder/jobs/:jobId" element={<JobDetail />} />
            <Route path="/welder/career-coach" element={<CareerCoach />} />
            <Route path="/welder/weld-analyzer" element={<WeldAnalyzer />} />
            <Route path="/welder/interview-coach" element={<InterviewCoach />} />
            <Route path="/welder/career-path" element={<CareerPathPredictor />} />
            <Route path="/welder/chat" element={<WelderAIChatAssistant />} />
            <Route path="/welder/resume-builder" element={<ResumeBuilder />} />
            <Route path="/welder/cover-letter" element={<CoverLetterGenerator />} />
            <Route path="/welder/market-intelligence" element={<WelderMarketIntelligence />} />
            <Route path="/welder/profile/settings" element={<ProfileSettings />} />
            
            {/* Public Welder Profile */}
            <Route path="/w/:username" element={<PublicProfile />} />
            
            {/* Employer Routes */}
            <Route path="/employer/dashboard" element={<EmployerDashboard />} />
            <Route path="/employer/profile/setup" element={<EmployerProfileSetup />} />
            <Route path="/employer/profile/edit" element={<EmployerProfileEdit />} />
            <Route path="/employer/jobs" element={<EmployerJobs />} />
            <Route path="/employer/candidates" element={<EmployerCandidates />} />
            <Route path="/employer/jobs/new" element={<JobPostingForm />} />
            <Route path="/employer/settings" element={<EmployerSettings />} />
            <Route path="/employer/crew-optimizer" element={<CrewOptimizer />} />
            <Route path="/employer/safety-monitor" element={<SafetyMonitor />} />
            <Route path="/employer/chat" element={<EmployerAIChatAssistant />} />
            <Route path="/employer/outreach" element={<CandidateOutreach />} />
            <Route path="/employer/market-intelligence" element={<EmployerMarketIntelligence />} />
            
            {/* Admin Routes */}
            <Route path="/admin/certifications" element={<AdminCertifications />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/audit-log" element={<AdminAuditLog />} />
            <Route path="/admin/dashboard" element={<AdminCertifications />} />
            
            {/* Demo Routes */}
            <Route path="/demo/encryption" element={<EncryptionDemo />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
