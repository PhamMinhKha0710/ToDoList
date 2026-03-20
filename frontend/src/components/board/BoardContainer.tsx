import type { ReactNode } from "react";

interface BoardContainerProps {
  children: ReactNode;
}

export const BoardContainer = ({ children }: BoardContainerProps) => {
  return (
    <div className="h-full w-full flex overflow-x-auto p-6 gap-6 items-start bg-secondary/10">
      {children}
    </div>
  );
};
