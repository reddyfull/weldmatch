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

// Employer Pages
import EmployerDashboard from "./pages/employer/EmployerDashboard";
import EmployerProfileSetup from "./pages/employer/EmployerProfileSetup";
import EmployerProfileEdit from "./pages/employer/EmployerProfileEdit";
import EmployerJobs from "./pages/employer/EmployerJobs";
import JobPostingForm from "./pages/employer/JobPostingForm";

// Admin Pages
import AdminCertifications from "./pages/admin/AdminCertifications";

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
            
            {/* Employer Routes */}
            <Route path="/employer/dashboard" element={<EmployerDashboard />} />
            <Route path="/employer/profile/setup" element={<EmployerProfileSetup />} />
            <Route path="/employer/profile/edit" element={<EmployerProfileEdit />} />
            <Route path="/employer/jobs" element={<EmployerJobs />} />
            <Route path="/employer/jobs/new" element={<JobPostingForm />} />
            
            {/* Admin Routes */}
            <Route path="/admin/certifications" element={<AdminCertifications />} />
            <Route path="/admin/dashboard" element={<AdminCertifications />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
