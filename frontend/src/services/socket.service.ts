import { io, Socket } from 'socket.io-client';

import { useAuthStore } from '@/stores/auth.store';
import { useKanbanStore } from '@/stores/kanban.store';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

interface SocketService {
  socket: Socket | null;
  connect: () => void;
  disconnect: () => void;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
}

class SocketServiceImpl implements SocketService {
  socket: Socket | null = null;
  private queryClient: any;
  private kanbanStore: any;

  constructor() {
    // Delay hook calls until React context available
    setTimeout(() => {
      this.queryClient = (window as any).queryClient || useQueryClient();
      this.kanbanStore = useKanbanStore.getState();
    }, 0);
  }

  connect() {
    if (this.socket) return;

    const { user } = useAuthStore.getState();
    if (!user?._id) return;

    this.socket = io(SOCKET_URL, {
      auth: {
        token: localStorage.getItem('token'),
      },
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
      // Auto join user private room
      this.socket?.emit('join:user', user._id);
    });

    // Real-time handlers
    this.setupTaskListeners();
    this.setupColumnListeners();
  }


  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinProject(projectId: string) {
    this.socket?.emit('join:project', projectId);
  }

  leaveProject(projectId: string) {
    this.socket?.emit('leave:project', projectId);
  }

  private setupTaskListeners() {
    if (!this.socket) return;

    this.socket.on('task:moved', (moveData: any) => {
      console.log('[Socket] Task moved:', moveData);
      
      // Update Zustand store optimistically
      (useKanbanStore.getState() as any).handleTaskMoved(moveData);
      
      // Update React Query cache (simple invalidation - store handles order)
      const { sourceColumnId, destinationColumnId } = moveData;
      this.queryClient.invalidateQueries({ queryKey: ['tasks', sourceColumnId] });
      this.queryClient.invalidateQueries({ queryKey: ['tasks', destinationColumnId] });
    });
  }


  private setupColumnListeners() {
    if (!this.socket) return;

    this.socket.on('column:reordered', (columns: any[]) => {
      console.log('[Socket] Columns reordered:', columns);
      (useKanbanStore.getState() as any).handleColumnsReordered(columns);
      this.queryClient.invalidateQueries({ queryKey: ['columns'] });
    });
  }

}

export const connectSocket = (token?: string) => {
  if (token) localStorage.setItem('token', token);
  socketService.connect();
};

export const getSocket = () => socketService.socket;

export const disconnectSocket = () => {
  socketService.disconnect();
};

// Singleton instance
export const socketService = new SocketServiceImpl();



// React hook wrapper
export const useSocket = () => {
  const projectId = useKanbanStore((state) => state.activeProject?._id);

  useEffect(() => {
    socketService.connect();

    if (projectId) {
      socketService.joinProject(projectId);
    }

    return () => {
      if (projectId) {
        socketService.leaveProject(projectId);
      }
    };
  }, [projectId]);

  return socketService;
};

export default socketService;


