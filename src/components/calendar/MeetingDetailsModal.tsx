import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Link as LinkIcon, User, Check, XCircle, Trash2, Video } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Meeting, User as UserType } from '../../types';
import { meetingApi } from '../../lib/meetingApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface MeetingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting;
  onUpdate: () => void;
  onJoinCall?: (meetingId: string) => void;
}

export const MeetingDetailsModal: React.FC<MeetingDetailsModalProps> = ({
  isOpen,
  onClose,
  meeting,
  onUpdate,
  onJoinCall,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const organizer = typeof meeting.organizerId === 'object' ? meeting.organizerId : null;
  const participant = typeof meeting.participantId === 'object' ? meeting.participantId : null;

  const isOrganizer = organizer?._id === user?._id || meeting.organizerId === user?._id;
  const isParticipant = participant?._id === user?._id || meeting.participantId === user?._id;

  console.log('Meeting details:', {
    meeting,
    organizer,
    participant,
    isOrganizer,
    isParticipant,
    currentUser: user,
  });

  const handleAccept = async () => {
    try {
      setLoading(true);
      await meetingApi.updateMeetingStatus(meeting._id, 'accepted');
      toast.success('Meeting accepted');
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to accept meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      await meetingApi.updateMeetingStatus(meeting._id, 'rejected');
      toast.success('Meeting rejected');
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this meeting?')) return;
    
    try {
      setLoading(true);
      await meetingApi.updateMeetingStatus(meeting._id, 'cancelled');
      toast.success('Meeting cancelled');
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this meeting? This action cannot be undone.')) return;
    
    try {
      setLoading(true);
      await meetingApi.deleteMeeting(meeting._id);
      toast.success('Meeting deleted');
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete meeting');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (meeting.status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'accepted':
        return <Badge variant="success">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="error">Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="gray">Cancelled</Badge>;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-gray-900">{meeting.title}</h2>
            {getStatusBadge()}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Time and Date */}
          <div className="flex items-start space-x-3">
            <Calendar className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-700">Date & Time</p>
              <p className="text-gray-900">
                {format(new Date(meeting.startTime), 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-gray-600 text-sm">
                {format(new Date(meeting.startTime), 'h:mm a')} - {format(new Date(meeting.endTime), 'h:mm a')}
              </p>
            </div>
          </div>

          {/* Organizer */}
          <div className="flex items-start space-x-3">
            <User className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-700">Organizer</p>
              <p className="text-gray-900">{organizer?.name || 'Loading...'}</p>
              <p className="text-gray-600 text-sm">{organizer?.email || ''}</p>
            </div>
          </div>

          {/* Participant */}
          <div className="flex items-start space-x-3">
            <User className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-700">Participant</p>
              <p className="text-gray-900">{participant?.name || 'Loading...'}</p>
              <p className="text-gray-600 text-sm">{participant?.email || ''}</p>
            </div>
          </div>

          {/* Location */}
          {meeting.location && (
            <div className="flex items-start space-x-3">
              <MapPin className="text-gray-400 mt-1" size={20} />
              <div>
                <p className="text-sm font-medium text-gray-700">Location</p>
                <p className="text-gray-900">{meeting.location}</p>
              </div>
            </div>
          )}

          {/* Meeting Link */}
          {meeting.meetingLink && (
            <div className="flex items-start space-x-3">
              <LinkIcon className="text-gray-400 mt-1" size={20} />
              <div>
                <p className="text-sm font-medium text-gray-700">Meeting Link</p>
                <a
                  href={meeting.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 underline break-all"
                >
                  {meeting.meetingLink}
                </a>
              </div>
            </div>
          )}

          {/* Description */}
          {meeting.description && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
              <p className="text-gray-900 whitespace-pre-wrap">{meeting.description}</p>
            </div>
          )}

          {/* Notes */}
          {meeting.notes && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Notes</p>
              <p className="text-gray-900 whitespace-pre-wrap">{meeting.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex space-x-2">
              {meeting.status === 'accepted' && onJoinCall && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Video size={16} />}
                  onClick={() => onJoinCall(meeting._id)}
                >
                  Join Video Call
                </Button>
              )}
              {isOrganizer && meeting.status !== 'cancelled' && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Trash2 size={16} />}
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Delete
                </Button>
              )}
            </div>

            <div className="flex space-x-2">
              {meeting.status === 'pending' && isParticipant && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<XCircle size={16} />}
                    onClick={handleReject}
                    disabled={loading}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    leftIcon={<Check size={16} />}
                    onClick={handleAccept}
                    disabled={loading}
                  >
                    Accept
                  </Button>
                </>
              )}

              {(meeting.status === 'pending' || meeting.status === 'accepted') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel Meeting
                </Button>
              )}

              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
