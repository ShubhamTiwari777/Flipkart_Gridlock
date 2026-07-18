import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import OverviewPage from "@/pages/Overview";
import PredictPage from "@/pages/Predict";
import AnalyticsPage from "@/pages/Analytics";
import PipelinePage from "@/pages/Pipeline";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60_000, retry: 1 } },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={OverviewPage} />
        <Route path="/predict" component={PredictPage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="/pipeline" component={PipelinePage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
