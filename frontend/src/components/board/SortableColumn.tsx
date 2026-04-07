import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Column } from "@/types/column";
import { ColumnHeader } from "./ColumnHeader";
import { ColumnList } from "./ColumnList";

interface SortableColumnProps {
  column: Column;
}

/**
 * Wrapper sortable cho mỗi cột — dùng kéo thả để thay đổi vị trí cột.
 * Loại dữ liệu là 'column' để phân biệt với 'task' khi xử lý sự kiện kéo thả.
 */
export const SortableColumn = ({ column }: SortableColumnProps) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column._id,
    data: { type: "column", column },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-[300px] shrink-0 bg-background/50 rounded-xl flex flex-col overflow-hidden shadow-sm transition-all
        ${isDragging ? "opacity-30 grayscale-[0.5] border-2 border-dashed border-primary/30" : "border border-transparent"}
      `}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-default"
      >
        <ColumnHeader column={column} />
      </div>

      <div className="p-3 pt-0 flex flex-col gap-3 flex-1 h-full">
        <ColumnList columnId={column._id} />
      </div>
    </div>
  );
};
