import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/lib/store";
import Layout from "@/components/layout";
import AuthPage from "@/pages/auth";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminEmployees from "@/pages/admin-employees";
import AdminAttendance from "@/pages/admin-attendance";
import PayrollList from "@/pages/payroll-list";
import PayrollSlip from "@/pages/payroll-slip";
import AttendanceCapture from "@/pages/attendance-capture";
import EmployeeDashboard from "@/pages/employee-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        {/* Auth */}
        <Route path="/" component={AuthPage} />
        
        {/* Admin Routes */}
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/employees" component={AdminEmployees} />
        <Route path="/admin/attendance" component={AdminAttendance} />
        <Route path="/admin/payroll" component={PayrollList} />
        <Route path="/admin/payroll/:id" component={PayrollSlip} />
        <Route path="/admin/settings" component={() => <div>Settings Page (Mock)</div>} />

        {/* Employee Routes */}
        <Route path="/employee" component={EmployeeDashboard} />
        <Route path="/employee/attendance" component={AttendanceCapture} />
        <Route path="/employee/leave" component={() => <div>Leave Request Page (Mock)</div>} />
        <Route path="/employee/payslips" component={() => <div>My Payslips (Mock)</div>} />

        {/* Fallback */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
