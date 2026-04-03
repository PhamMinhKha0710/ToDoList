import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { QuickCreateTaskModal } from "./QuickCreateTaskModal";
import "./calendar.css";

const STATUS_COLORS = {
  todo: "#94a3b8", // slate-400
  in_progress: "#3b82f6", // blue-500
  done: "#10b981", // emerald-500
};

const CalendarView = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");

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
    .filter((task) => task.dueDate || task.startDate)
    .map((task) => ({
      id: task._id,
      title: task.isPersonal ? `[Cá nhân] ${task.title}` : task.title,
      start: task.startDate || task.dueDate,
      end: task.endDate,
      backgroundColor: task.isPersonal ? "#8b5cf6" : (STATUS_COLORS[task.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.todo),
      borderColor: "transparent",
      className: task.isPersonal ? "personal-task-event" : "project-task-event",
      extendedProps: {
        status: task.status,
        isPersonal: task.isPersonal,
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
        dateClick={(info) => {
          setSelectedDate(info.dateStr);
          setIsModalOpen(true);
        }}
        height="auto"
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

      <QuickCreateTaskModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialDate={selectedDate}
      />
    </div>
  );
};

export default CalendarView;
