import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/SiteChrome";
import { AwardsSection, JudgingSection, RegisterCTA } from "@/components/site/Sections";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/judging")({
  head: () => seo("Judging & Awards — Circuit2Cloud Hardware Edition", "How teams are judged out of 100 points at Circuit2Cloud, plus the special awards for frugal, resilient and crowd-favourite builds."),
  component: () => (
    <PublicLayout>
      <JudgingSection />
      <AwardsSection />
      <RegisterCTA />
    </PublicLayout>
  ),
});
