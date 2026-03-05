import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

import RoomLobby from "@/features/workout/components/RoomLobby";
import ActiveSession from "@/features/workout/components/ActiveSession";
import SessionSummary from "@/features/workout/components/SessionSummary";
import { useAuth } from "@/features/auth/context/AuthContext";
import Layout from "@/shared/layout/Layout";
import io, { Socket } from "socket.io-client";
import { useToast } from "@/shared/hooks/useToast";
import { useTranslation } from "react-i18next";
import type { Routine } from "@/features/routines/services/routineService";

interface RoomUser {
  id: string;
  username: string;
  isHost?: boolean;
}

interface PartnerProgress {
  userId: string;
  progressPercentage: number;
  completedExercises: number[];
  currentExerciseIndex?: number;
  currentSet?: number;
  exerciseName?: string;
  totalSets?: number;
}

export default function VirtualGymRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const initialIsHost = location.state?.isHost || false;
  const { user } = useAuth();
  const { t } = useTranslation();
  const toast = useToast();

  // Socket & Connection
  const [socket, setSocket] = useState<Socket | null>(null);
  const [usersInRoom, setUsersInRoom] = useState<RoomUser[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(initialIsHost);
  const [maxUsers, setMaxUsers] = useState(2);

  // Session State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);

  // Partner syncing state (progress updates)
  const [partnerProgress, setPartnerProgress] = useState<PartnerProgress | null>(null);
  const [partnerDisconnected, setPartnerDisconnected] = useState(false);
  const [allUserProgress, setAllUserProgress] = useState<Map<string, PartnerProgress>>(new Map());

  // STRICT STATE SEPARATION: Local user finish state
  const [isLocalFinished, setIsLocalFinished] = useState(false);
  const [localStats, setLocalStats] = useState<{ time: number; volume: number; exercises: number } | null>(null);

  // STRICT STATE SEPARATION: Partner finish state
  const [isPartnerFinished, setIsPartnerFinished] = useState(false);
  const [partnerStats, setPartnerStats] = useState<{ time: number; volume: number; exercises: number } | null>(null);
  const [finishedUsers, setFinishedUsers] = useState<Map<string, { username: string; stats: { time: number; volume: number; exercises: number } }>>(new Map());
  const [localExerciseLog, setLocalExerciseLog] = useState<Array<{ name: string; sets: { reps: number; weight: number }[] }>>([]);


  // Socket Effect
  useEffect(() => {
    if (!roomId || !user) return;

    const apiUrl = import.meta.env.VITE_BACK_URL || 'http://localhost:3000';
    const newSocket = io(`${apiUrl}/room`, {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      auth: { token: localStorage.getItem("token") },
      query: { roomId },
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      setIsConnecting(false);
      console.log('Intentando unirse a la sala:', roomId);
      newSocket.emit("joinRoom", { roomId, userId: user.id, username: user.username, isHost: initialIsHost });
    });

    newSocket.on("joinedRoom", (data: { isHost: boolean, usersInRoom: RoomUser[], maxUsers: number }) => {
      setIsHost(data.isHost);
      setUsersInRoom(data.usersInRoom);
      setMaxUsers(data.maxUsers);
      // Reset disconnection state if someone joins
      if (data.usersInRoom.length >= 2) {
        setPartnerDisconnected(false);
      }
    });

    newSocket.on("roomUsersUpdate", (data: { usersInRoom: RoomUser[] }) => {
      console.log('Lista de usuarios recibida por socket:', data.usersInRoom);
      setUsersInRoom(data.usersInRoom);
      if (data.usersInRoom.length >= 2) {
        setPartnerDisconnected(false);
      }
    });

    // Sincronización de inicio de sesión
    newSocket.on("sessionStarting", (data: { routine: Routine }) => {
      setSelectedRoutine(data.routine);
      setIsCountingDown(true);

      let count = 3;
      setCountdown(count);
      const interval = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(interval);
          setIsCountingDown(false);
          setIsSessionActive(true);
        } else {
          setCountdown(count);
        }
      }, 1000);
    });

    newSocket.on("opponentProgressUpdate", (data: PartnerProgress) => {
      if (String(data.userId) !== String(user.id)) {
        setPartnerProgress({ ...data });
        setAllUserProgress(prev => new Map(prev.set(data.userId, { ...data })));
      }
    });

    // Partner finished event: Silent background update if local user hasn't finished yet
    newSocket.on('partnerFinished', (payload: { userId: string; finalStats: any }) => {
      if (String(payload.userId) !== String(user.id)) {
        // Always save partner stats
        setPartnerStats(payload.finalStats);
        setIsPartnerFinished(true);
        // Add to finished users
        const partnerUser = usersInRoom.find(u => String(u.id) === String(payload.userId));
        if (partnerUser) {
          setFinishedUsers(prev => new Map(prev.set(String(payload.userId), { username: partnerUser.username, stats: payload.finalStats })));
        }
        // NOTE: Do NOT show summary screen if isLocalFinished is false
        // The component will display waiting message instead
      }
    });

    newSocket.on('hostDisconnected', () => {
      if (!isHost) {
        newSocket.disconnect();
        navigate('/clients/invitations');
      }
    });

    newSocket.on('guestDisconnected', (data: { userId: string; username?: string }) => {
      if (isHost) {
        toast.info(t('virtualRoom.notifications.userDisconnected', { user: data.username || '...' }));
        setPartnerDisconnected(true);
      }
    });

    newSocket.on('hostDisconnected', (data: { userId: string; username?: string }) => {
      if (!isHost) {
        toast.error(t('virtualRoom.notifications.userDisconnected', { user: data.username || 'Host' }));
        newSocket.disconnect();
        navigate('/clients/invitations');
      }
    });

    newSocket.on('userJoined', (data: { userId: string; username?: string; isHost?: boolean }) => {
      toast.success(t('virtualRoom.notifications.userJoined', { user: data.username || '...' }));
    });

    newSocket.on('userLeft', (data: { userId: string; username?: string; wasHost?: boolean }) => {
      toast.warn(t('virtualRoom.notifications.userDisconnected', { user: data.username || '...' }));
    });

    newSocket.on('userFinished', (data: { userId: string; username?: string; finalStats: any }) => {
      toast.success(t('virtualRoom.notifications.userFinished', { user: data.username || '...' }));
    });

    newSocket.on('roomProgressUpdate', (data: { allProgress: PartnerProgress[] }) => {
      // update map with all entries
      setAllUserProgress((prev) => {
        const m = new Map(prev);
        data.allProgress.forEach((p) => m.set(p.userId, { ...p }));
        return m;
      });
    });

    newSocket.on('joinError', (data: { reason: string }) => {
      let message = '';
      if (data.reason === 'room_full') {
        message = t('virtualRoom.errors.roomFull', 'La sala està plena');
      } else if (data.reason === 'session_started') {
        message = t('virtualRoom.errors.sessionStarted', 'La sessió ja ha començat');
      }
      toast.error(message);
      newSocket.disconnect();
      navigate('/clients/invitations');
    });

    newSocket.on('roomSettingsUpdate', (data: { maxUsers: number }) => {
      setMaxUsers(data.maxUsers);
    });

    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  }, [roomId, user]);




  const handleLeaveRoom = () => {
    socket?.disconnect();
    navigate("/client-home");
  };

  const handleStartSession = (routine: Routine) => {
    if (!socket || !roomId) return;
    setSelectedRoutine(routine);
    socket.emit('startSession', { roomId, routine });
  };

  const handleSetMaxUsers = (newMaxUsers: number) => {
    if (socket && roomId) {
      socket.emit('setMaxUsers', { roomId, maxUsers: newMaxUsers });
    }
  };

  const handleSessionFinished = (
    stats: { time: number; volume: number; exercises: number },
    log: Array<{ name: string; sets: { reps: number; weight: number }[] }>
  ) => {
    // STRICT: Mark this user as locally finished and save their stats
    setIsLocalFinished(true);
    setLocalStats(stats);
    setLocalExerciseLog(log);
    setIsSessionActive(false);
    // Add to finished users
    if (user) {
      setFinishedUsers(prev => new Map(prev.set(String(user.id), { username: user.username, stats })));
    }

    // Emit to socket so partner knows this user finished
    if (socket && roomId && user?.id) {
      socket.emit('sessionFinished', { roomId, userId: user.id, finalStats: stats });
    }
  };

  // Determine which content to render
  const renderContent = () => {
    if (isConnecting) {
      return (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Connectant a la sala...</p>
          </div>
        </div>
      );
    }

    // STRICT: Only show SessionSummary if LOCAL user has finished
    if (isLocalFinished) {
      return (
        <SessionSummary
          localStats={localStats}
          partnerStats={partnerStats}
          isPartnerFinished={isPartnerFinished}
          finishedUsers={finishedUsers}
          exerciseLog={localExerciseLog}
          socket={socket}
          onLeave={handleLeaveRoom}
        />
      );
    }

    if (isCountingDown || isSessionActive) {
      return (
        <ActiveSession
          socket={socket}
          roomId={roomId}
          userId={typeof user?.id === "string" ? user.id : String(user?.id || "")}
          isHost={isHost}
          selectedRoutine={selectedRoutine!}
          isCountingDown={isCountingDown}
          countdown={countdown}
          isSessionActive={isSessionActive}
          partnerProgress={partnerProgress}
          partnerDisconnected={partnerDisconnected}
          usersInRoom={usersInRoom}
          allUserProgress={allUserProgress}
          onSessionFinished={handleSessionFinished}
          onLeave={handleLeaveRoom}
        />
      );
    }

    return (
      <RoomLobby
        socket={socket}
        roomId={roomId}
        isHost={isHost}
        isConnected={isConnected}
        usersInRoom={usersInRoom}
        maxUsers={maxUsers}
        onSetMaxUsers={handleSetMaxUsers}
        onLeave={handleLeaveRoom}
        onStartSession={handleStartSession}
      />
    );
  };

  // Render within Layout (wraps with Sidebar and header)
  return (
    <Layout>
      <div className="w-full h-full flex flex-col bg-gradient-to-b from-zinc-950 via-zinc-950 to-black">
        {renderContent()}
      </div>
    </Layout>
  );
}
