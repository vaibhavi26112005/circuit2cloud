import { createFileRoute } from "@tanstack/react-router";
import { ListEditor } from "@/components/admin/ListEditor";
import { useCriteria } from "@/lib/event-data";

export const Route = createFileRoute("/admin/judging")({ component: Page });

function Page() {
  const { data, isLoading } = useCriteria();
  const total = (data ?? []).reduce((s, c) => s + c.points, 0);
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold">JUDGING CRITERIA</h1>
        <p className="font-display text-xl">Total: <span className="text-primary">{total}</span> points</p>
      </div>
      <ListEditor table="judging_criteria" rows={data} loading={isLoading} queryKey={["criteria"]}
        blank={{ title: "New criterion", points: 0 }}
        cols={[{ k: "title", l: "Criterion" }, { k: "points", l: "Points", type: "number", w: "w-24" }, { k: "description", l: "Description (optional)" }]} />
    </div>
  );
}
