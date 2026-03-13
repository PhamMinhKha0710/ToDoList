interface ColumnListProps {
  columnId: string;
}

export const ColumnList = ({ columnId }: ColumnListProps) => {
  return (
    <div data-column-id={columnId} className="flex-1 min-h-[100px] bg-background/50 rounded-lg p-2 flex flex-col items-center justify-center text-sm text-muted-foreground border border-dashed">
      {/* TODO: Render actual tasks here, implement drag and drop later */}
      <span>Chưa có thẻ công việc nào</span>
    </div>
  );
};
