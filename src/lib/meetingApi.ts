import api from './api';
import { Meeting, CreateMeetingData } from '../types';

export const meetingApi = {
  // Get all meetings
  getMeetings: async (params?: { status?: string; startDate?: string; endDate?: string }) => {
    const { data } = await api.get<Meeting[]>('/meetings', { params });
    return data;
  },

  // Get single meeting
  getMeetingById: async (id: string) => {
    const { data } = await api.get<Meeting>(`/meetings/${id}`);
    return data;
  },

  // Create meeting
  createMeeting: async (meetingData: CreateMeetingData) => {
    const { data } = await api.post<Meeting>('/meetings', meetingData);
    return data;
  },

  // Update meeting
  updateMeeting: async (id: string, updates: Partial<CreateMeetingData>) => {
    const { data } = await api.put<Meeting>(`/meetings/${id}`, updates);
    return data;
  },

  // Update meeting status
  updateMeetingStatus: async (id: string, status: 'accepted' | 'rejected' | 'cancelled') => {
    const { data } = await api.patch<Meeting>(`/meetings/${id}/status`, { status });
    return data;
  },

  // Delete meeting
  deleteMeeting: async (id: string) => {
    const { data } = await api.delete(`/meetings/${id}`);
    return data;
  },
};
