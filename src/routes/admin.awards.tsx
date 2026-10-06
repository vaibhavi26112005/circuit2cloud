import { createFileRoute } from "@tanstack/react-router";
import { ListEditor } from "@/components/admin/ListEditor";
import { useAwards } from "@/lib/event-data";

export const Route = createFileRoute("/admin/awards")({ component: Page });

function Page() {
  const { data, isLoading } = useAwards();
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">SPECIAL AWARDS</h1>
      <ListEditor table="special_awards" rows={data} loading={isLoading} queryKey={["awards"]}
        blank={{ title: "New award" }}
        cols={[{ k: "title", l: "Award" }, { k: "description", l: "Description" }, { k: "prize", l: "Prize (optional)", w: "w-48" }]} />
    </div>
  );
}
