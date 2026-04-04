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
    .map((task) => {
      const start = task.startDate || task.dueDate;
      let end = task.endDate || task.dueDate;

      let isMultiDay = false;
      if (start && end) {
        const s = new Date(start);
        const e = new Date(end);
        // Kiểm tra nếu cách nhau qua đêm (khác ngày)
        if (s.toDateString() !== e.toDateString()) {
          isMultiDay = true;
        }
      }

      const timeStr = start ? new Date(start).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) : "";
      const displayTitle = isMultiDay ? `${timeStr} ${task.title}` : task.title;

      // FullCalendar allDay end là exclusive, nên nếu multi-day ta +1 ngày để hiển thị đúng ô ngày kết thúc
      let finalEnd = end;
      if (isMultiDay && end) {
        const endDateObj = new Date(end);
        endDateObj.setDate(endDateObj.getDate() + 1);
        finalEnd = endDateObj.toISOString();
      }

      return {
        id: task._id,
        title: task.isPersonal ? `[Cá nhân] ${displayTitle}` : displayTitle,
        start: start,
        end: finalEnd,
        backgroundColor: task.color || (task.isPersonal ? "#8b5cf6" : (STATUS_COLORS[task.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.todo)),
        borderColor: "transparent",
        className: task.isPersonal ? "personal-task-event" : "project-task-event",
        allDay: isMultiDay,
        extendedProps: {
          status: task.status,
          isPersonal: task.isPersonal,
        },
      };
    });

  return (
    <div className="calendar-container h-full">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventDisplay="block"
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
        displayEventTime={true}
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
