import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

import RoomLobby from "@/features/workout/components/RoomLobby";
import ActiveSession from "@/features/workout/components/ActiveSession";
import SessionSummary from "@/features/workout/components/SessionSummary";
import { useAuth } from "@/features/auth/context/AuthContext";
import Layout from "@/shared/layout/Layout";
import { roomSocket } from "@/features/workout/services/socket";
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
  const [usersInRoom, setUsersInRoom] = useState<RoomUser[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(initialIsHost);

  // Session State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);

  // Partner syncing state (progress updates)
  const [partnerProgress, setPartnerProgress] =
    useState<PartnerProgress | null>(null);
  const [partnerDisconnected, setPartnerDisconnected] = useState(false);

  // STRICT STATE SEPARATION: Local user finish state
  const [isLocalFinished, setIsLocalFinished] = useState(false);
  const [localStats, setLocalStats] = useState<{
    time: number;
    volume: number;
    exercises: number;
    completedSets: number;
    completionPercentage: number;
  } | null>(null);

  // STRICT STATE SEPARATION: Partner finish state
  const [isPartnerFinished, setIsPartnerFinished] = useState(false);
  const [partnerStats, setPartnerStats] = useState<{
    time: number;
    volume: number;
    exercises: number;
  } | null>(null);

  // Socket Effect
  useEffect(() => {
    if (!roomId || !user) return;

    setIsConnecting(true);

    const handleConnect = () => {
      setIsConnected(true);
      setIsConnecting(false);
      roomSocket.emit("joinRoom", {
        roomId,
        userId: user.id,
        username: user.username,
        isHost: initialIsHost,
      });
    };

    const handleJoinedRoom = (data: { isHost: boolean; usersInRoom: RoomUser[] }) => {
      setIsHost(data.isHost);
      setUsersInRoom(data.usersInRoom);
      if (data.usersInRoom.length >= 2) {
        setPartnerDisconnected(false);
      }
    };

    const handleRoomUsersUpdate = (data: { usersInRoom: RoomUser[] }) => {
      setUsersInRoom(data.usersInRoom);
      if (data.usersInRoom.length >= 2) {
        setPartnerDisconnected(false);
      }
    };

    const handleSessionStarting = (data: { routine: Routine }) => {
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
    };

    const handleOpponentProgressUpdate = (data: PartnerProgress) => {
      if (String(data.userId) !== String(user.id)) {
        setPartnerProgress({ ...data });
      }
    };

    const handlePartnerFinished = (payload: { userId: string; finalStats: any }) => {
      if (String(payload.userId) !== String(user.id)) {
        setPartnerStats(payload.finalStats);
        setIsPartnerFinished(true);
        if (!isHost && localStats && roomId && user?.id) {
          roomSocket.emit("sessionFinished", {
            roomId,
            userId: user.id,
            finalStats: localStats,
          });
        }
      }
    };

    const handleHostDisconnected = () => {
      if (!isHost) {
        roomSocket.disconnect();
        navigate("/friend-session");
      }
    };

    const handleGuestDisconnected = () => {
      if (isHost) {
        toast.info(t("virtualRoom.guestDisconnected"));
        setPartnerDisconnected(true);
      }
    };

    const handleConnectError = () => {
      setIsConnecting(false);
    };

    roomSocket.on("connect", handleConnect);
    roomSocket.on("joinedRoom", handleJoinedRoom);
    roomSocket.on("roomUsersUpdate", handleRoomUsersUpdate);
    roomSocket.on("sessionStarting", handleSessionStarting);
    roomSocket.on("opponentProgressUpdate", handleOpponentProgressUpdate);
    roomSocket.on("partnerFinished", handlePartnerFinished);
    roomSocket.on("hostDisconnected", handleHostDisconnected);
    roomSocket.on("guestDisconnected", handleGuestDisconnected);
    roomSocket.on("connect_error", handleConnectError);

    if (!roomSocket.connected) {
      roomSocket.connect();
    } else {
      handleConnect();
    }

    return () => {
      roomSocket.off("connect", handleConnect);
      roomSocket.off("joinedRoom", handleJoinedRoom);
      roomSocket.off("roomUsersUpdate", handleRoomUsersUpdate);
      roomSocket.off("sessionStarting", handleSessionStarting);
      roomSocket.off("opponentProgressUpdate", handleOpponentProgressUpdate);
      roomSocket.off("partnerFinished", handlePartnerFinished);
      roomSocket.off("hostDisconnected", handleHostDisconnected);
      roomSocket.off("guestDisconnected", handleGuestDisconnected);
      roomSocket.off("connect_error", handleConnectError);
    };
  }, [roomId, user]);

  const handleLeaveRoom = () => {
    roomSocket.disconnect();
    navigate("/friend-session");
  };

  const handleStartSession = (routine: Routine) => {
    if (!roomId) return;
    setSelectedRoutine(routine);
    roomSocket.emit("startSession", { roomId, routine });
  };

  const handleSessionFinished = (stats: {
    time: number;
    volume: number;
    exercises: number;
    completedSets: number;
    completionPercentage: number;
  }) => {
    setIsLocalFinished(true);
    setLocalStats(stats);
    setIsSessionActive(false);

    if (roomId && user?.id) {
      roomSocket.emit("sessionFinished", {
        roomId,
        userId: user.id,
        finalStats: stats,
      });
    }
  };

  // Derive partner username from room users
  const partnerUsername = usersInRoom.find(
    (u) => String(u.id) !== String(user?.id),
  )?.username;

  // Determine which content to render
  const renderContent = () => {
    if (isConnecting) {
      return (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
              {t("virtualRoom.connecting")}
            </p>
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
          partnerUsername={partnerUsername}
          onLeave={handleLeaveRoom}
          isSoloMode={false}
        />
      );
    }

    if (isCountingDown || isSessionActive) {
      return (
        <ActiveSession
          socket={roomSocket}
          roomId={roomId}
          userId={
            typeof user?.id === "string" ? user.id : String(user?.id || "")
          }
          isHost={isHost}
          selectedRoutine={selectedRoutine!}
          isCountingDown={isCountingDown}
          countdown={countdown}
          isSessionActive={isSessionActive}
          partnerProgress={partnerProgress}
          partnerDisconnected={partnerDisconnected}
          partnerUsername={partnerUsername}
          onSessionFinished={handleSessionFinished}
          onLeave={handleLeaveRoom}
        />
      );
    }

    return (
      <RoomLobby
        socket={roomSocket}
        roomId={roomId}
        isHost={isHost}
        isConnected={isConnected}
        usersInRoom={usersInRoom}
        onLeave={handleLeaveRoom}
        onStartSession={handleStartSession}
      />
    );
  };

  // Render within Layout (wraps with Sidebar and header)
  return (
    <Layout>
      <div className="w-full h-full flex flex-col">{renderContent()}</div>
    </Layout>
  );
}
