import React, { useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';

interface VideoCallProps {
  meetingId: string;
  onCallEnd: () => void;
}

export const VideoCall: React.FC<VideoCallProps> = ({ meetingId, onCallEnd }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [peers, setPeers] = useState<Map<string, Peer.Instance>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<Map<string, Peer.Instance>>(new Map());

  useEffect(() => {
    initializeCall();
    return () => {
      leaveCall();
    };
  }, []);

  const initializeCall = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      setStream(mediaStream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }

      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      newSocket.emit('join-call', {
        roomId: meetingId,
        userId: user?._id,
        userName: user?.name,
      });

      newSocket.on('all-users', (users: string[]) => {
        users.forEach((userId) => {
          createPeer(userId, newSocket, mediaStream);
        });
      });

      newSocket.on('user-joined', ({ userId, signal }: { userId: string; signal: any }) => {
        addPeer(signal, userId, mediaStream);
      });

      newSocket.on('receiving-signal', ({ signal, callerId }: { signal: any; callerId: string }) => {
        const peer = peersRef.current.get(callerId);
        if (peer) {
          peer.signal(signal);
        }
      });

      newSocket.on('user-left', ({ userId }: { userId: string }) => {
        const peer = peersRef.current.get(userId);
        if (peer) {
          peer.destroy();
          peersRef.current.delete(userId);
          setPeers(new Map(peersRef.current));
          setRemoteStreams((prev) => {
            const newMap = new Map(prev);
            newMap.delete(userId);
            return newMap;
          });
        }
      });

      toast.success('Joined video call');
    } catch (error: any) {
      console.error('Failed to join call:', error);
      toast.error('Failed to access camera/microphone');
    }
  };

  const createPeer = (userToSignal: string, socket: Socket, stream: MediaStream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socket.emit('sending-signal', { userToSignal, callerId: user?._id, signal });
    });

    peer.on('stream', (remoteStream) => {
      setRemoteStreams((prev) => new Map(prev.set(userToSignal, remoteStream)));
    });

    peersRef.current.set(userToSignal, peer);
    setPeers(new Map(peersRef.current));

    return peer;
  };

  const addPeer = (incomingSignal: any, callerId: string, stream: MediaStream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socket?.emit('returning-signal', { signal, callerId });
    });

    peer.on('stream', (remoteStream) => {
      setRemoteStreams((prev) => new Map(prev.set(callerId, remoteStream)));
    });

    peer.signal(incomingSignal);

    peersRef.current.set(callerId, peer);
    setPeers(new Map(peersRef.current));

    return peer;
  };

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);
      
      socket?.emit('toggle-audio', {
        roomId: meetingId,
        userId: user?._id,
        audioEnabled: !audioEnabled,
      });
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
      
      socket?.emit('toggle-video', {
        roomId: meetingId,
        userId: user?._id,
        videoEnabled: !videoEnabled,
      });
    }
  };

  const leaveCall = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    peersRef.current.forEach((peer) => peer.destroy());
    peersRef.current.clear();

    if (socket) {
      socket.emit('leave-call', {
        roomId: meetingId,
        userId: user?._id,
        userName: user?.name,
      });
      socket.disconnect();
    }

    onCallEnd();
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 p-4">
        <div className="relative bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {!videoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl text-white">{user?.name?.charAt(0)}</span>
                </div>
                <p className="text-white">You (Video Off)</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded">
            <span className="text-white text-sm">You</span>
          </div>
        </div>

        {Array.from(remoteStreams.entries()).map(([userId, remoteStream]) => (
          <RemoteVideo key={userId} stream={remoteStream} userId={userId} />
        ))}

        {remoteStreams.size === 0 && (
          <div className="relative bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
            <div className="text-center">
              <div className="animate-pulse">
                <Video size={48} className="text-gray-500 mx-auto mb-4" />
              </div>
              <p className="text-gray-400">Waiting for others to join...</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-800 p-6 flex justify-center items-center space-x-4">
        <Button
          variant={audioEnabled ? 'outline' : 'error'}
          size="lg"
          onClick={toggleAudio}
          className="rounded-full w-14 h-14"
        >
          {audioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
        </Button>

        <Button
          variant={videoEnabled ? 'outline' : 'error'}
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

      <div className="absolute top-4 left-4 bg-black bg-opacity-50 px-4 py-2 rounded">
        <p className="text-white text-sm">
          {remoteStreams.size === 0 ? 'Waiting for participants...' : `${remoteStreams.size + 1} in call`}
        </p>
      </div>
    </div>
  );
};

const RemoteVideo: React.FC<{ stream: MediaStream; userId: string }> = ({ stream, userId }) => {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden">
      <video
        ref={ref}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded">
        <span className="text-white text-sm">Participant</span>
      </div>
    </div>
  );
};
