import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/SiteChrome";
import { RegisterCTA, ScheduleSection } from "@/components/site/Sections";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/schedule")({
  head: () => seo("Schedule — Circuit2Cloud Hardware Edition", "The two-day timeline of Circuit2Cloud: from Patient File draw and Teardown Round to Stress Ward testing and final demos."),
  component: () => (
    <PublicLayout>
      <ScheduleSection />
      <RegisterCTA />
    </PublicLayout>
  ),
});
