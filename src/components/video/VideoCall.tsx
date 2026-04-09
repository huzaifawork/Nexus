import React, { useState, useEffect, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

interface VideoCallProps {
  meetingId: string;
  onCallEnd: () => void;
}

interface RemoteUser {
  uid: string | number;
  videoTrack?: any;
  audioTrack?: any;
  userName?: string;
}

// Main component
const VideoCall: React.FC<VideoCallProps> = ({ meetingId, onCallEnd }) => {
  const { user } = useAuth();
  const clientRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteUsersRef = useRef<Map<string | number, RemoteUser>>(new Map());
  const isJoiningRef = useRef(false);

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  const [joinState, setJoinState] = useState(false);

  useEffect(() => {
    const initAgora = async () => {
      // Prevent multiple join attempts
      if (isJoiningRef.current) return;
      isJoiningRef.current = true;

      try {
        setLoading(true);

        // Create Agora client
        clientRef.current = AgoraRTC.createClient({
          codec: "vp8",
          mode: "rtc",
        });

        // Get token from backend
        const tokenResponse = await fetch(
          "http://localhost:5000/api/video-call/token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${
                localStorage.getItem("business_nexus_user")
                  ? JSON.parse(
                      localStorage.getItem("business_nexus_user") || "{}",
                    ).token
                  : ""
              }`,
            },
            body: JSON.stringify({ meetingId }),
          },
        );

        if (!tokenResponse.ok) {
          throw new Error("Failed to get token from backend");
        }

        const { channelName, appId, token } = await tokenResponse.json();

        const client = clientRef.current;

        // Set up Agora event listeners
        client.on("user-published", async (remoteUser, mediaType) => {
          await client.subscribe(remoteUser, mediaType);

          // Initialize with UID, then fetch actual name
          const uid = remoteUser.uid;
          let userName = uid?.toString() || "Unknown";

          // Add or update remote user with UID first
          remoteUsersRef.current.set(uid, {
            uid: uid,
            videoTrack: remoteUser.videoTrack,
            audioTrack: remoteUser.audioTrack,
            userName: userName,
          });

          setRemoteUsers(Array.from(remoteUsersRef.current.values()));

          // Fetch user name from backend in the background
          try {
            const token = localStorage.getItem("business_nexus_user")
              ? JSON.parse(localStorage.getItem("business_nexus_user") || "{}")
                  .token
              : null;

            if (token) {
              const response = await fetch(
                `http://localhost:5000/api/users/${uid}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              );

              if (response.ok) {
                const userData = await response.json();
                // Backend returns user object directly, not wrapped
                userName = userData?.name || userData?.email || uid;

                // Update with actual name
                const user = remoteUsersRef.current.get(uid);
                if (user) {
                  user.userName = userName;
                  setRemoteUsers(Array.from(remoteUsersRef.current.values()));
                }
              }
            }
          } catch (error) {
            console.error("Error fetching user name:", error);
          }

          // Play remote video if exists
          if (mediaType === "video" && remoteUser.videoTrack) {
            const videoElement = document.getElementById(
              `remote-${uid}`,
            ) as HTMLMediaElement;
            if (videoElement) {
              remoteUser.videoTrack.play(videoElement);
            }
          }

          // Play remote audio if exists
          if (mediaType === "audio" && remoteUser.audioTrack) {
            remoteUser.audioTrack.play();
          }
        });

        client.on("user-unpublished", (remoteUser, mediaType) => {
          if (mediaType === "video" && remoteUser.videoTrack) {
            remoteUser.videoTrack.stop();
          }
          if (mediaType === "audio" && remoteUser.audioTrack) {
            remoteUser.audioTrack.stop();
          }
        });

        client.on("user-left", (remoteUser) => {
          remoteUsersRef.current.delete(remoteUser.uid);
          setRemoteUsers(Array.from(remoteUsersRef.current.values()));
        });

        // Join the channel with token
        await client.join(appId, channelName, token, user?._id || null);

        // Create and publish local audio
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        // Create and publish local video
        const videoTrack = await AgoraRTC.createCameraVideoTrack();

        // Store tracks in refs for later cleanup
        (clientRef as any).current.audioTrack = audioTrack;
        (clientRef as any).current.videoTrack = videoTrack;

        // Publish local tracks
        await client.publish([audioTrack, videoTrack]);

        // Play local video
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }

        setJoinState(true);
        toast.success("Joined video call");
      } catch (error: any) {
        console.error("Failed to join call:", error);
        toast.error(`Failed to join call: ${error.message}`);
        setLoading(false);
        isJoiningRef.current = false;
      }
    };

    initAgora();

    return () => {
      // Cleanup when component unmounts or dependencies change
      const cleanup = async () => {
        try {
          const audioTrack = (clientRef.current as any)?.audioTrack;
          const videoTrack = (clientRef.current as any)?.videoTrack;

          if (audioTrack) {
            audioTrack.stop();
            audioTrack.close();
          }
          if (videoTrack) {
            videoTrack.stop();
            videoTrack.close();
          }
          if (clientRef.current) {
            await clientRef.current.leave();
          }
          isJoiningRef.current = false;
        } catch (error) {
          console.error("Error in cleanup:", error);
        }
      };

      cleanup();
    };
  }, []);

  useEffect(() => {
    setLoading(false);
  }, [joinState]);

  const toggleAudio = async () => {
    try {
      const audioTrack = (clientRef.current as any)?.audioTrack;
      if (audioTrack) {
        await audioTrack.setEnabled(!audioEnabled);
        setAudioEnabled(!audioEnabled);
      }
    } catch (error) {
      console.error("Error toggling audio:", error);
      toast.error("Failed to toggle audio");
    }
  };

  const toggleVideo = async () => {
    try {
      const videoTrack = (clientRef.current as any)?.videoTrack;
      if (videoTrack) {
        await videoTrack.setEnabled(!videoEnabled);
        setVideoEnabled(!videoEnabled);
      }
    } catch (error) {
      console.error("Error toggling video:", error);
      toast.error("Failed to toggle video");
    }
  };

  const leaveCall = async () => {
    try {
      // Stop and close all remote user tracks
      remoteUsersRef.current.forEach((user) => {
        if (user.videoTrack) {
          user.videoTrack.stop();
          user.videoTrack.close();
        }
        if (user.audioTrack) {
          user.audioTrack.stop();
          user.audioTrack.close();
        }
      });
      remoteUsersRef.current.clear();

      // Stop and close local tracks
      const audioTrack = (clientRef.current as any)?.audioTrack;
      const videoTrack = (clientRef.current as any)?.videoTrack;

      if (audioTrack) {
        audioTrack.stop();
        audioTrack.close();
      }
      if (videoTrack) {
        videoTrack.stop();
        videoTrack.close();
      }

      // Leave channel
      if (clientRef.current) {
        await clientRef.current.leave();
      }

      toast.success("Left the call");
    } catch (error) {
      console.error("Error leaving call:", error);
      toast.error("Error leaving call");
    } finally {
      // Always call onCallEnd
      onCallEnd();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4 overflow-auto">
        {/* Local User Video */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden">
          <div
            ref={localVideoRef}
            className="w-full h-full bg-gray-900"
            style={{ minHeight: "300px" }}
          />
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded">
            <span className="text-white text-sm">You</span>
          </div>
          {!videoEnabled && (
            <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
              <div className="text-center">
                <VideoOff size={48} className="text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400">Camera off</p>
              </div>
            </div>
          )}
        </div>

        {/* Remote Users */}
        {remoteUsers.map((remoteUser) => (
          <div
            key={remoteUser.uid}
            className="relative bg-gray-800 rounded-lg overflow-hidden"
          >
            <div
              id={`remote-${remoteUser.uid}`}
              className="w-full h-full bg-gray-900"
              style={{ minHeight: "300px" }}
            />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded">
              <span className="text-white text-sm">
                {remoteUser.userName || `Participant ${remoteUser.uid}`}
              </span>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {remoteUsers.length === 0 && (
          <div className="relative bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center col-span-1 md:col-span-2 lg:col-span-3">
            <div className="text-center">
              <div className="animate-pulse">
                <Video size={48} className="text-gray-500 mx-auto mb-4" />
              </div>
              <p className="text-gray-400">Waiting for others to join...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-6 flex justify-center items-center space-x-4">
        <Button
          variant={audioEnabled ? "outline" : "error"}
          size="lg"
          onClick={toggleAudio}
          className="rounded-full w-14 h-14"
        >
          {audioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
        </Button>

        <Button
          variant={videoEnabled ? "outline" : "error"}
          size="lg"
          onClick={toggleVideo}
          className="rounded-full w-14 h-14"
        >
          {videoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
        </Button>

        <Button
          variant="error"
          size="lg"
          onClick={leaveCall}
          className="rounded-full w-14 h-14"
        >
          <PhoneOff size={24} />
        </Button>
      </div>

      {/* Participant count */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 px-4 py-2 rounded">
        <p className="text-white text-sm">
          {remoteUsers.length === 0
            ? "Waiting for participants..."
            : `${remoteUsers.length + 1} in call`}
        </p>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-gray-900/80 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin">
              <Video size={48} className="text-blue-500 mx-auto mb-4" />
            </div>
            <p className="text-white">Connecting to call...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export { VideoCall };
