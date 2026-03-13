import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { ResumeAnalyzer } from "./pages/ResumeAnalyzer";
import { JobDiscovery } from "./pages/JobDiscovery";
import { JobTracker } from "./pages/JobTracker";
import { SkillGapMap } from "./pages/SkillGapMap";
import { Settings } from "./pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "resume-analyzer", Component: ResumeAnalyzer },
      { path: "job-discovery", Component: JobDiscovery },
      { path: "job-tracker", Component: JobTracker },
      { path: "skill-gap-map", Component: SkillGapMap },
      { path: "settings", Component: Settings },
    ],
  },
]);
