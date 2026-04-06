import CalendarView from "../components/calendar/CalendarView"

const CalendarPage = () => {
  return (
    <div className="h-full w-full flex flex-col bg-background">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-foreground">Lịch biểu</h1>
        <p className="text-muted-foreground">Quản lý các công việc của bạn theo thời hạn</p>
      </div>
      <div className="flex-1 overflow-auto px-6 pb-6">
        <CalendarView />
      </div>
    </div>
  )
}

export default CalendarPage
