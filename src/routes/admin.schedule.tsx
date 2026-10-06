import { createFileRoute } from "@tanstack/react-router";
import { ListEditor } from "@/components/admin/ListEditor";
import { useSchedule } from "@/lib/event-data";

export const Route = createFileRoute("/admin/schedule")({ component: Page });

function Page() {
  const { data, isLoading } = useSchedule();
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">SCHEDULE MANAGER</h1>
      <ListEditor table="schedule_items" rows={data} loading={isLoading} queryKey={["schedule"]} groupBy="day"
        blank={{ time: "00:00", title: "New item" }}
        cols={[{ k: "day", l: "Day", type: "day" }, { k: "time", l: "Time", w: "w-24" }, { k: "title", l: "Title" }, { k: "description", l: "Description" }]} />
    </div>
  );
}
