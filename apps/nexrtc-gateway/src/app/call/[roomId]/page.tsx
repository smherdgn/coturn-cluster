"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import type {
  OfferPayload,
  AnswerPayload,
  IceCandidatePayload,
  UserJoinedPayload,
  UserLeftPayload,
  CallEndedPayload,
  SocketOfferData,
  SocketAnswerData,
  SocketIceCandidateData,
  SocketWebRTCStateData,
} from "@/types";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  LogOut,
  Users,
  Copy,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { showToast } from "@/components/ui/Toaster";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

interface PeerConnectionValue {
  peerConnection: RTCPeerConnection;
  email?: string;
}

interface RemotePeer {
  id: string; // socketId
  email?: string;
  stream?: MediaStream;
  iceState?: RTCIceConnectionState;
  signalingState?: RTCSignalingState;
}

const getPeerIceConnectionStatusText = (
  iceState?: RTCIceConnectionState
): string => {
  if (!iceState) return "Initializing...";
  switch (iceState) {
    case "new":
      return "Initializing...";
    case "checking":
      return "Connecting...";
    case "connected":
      return "Connected";
    case "completed":
      return "Stream Active";
    case "disconnected":
      return "Disconnected";
    case "failed":
      return "Failed";
    case "closed":
      return "Closed";
    default:
      return iceState;
  }
};

const RemoteVideoElement = React.memo(({ peer }: { peer: RemotePeer }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  const statusText = getPeerIceConnectionStatusText(peer.iceState);
  let statusColorClass = "text-text-muted";
  if (peer.iceState === "connected" || peer.iceState === "completed")
    statusColorClass = "text-green-400";
  else if (
    peer.iceState === "failed" ||
    peer.iceState === "closed" ||
    peer.iceState === "disconnected"
  )
    statusColorClass = "text-danger";
  else if (peer.iceState === "checking") statusColorClass = "text-yellow-400";

  return (
    <div className="relative bg-input rounded-lg overflow-hidden shadow-lg border border-border aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
        <p className="font-medium">{peer.email || peer.id.substring(0, 6)}</p>
        <p className={statusColorClass}>{statusText}</p>
      </div>
    </div>
  );
});
RemoteVideoElement.displayName = "RemoteVideoElement";

