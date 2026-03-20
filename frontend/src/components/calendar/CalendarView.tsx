import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { Loader2 } from "lucide-react";
import "./calendar.css";

const STATUS_COLORS = {
  todo: "#94a3b8", // slate-400
  in_progress: "#3b82f6", // blue-500
  done: "#10b981", // emerald-500
};

const CalendarView = () => {
  const navigate = useNavigate();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["all-tasks"],
    queryFn: () => taskService.getAllTasks(),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const events = (tasks || [])
    .filter((task) => task.dueDate)
    .map((task) => ({
      id: task._id,
      title: task.title,
      start: task.dueDate,
      backgroundColor: STATUS_COLORS[task.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.todo,
      borderColor: "transparent",
      extendedProps: {
        status: task.status,
      },
    }));

  return (
    <div className="calendar-container h-full">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={(info) => {
          navigate(ROUTES.TASK_DETAIL(info.event.id));
        }}
        height="100%"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,dayGridWeek",
        }}
        eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
            hour12: false
        }}
        dayMaxEvents={true}
      />
    </div>
  );
};

export default CalendarView;
