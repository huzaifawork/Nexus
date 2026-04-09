import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { io, Socket } from 'socket.io-client';

interface VideoCallProps {
  meetingId: string;
  onCallEnd: () => void;
}

export const VideoCall: React.FC<VideoCallProps> = ({ meetingId, onCallEnd }) => {
  const { user } = useAuth();
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [joined, setJoined] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<Map<string, any>>(new Map());
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    initializeCall();
    return () => {
      leaveCall();
    };
  }, []);

  const initializeCall = async () => {
    try {
      // Initialize Socket.IO
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      // Get call token from backend
      const { data } = await api.post('/video-call/token', { meetingId });
      
      // Create Agora client
      const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      setClient(agoraClient);

      // Set up event listeners
      agoraClient.on('user-published', async (remoteUser, mediaType) => {
        await agoraClient.subscribe(remoteUser, mediaType);
        
        if (mediaType === 'video') {
          setRemoteUsers(prev => new Map(prev.set(remoteUser.uid.toString(), remoteUser)));
        }
        
        if (mediaType === 'audio') {
          remoteUser.audioTrack?.play();
        }
      });

      agoraClient.on('user-unpublished', (remoteUser) => {
        setRemoteUsers(prev => {
          const newMap = new Map(prev);
          newMap.delete(remoteUser.uid.toString());
          return newMap;
        });
      });

      agoraClient.on('user-left', (remoteUser) => {
        setRemoteUsers(prev => {
          const newMap = new Map(prev);
          newMap.delete(remoteUser.uid.toString());
          return newMap;
        });
      });

      // Join channel
      await agoraClient.join(
        data.appId,
        data.channelName,
        data.token,
        user?._id || null
      );

      // Create and publish local tracks
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      const videoTrack = await AgoraRTC.createCameraVideoTrack();

      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);

      // Play local video
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      // Publish tracks
      await agoraClient.publish([audioTrack, videoTrack]);

      setJoined(true);

      // Notify others via Socket.IO
      newSocket.emit('join-call', {
        roomId: meetingId,
        userId: user?._id,
        userName: user?.name,
      });

      toast.success('Joined video call');
    } catch (error: any) {
      console.error('Failed to join call:', error);
      toast.error('Failed to join video call');
    }
  };

  const toggleAudio = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!audioEnabled);
      setAudioEnabled(!audioEnabled);
      
      socket?.emit('toggle-audio', {
        roomId: meetingId,
        userId: user?._id,
        audioEnabled: !audioEnabled,
      });
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!videoEnabled);
      setVideoEnabled(!videoEnabled);
      
      socket?.emit('toggle-video', {
        roomId: meetingId,
        userId: user?._id,
        videoEnabled: !videoEnabled,
      });
    }
  };

  const leaveCall = async () => {
    try {
      // Stop local tracks
      localAudioTrack?.stop();
      localAudioTrack?.close();
      localVideoTrack?.stop();
      localVideoTrack?.close();

      // Leave channel
      if (client) {
        await client.leave();
      }

      // Notify others
      socket?.emit('leave-call', {
        roomId: meetingId,
        userId: user?._id,
        userName: user?.name,
      });

      socket?.disconnect();

      setJoined(false);
      onCallEnd();
    } catch (error) {
      console.error('Error leaving call:', error);
    }
  };

  useEffect(() => {
    // Play remote videos when refs are ready
    remoteUsers.forEach((remoteUser, uid) => {
      const ref = remoteVideoRefs.current.get(uid);
      if (ref && remoteUser.videoTrack) {
        remoteUser.videoTrack.play(ref);
      }
    });
  }, [remoteUsers]);

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 p-4">
        {/* Local Video */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden">
          <div ref={localVideoRef} className="w-full h-full" />
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

        {/* Remote Videos */}
        {Array.from(remoteUsers.entries()).map(([uid, remoteUser]) => (
          <div key={uid} className="relative bg-gray-800 rounded-lg overflow-hidden">
            <div
              ref={(el) => {
                if (el) remoteVideoRefs.current.set(uid, el);
              }}
              className="w-full h-full"
            />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded">
              <span className="text-white text-sm">Participant {uid}</span>
            </div>
          </div>
        ))}

        {/* Waiting for others */}
        {remoteUsers.size === 0 && (
          <div className="relative bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
            <div className="text-center">
              <Monitor size={48} className="text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Waiting for others to join...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
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

      {/* Call Info */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 px-4 py-2 rounded">
        <p className="text-white text-sm">
          {remoteUsers.size === 0 ? 'Waiting for participants...' : `${remoteUsers.size + 1} in call`}
        </p>
      </div>
    </div>
  );
};
