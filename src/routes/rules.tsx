import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/SiteChrome";
import { PureHardware, RegisterCTA, RulesSection } from "@/components/site/Sections";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/rules")({
  head: () => seo("Rules — Circuit2Cloud Hardware Edition", "Rules at a glance and what counts as pure hardware at Circuit2Cloud: team size, on-site builds, 12V DC limit and safety."),
  component: () => (
    <PublicLayout>
      <RulesSection />
      <PureHardware />
      <RegisterCTA />
    </PublicLayout>
  ),
});
