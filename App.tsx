import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, SignIn } from "@clerk/react";
import { useUser } from "@clerk/react";
import { AppLayout } from "@/components/AppLayout";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Calendar from "@/pages/calendar";
import Tasks from "@/pages/tasks";
import Meals from "@/pages/meals";
import AI from "@/pages/ai";
import Family from "@/pages/family";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/meals" component={Meals} />
      <Route path="/ai" component={AI} />
      <Route path="/family" component={Family} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <SignIn routing="hash" />
      </div>
    );
  }

  return (
    <AppLayout>
      <Router />
    </AppLayout>
  );
}

function App() {
  const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!PUBLISHABLE_KEY) {
    throw new Error("Missing Publishable Key");
  }

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      localization={{
        signIn: { start: { title: "Sign in to NaturHome Hub" } },
        signUp: { start: { title: "Create your NaturHome Hub account" } },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_PATH?.replace(/\/$/, "")}>
            <AppContent />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