export default function CallPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const roomId = (params?.roomId as string) || "";

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerConnectionValue>>(
    new Map()
  );
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const [isLocalAudioMuted, setIsLocalAudioMuted] = useState(false);
  const [isLocalVideoOff, setIsLocalVideoOff] = useState(false);

  const [remotePeersData, setRemotePeersData] = useState<
    Map<string, RemotePeer>
  >(new Map());
  const [signalingStatus, setSignalingStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("connecting");
  const [localMediaStatus, setLocalMediaStatus] = useState<
    "idle" | "loading" | "active" | "error"
  >("idle");

  const getLocalMediaStatusText = () => {
    switch (localMediaStatus) {
      case "idle":
        return "Initializing Media...";
      case "loading":
        return "Accessing Camera/Mic...";
      case "active":
        return `You (${user?.email || "Local"})`;
      case "error":
        return "Media Access Error!";
      default:
        return "";
    }
  };

  const createPeerConnection = useCallback(
    (remoteSocketId: string, remoteEmail?: string): RTCPeerConnection => {
      console.log(
        `Creating peer connection to ${remoteSocketId} (${
          remoteEmail || "email unknown"
        })`
      );
      if (peerConnectionsRef.current.has(remoteSocketId)) {
        console.log(`Peer connection to ${remoteSocketId} already exists.`);
        return peerConnectionsRef.current.get(remoteSocketId)!.peerConnection;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);

      setRemotePeersData((prev) => {
        const map = new Map(prev);
        const existingPeer = map.get(remoteSocketId);
        map.set(remoteSocketId, {
          id: remoteSocketId,
          email: remoteEmail || existingPeer?.email,
          stream: existingPeer?.stream,
          iceState: pc.iceConnectionState,
          signalingState: pc.signalingState,
        });
        return map;
      });

      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          // console.log(`Sending ICE candidate to ${remoteSocketId}:`, event.candidate);
          socketRef.current.emit("ice-candidate", {
            candidate: event.candidate.toJSON(),
            toUserId: remoteSocketId,
          } as SocketIceCandidateData);
        }
      };

      pc.ontrack = (event) => {
        console.log(`Track received from ${remoteSocketId}`, event.streams[0]);
        setRemotePeersData((prev) => {
          const newMap = new Map(prev);
          const peer = newMap.get(remoteSocketId);
          if (peer) {
            newMap.set(remoteSocketId, { ...peer, stream: event.streams[0] });
          } else {
            newMap.set(remoteSocketId, {
              id: remoteSocketId,
              email: remoteEmail,
              stream: event.streams[0],
              iceState: "new",
              signalingState: "stable",
            });
          }
          return newMap;
        });
      };

      pc.oniceconnectionstatechange = () => {
        console.log(
          `ICE connection state for ${
            remoteEmail || remoteSocketId
          } (${remoteSocketId}): ${pc.iceConnectionState}`
        );
        // Log to server
        if (socketRef.current) {
          socketRef.current.emit("webrtc-state-change", {
            peerSocketId: remoteSocketId,
            iceState: pc.iceConnectionState,
          } as SocketWebRTCStateData);
        }
        setRemotePeersData((prev) => {
          const newState = new Map(prev);
          const peerState = newState.get(remoteSocketId);
          if (peerState) {
            newState.set(remoteSocketId, {
              ...peerState,
              iceState: pc.iceConnectionState,
            });
          }
          return newState;
        });
        if (pc.iceConnectionState === "failed") {
          showToast(
            `Connection with ${remoteEmail || remoteSocketId} failed.`,
            "error"
          );
        } else if (pc.iceConnectionState === "disconnected") {
          showToast(
            `Disconnected from ${
              remoteEmail || remoteSocketId
            }. May attempt to reconnect.`,
            "info"
          );
        } else if (
          pc.iceConnectionState === "connected" ||
          pc.iceConnectionState === "completed"
        ) {
          showToast(
            `Connection established with ${remoteEmail || "user"}.`,
            "success"
          );
        }
      };

      pc.onsignalingstatechange = () => {
        console.log(
          `Signaling state for ${
            remoteEmail || remoteSocketId
          } (${remoteSocketId}): ${pc.signalingState}`
        );
        if (socketRef.current) {
          socketRef.current.emit("webrtc-state-change", {
            peerSocketId: remoteSocketId,
            signalingState: pc.signalingState,
          } as SocketWebRTCStateData);
        }
        setRemotePeersData((prev) => {
          const newState = new Map(prev);
          const peerState = newState.get(remoteSocketId);
          if (peerState) {
            newState.set(remoteSocketId, {
              ...peerState,
              signalingState: pc.signalingState,
            });
          }
          return newState;
        });
      };

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          try {
            pc.addTrack(track, localStreamRef.current!);
          } catch (e) {
            console.error(
              `Error adding track ${track.kind} for ${remoteSocketId}:`,
              e
            );
          }
        });
      } else {
        console.warn(
          `Local stream not available when creating PC for ${remoteSocketId}`
        );
      }

      peerConnectionsRef.current.set(remoteSocketId, {
        peerConnection: pc,
        email: remoteEmail,
      });
      return pc;
    },
    []
  );

  const closePeerConnection = useCallback((remoteSocketId: string) => {
    const pcValue = peerConnectionsRef.current.get(remoteSocketId);
    if (pcValue) {
      console.log(`Closing peer connection to ${remoteSocketId}`);
      pcValue.peerConnection.onicecandidate = null;
      pcValue.peerConnection.ontrack = null;
      pcValue.peerConnection.oniceconnectionstatechange = null;
      pcValue.peerConnection.onsignalingstatechange = null;
      pcValue.peerConnection.close();
      peerConnectionsRef.current.delete(remoteSocketId);
    }
    setRemotePeersData((prev) => {
      const newState = new Map(prev);
      const peerData = newState.get(remoteSocketId);
      if (peerData?.stream) {
        peerData.stream.getTracks().forEach((track) => track.stop());
      }
      newState.delete(remoteSocketId);
      return newState;
    });
  }, []);

  const initializeSocket = useCallback(() => {
    if (socketRef.current || !Cookies.get("accessToken")) {
      if (socketRef.current)
        console.log("Socket already initialized or initializing.");
      if (!Cookies.get("accessToken"))
        console.warn("No access token found, socket not initialized.");
      return;
    }

    console.log("Initializing socket connection...");
    setSignalingStatus("connecting");
    const newSocket = io({
      path: process.env.NEXT_PUBLIC_SOCKET_PATH || "/api/socketio",
      reconnectionAttempts: 3,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      setSignalingStatus("connected");
      showToast(`Connected to signaling server!`, "success");
      newSocket.emit("join-room", roomId);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setSignalingStatus("disconnected");
      showToast(`Disconnected from signaling: ${reason}`, "error");
      peerConnectionsRef.current.forEach((_, id) => closePeerConnection(id));
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      setSignalingStatus("error");
      if (err.message.includes("Authentication error")) {
        showToast(
          "WebSocket Authentication Failed. Redirecting to login.",
          "error"
        );
        logout();
      } else {
        showToast(`Signaling connection failed: ${err.message}.`, "error");
      }
    });

    newSocket.on("user-joined", async (data: UserJoinedPayload) => {
      if (data.userId === newSocket.id) return;
      console.log("User joined event:", data.userId, data.email);
      showToast(`${data.email || "A new user"} joined the room.`, "info");

      setRemotePeersData((prev) => {
        const map = new Map(prev);
        if (!map.has(data.userId)) {
          map.set(data.userId, {
            id: data.userId,
            email: data.email,
            iceState: "new",
            signalingState: "stable",
          });
        } else {
          const peer = map.get(data.userId)!;
          map.set(data.userId, { ...peer, email: data.email || peer.email });
        }
        return map;
      });

      const pc = createPeerConnection(data.userId, data.email);
      console.log(`Creating offer for ${data.userId}`);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        newSocket.emit("offer", {
          offer,
          toUserId: data.userId,
        } as SocketOfferData);
        console.log(`Offer sent to ${data.userId}`);
      } catch (error) {
        console.error(`Error creating offer for ${data.userId}:`, error);
        showToast(
          `Error starting call with ${data.email || "new user"}.`,
          "error"
        );
      }
    });

    newSocket.on("offer", async (data: OfferPayload) => {
      if (data.fromUserId === newSocket.id) return;
      console.log("Received offer from:", data.fromUserId);
      const remotePeerData =
        remotePeersData.get(data.fromUserId) ||
        (await (async () => {
          // IIFE to update state and get email
          let email: string | undefined;
          setRemotePeersData((prev) => {
            const map = new Map(prev);
            if (!map.has(data.fromUserId)) {
              // If user is not known, add them. This can happen if 'offer' arrives before 'user-joined' for some reason.
              // Or if user-joined event was missed.
              map.set(data.fromUserId, {
                id: data.fromUserId,
                email: undefined,
                iceState: "new",
                signalingState: "stable",
              });
            }
            email = map.get(data.fromUserId)?.email;
            return map;
          });
          return { email };
        })());
      const offeringPeerEmail = remotePeerData?.email;

      console.log("Offering peer email for incoming offer:", offeringPeerEmail);
      const pc = createPeerConnection(data.fromUserId, offeringPeerEmail);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        console.log(
          `Remote description (offer) set for ${data.fromUserId}. Creating answer.`
        );
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        newSocket.emit("answer", {
          answer,
          toUserId: data.fromUserId,
        } as SocketAnswerData);
        console.log(`Answer sent to ${data.fromUserId}`);
      } catch (error) {
        console.error(`Error handling offer from ${data.fromUserId}:`, error);
        showToast(
          `Error responding to call from ${offeringPeerEmail || "user"}.`,
          "error"
        );
      }
    });

    newSocket.on("answer", async (data: AnswerPayload) => {
      if (data.fromUserId === newSocket.id) return;
      console.log("Received answer from:", data.fromUserId);
      const pcValue = peerConnectionsRef.current.get(data.fromUserId);
      if (pcValue) {
        try {
          await pcValue.peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          console.log(
            `Remote description (answer) set for ${data.fromUserId}. Connection should establish.`
          );
        } catch (error) {
          console.error(
            `Error setting remote description (answer) from ${data.fromUserId}:`,
            error
          );
        }
      } else {
        console.warn(
          `Received answer from ${data.fromUserId}, but no peer connection found.`
        );
      }
    });

    newSocket.on("ice-candidate", async (data: IceCandidatePayload) => {
      if (data.fromUserId === newSocket.id) return;
      const pcValue = peerConnectionsRef.current.get(data.fromUserId);
      if (pcValue && data.candidate) {
        try {
          await pcValue.peerConnection.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        } catch (e) {
          console.error(
            "Error adding received ICE candidate for " + data.fromUserId,
            e
          );
        }
      }
    });

    newSocket.on("user-left", (data: UserLeftPayload) => {
      // Updated to expect UserLeftPayload
      console.log("User left event:", data.userId);
      const leavingUserEmail = remotePeersData.get(data.userId)?.email;
      showToast(`${leavingUserEmail || "A user"} left the room.`, "info");
      closePeerConnection(data.userId);
    });

    newSocket.on("call-ended", (data: CallEndedPayload) => {
      console.log("Call ended by event from:", data.fromUserId);
      const endingUserEmail = remotePeersData.get(data.fromUserId)?.email;
      showToast(`Call ended by ${endingUserEmail || "another user"}.`, "info");
      handleLeaveCall(false); // Don't emit end-call again
    });

    socketRef.current = newSocket;
  }, [
    roomId,
    logout,
    createPeerConnection,
    closePeerConnection,
    remotePeersData,
  ]); // Added remotePeersData

  const startLocalMedia = useCallback(async () => {
    console.log("Attempting to start local media...");
    setLocalMediaStatus("loading");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log("Local media stream obtained:", stream);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setLocalMediaStatus("active");
      setIsLocalAudioMuted(false);
      setIsLocalVideoOff(false);

      initializeSocket();
    } catch (error) {
      console.error("Error accessing media devices.", error);
      setLocalMediaStatus("error");
      showToast(
        "Failed to access camera/microphone. Please check permissions and reload.",
        "error"
      );
    }
  }, [initializeSocket]);

  useEffect(() => {
    if (authLoading || !user) {
      console.log("Auth loading or user not available. Waiting...");
      return;
    }
    if (!roomId) {
      console.log("No roomId, redirecting to room-entry.");
      router.push("/room-entry");
      return;
    }

    startLocalMedia();

    return () => {
      console.log("Cleaning up CallPage...");
      if (localStreamRef.current) {
        console.log("Stopping local media tracks.");
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      peerConnectionsRef.current.forEach((_pcValue, id) => {
        console.log(`Closing PC for ${id} during cleanup.`);
        closePeerConnection(id); // Use the cleanup function
      });
      peerConnectionsRef.current.clear();
      if (socketRef.current) {
        console.log("Disconnecting socket.");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setRemotePeersData(new Map());
      setSignalingStatus("disconnected");
      setLocalMediaStatus("idle");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user, authLoading, router, startLocalMedia, closePeerConnection]); // Added closePeerConnection

  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setIsLocalAudioMuted(!track.enabled);
        console.log(`Audio ${track.enabled ? "unmuted" : "muted"}`);
      });
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setIsLocalVideoOff(!track.enabled);
        console.log(`Video ${track.enabled ? "on" : "off"}`);
      });
    }
  };

  const handleLeaveCall = (emitEndCall = true) => {
    console.log("Leaving call initiated by user.");
    if (emitEndCall && socketRef.current && socketRef.current.connected) {
      peerConnectionsRef.current.forEach((_, remoteSocketId) => {
        // Notify each peer individually that this user is ending the call with them.
        // Or, the server could handle broadcasting a 'user-left' on disconnect.
        // For explicit "end call" behavior, this is fine.
        socketRef.current?.emit("end-call", { toUserId: remoteSocketId });
      });
    }
    // Cleanup is handled by useEffect return function when component unmounts
    router.push("/room-entry");
  };

  const copyRoomId = () => {
    navigator.clipboard
      .writeText(roomId)
      .then(() => showToast("Room ID copied to clipboard!", "success"))
      .catch((err) => {
        console.error("Failed to copy Room ID:", err);
        showToast("Failed to copy Room ID.", "error");
      });
  };

  const getSignalingStatusIcon = () => {
    switch (signalingStatus) {
      case "connected":
        return <CheckCircle size={16} className="text-green-500" />;
      case "connecting":
        return <Loader2 size={16} className="animate-spin text-yellow-500" />;
      case "disconnected":
        return <XCircle size={16} className="text-danger" />;
      case "error":
        return <AlertTriangle size={16} className="text-danger" />;
      default:
        return null;
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-text">Loading user...</p>
      </div>
    );
  }
  if (!user && !authLoading) {
    router.push("/login");
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-text">Redirecting to login...</p>
      </div>
    );
  }

  const localMediaOverlayText = getLocalMediaStatusText();

  return (
    <div className="flex flex-col h-screen bg-background text-text p-4 overflow-hidden">
      <header className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex-shrink-0">
          <h1 className="text-xl md:text-2xl font-bold text-primary-text flex items-center">
            Room: <span className="text-secondary ml-2">{roomId}</span>
            <button
              onClick={copyRoomId}
              title="Copy Room ID"
              className="ml-2 p-1 text-text-muted hover:text-primary-text transition-colors"
            >
              <Copy size={18} />
            </button>
          </h1>
          <div className="text-xs md:text-sm text-text-muted flex items-center gap-1 mt-1">
            {getSignalingStatusIcon()}
            Signaling: {signalingStatus}
          </div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <span className="text-sm text-text-muted flex items-center">
            <Users size={16} className="mr-1" />{" "}
            {Array.from(remotePeersData.keys()).length + 1} participant(s)
          </span>
          <button
            onClick={() => logout()}
            className="flex items-center py-2 px-3 border border-border rounded-md shadow-sm text-sm font-medium text-primary-text bg-card hover:bg-input focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-hover transition-colors duration-150"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-grow grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto p-1 min-h-0">
        <div className="relative bg-input rounded-lg overflow-hidden shadow-lg border-2 border-primary aspect-video">
          {localMediaStatus === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={48} className="animate-spin text-primary" />
            </div>
          )}
          {localMediaStatus === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-danger p-4">
              <AlertTriangle size={48} />
              <p className="mt-2 text-center">
                Camera/Mic Error. Check permissions and reload.
              </p>
            </div>
          )}
          <video
            ref={localVideoRef}
            muted
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${
              localMediaStatus !== "active" ? "opacity-50" : ""
            }`}
          />
          {localMediaStatus === "active" && (
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
              <p className="font-medium">{localMediaOverlayText}</p>
              <div className="flex items-center gap-1">
                {isLocalAudioMuted ? (
                  <MicOff size={12} className="text-red-400" />
                ) : (
                  <Mic size={12} className="text-green-400" />
                )}
                <span>{isLocalAudioMuted ? "Muted" : "Mic On"}</span>
                <span className="mx-1">|</span>
                {isLocalVideoOff ? (
                  <VideoOff size={12} className="text-red-400" />
                ) : (
                  <Video size={12} className="text-green-400" />
                )}
                <span>{isLocalVideoOff ? "Cam Off" : "Cam On"}</span>
              </div>
            </div>
          )}
        </div>

        {Array.from(remotePeersData.values()).map((peer) => (
          <RemoteVideoElement key={peer.id} peer={peer} />
        ))}
      </main>

      <footer className="mt-4 py-3 bg-card border-t border-border rounded-t-lg">
        <div className="max-w-md mx-auto flex justify-center items-center space-x-3 sm:space-x-4">
          <button
            onClick={toggleAudio}
            disabled={localMediaStatus !== "active"}
            className={`p-3 rounded-full transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
              isLocalAudioMuted
                ? "bg-yellow-600 hover:bg-yellow-500 text-white"
                : "bg-gray-600 hover:bg-gray-500 text-primary-text"
            }`}
            title={isLocalAudioMuted ? "Unmute Audio" : "Mute Audio"}
            aria-label={isLocalAudioMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {isLocalAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button
            onClick={toggleVideo}
            disabled={localMediaStatus !== "active"}
            className={`p-3 rounded-full transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
              isLocalVideoOff
                ? "bg-yellow-600 hover:bg-yellow-500 text-white"
                : "bg-gray-600 hover:bg-gray-500 text-primary-text"
            }`}
            title={isLocalVideoOff ? "Turn Video On" : "Turn Video Off"}
            aria-label={isLocalVideoOff ? "Turn Video On" : "Turn Video Off"}
          >
            {isLocalVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
          <button
            onClick={() => handleLeaveCall()}
            className="p-3 bg-danger hover:bg-red-700 text-white rounded-full transition-colors duration-150"
            title="Leave Call"
            aria-label="Leave Call"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
}

const Cookies = {
  get: (name: string): string | undefined => {
    if (typeof document === "undefined") return undefined;
    const match = document.cookie.match(
      new RegExp("(^| )" + name + "=([^;]+)")
    );
    if (match) return match[2];
    return undefined;
  },
};
