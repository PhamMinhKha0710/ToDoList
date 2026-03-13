import type { ReactNode } from 'react';

interface BoardContainerProps {
  children: ReactNode;
}

export const BoardContainer = ({ children }: BoardContainerProps) => {
  return (
    <div className="h-full w-full flex overflow-x-auto p-4 gap-6 items-start">
      {children}
    </div>
  );
};
