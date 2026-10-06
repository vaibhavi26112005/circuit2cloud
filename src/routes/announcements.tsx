import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout, SectionHeading } from "@/components/site/SiteChrome";
import { AnnouncementsList } from "@/components/site/Sections";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/announcements")({
  head: () => seo("Announcements — Circuit2Cloud Hardware Edition", "Live updates from the Circuit2Cloud organisers: deadlines, venue news and rule updates."),
  component: () => (
    <PublicLayout>
      <section className="mx-auto max-w-4xl px-4 py-20">
        <SectionHeading eyebrow="// Live feed" title="ANNOUNCEMENTS" sub="Updates appear here the moment organisers publish them." />
        <AnnouncementsList />
      </section>
    </PublicLayout>
  ),
});
