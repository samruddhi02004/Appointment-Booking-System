import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";

// Auth
import Login from "@/pages/auth/login";
import Signup from "@/pages/auth/signup";
import VerifyOtp from "@/pages/auth/verify-otp";
import ForgotPassword from "@/pages/auth/forgot-password";
import ResetPassword from "@/pages/auth/reset-password";

// Customer
import Home from "@/pages/customer/home";
import BusinessPage from "@/pages/customer/business";
import BookAppointment from "@/pages/customer/book";
import BookingConfirmation from "@/pages/customer/booking-confirmation";
import MyBookings from "@/pages/customer/my-bookings";

// Shared
import Profile from "@/pages/shared/profile";

// Organiser
import OrganiserDashboard from "@/pages/organiser/dashboard";
import OrganiserBusiness from "@/pages/organiser/business-setup";
import OrganiserAppointments from "@/pages/organiser/appointments/list";
import OrganiserAppointmentsNew from "@/pages/organiser/appointments/new";
import OrganiserAppointmentsEdit from "@/pages/organiser/appointments/edit";
import OrganiserBookings from "@/pages/organiser/bookings/list";
import OrganiserCalendar from "@/pages/organiser/calendar";
import OrganiserReports from "@/pages/organiser/reports";

// Admin
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminBusinesses from "@/pages/admin/businesses";

import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/verify-otp" component={VerifyOtp} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />

      {/* Customer Routes */}
      <ProtectedRoute path="/" component={Home} allowedRoles={["customer"]} />
      <ProtectedRoute path="/business/:slug" component={BusinessPage} allowedRoles={["customer"]} />
      <ProtectedRoute path="/book/:appointmentId" component={BookAppointment} allowedRoles={["customer"]} />
      <ProtectedRoute path="/booking-confirmation/:bookingId" component={BookingConfirmation} allowedRoles={["customer"]} />
      <ProtectedRoute path="/my-bookings" component={MyBookings} allowedRoles={["customer"]} />

      {/* Shared */}
      <ProtectedRoute path="/profile" component={Profile} />

      {/* Organiser Routes */}
      <ProtectedRoute path="/organiser" component={OrganiserDashboard} allowedRoles={["organiser"]} />
      <ProtectedRoute path="/organiser/business" component={OrganiserBusiness} allowedRoles={["organiser"]} />
      <ProtectedRoute path="/organiser/appointments" component={OrganiserAppointments} allowedRoles={["organiser"]} />
      <ProtectedRoute path="/organiser/appointments/new" component={OrganiserAppointmentsNew} allowedRoles={["organiser"]} />
      <ProtectedRoute path="/organiser/appointments/:appointmentId/edit" component={OrganiserAppointmentsEdit} allowedRoles={["organiser"]} />
      <ProtectedRoute path="/organiser/bookings" component={OrganiserBookings} allowedRoles={["organiser"]} />
      <ProtectedRoute path="/organiser/calendar" component={OrganiserCalendar} allowedRoles={["organiser"]} />
      <ProtectedRoute path="/organiser/reports" component={OrganiserReports} allowedRoles={["organiser"]} />

      {/* Admin Routes */}
      <ProtectedRoute path="/admin" component={AdminDashboard} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/users" component={AdminUsers} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/businesses" component={AdminBusinesses} allowedRoles={["admin"]} />

      {/* Catch-all */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
