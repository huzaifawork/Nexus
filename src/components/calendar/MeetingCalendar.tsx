import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Meeting } from '../../types';
import { meetingApi } from '../../lib/meetingApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { MeetingModal } from './MeetingModal';
import { MeetingDetailsModal } from './MeetingDetailsModal';
import { VideoCall } from '../video/VideoCall';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Meeting;
}

export const MeetingCalendar: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [inCall, setInCall] = useState(false);
  const [callMeetingId, setCallMeetingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const data = await meetingApi.getMeetings();
      setMeetings(data);
    } catch (error: any) {
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const events: CalendarEvent[] = useMemo(() => {
    return meetings.map((meeting) => ({
      id: meeting._id,
      title: meeting.title,
      start: new Date(meeting.startTime),
      end: new Date(meeting.endTime),
      resource: meeting,
    }));
  }, [meetings]);

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end });
    setShowCreateModal(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedMeeting(event.resource);
    setShowDetailsModal(true);
  };

  const handleCreateMeeting = () => {
    setShowCreateModal(false);
    setSelectedSlot(null);
    fetchMeetings();
  };

  const handleUpdateMeeting = () => {
    setShowDetailsModal(false);
    setSelectedMeeting(null);
    fetchMeetings();
  };

  const handleJoinCall = (meetingId: string) => {
    setCallMeetingId(meetingId);
    setInCall(true);
    setShowDetailsModal(false);
  };

  const handleCallEnd = () => {
    setInCall(false);
    setCallMeetingId(null);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const meeting = event.resource;
    let backgroundColor = '#3b82f6';
    
    if (meeting.status === 'accepted') {
      backgroundColor = '#10b981';
    } else if (meeting.status === 'rejected') {
      backgroundColor = '#ef4444';
    } else if (meeting.status === 'cancelled') {
      backgroundColor = '#6b7280';
    }

    const isOrganizer = typeof meeting.organizerId === 'object' 
      ? meeting.organizerId._id === user?._id 
      : meeting.organizerId === user?._id;

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: meeting.status === 'cancelled' ? 0.6 : 1,
        color: 'white',
        border: isOrganizer ? '2px solid #1e40af' : 'none',
        display: 'block',
      },
    };
  };

  if (inCall && callMeetingId) {
    return <VideoCall meetingId={callMeetingId} onCallEnd={handleCallEnd} />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen p-6">
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Meeting Calendar</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center ml-4">
                <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                <span>Accepted</span>
              </div>
              <div className="flex items-center ml-4">
                <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                <span>Rejected</span>
              </div>
              <div className="flex items-center ml-4">
                <div className="w-4 h-4 bg-gray-500 rounded mr-2"></div>
                <span>Cancelled</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Click on a time slot to create a meeting. Click on an event to view details.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-4" style={{ height: 'calc(100vh - 200px)' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          eventPropGetter={eventStyleGetter}
          style={{ height: '100%' }}
        />
      </div>

      {showCreateModal && (
        <MeetingModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedSlot(null);
          }}
          onSuccess={handleCreateMeeting}
          initialStartTime={selectedSlot?.start}
          initialEndTime={selectedSlot?.end}
        />
      )}

      {showDetailsModal && selectedMeeting && (
        <MeetingDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedMeeting(null);
          }}
          meeting={selectedMeeting}
          onUpdate={handleUpdateMeeting}
          onJoinCall={handleJoinCall}
        />
      )}
    </div>
  );
};
