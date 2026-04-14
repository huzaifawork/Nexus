export type UserRole = "entrepreneur" | "investor";

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  bio: string;
  isOnline?: boolean;
  createdAt: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  twoFactorEnabled?: boolean;
}

export interface Entrepreneur extends User {
  role: "entrepreneur";
  startupName: string;
  pitchSummary: string;
  fundingNeeded: string;
  industry: string;
  location: string;
  foundedYear: number;
  teamSize: number;
}

export interface Investor extends User {
  role: "investor";
  investmentInterests: string[];
  investmentStage: string[];
  portfolioCompanies: string[];
  totalInvestments: number;
  minimumInvestment: string;
  maximumInvestment: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
}

export interface CollaborationRequest {
  id: string;
  investorId: string;
  entrepreneurId: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface Meeting {
  _id: string;
  title: string;
  description?: string;
  organizerId: User | string;
  participantId: User | string;
  startTime: string;
  endTime: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  meetingLink?: string;
  location?: string;
  notes?: string;
  collaborationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingData {
  title: string;
  description?: string;
  participantId: string;
  startTime: string;
  endTime: string;
  meetingLink?: string;
  location?: string;
  notes?: string;
  collaborationId?: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  shared: boolean;
  url: string;
  ownerId: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
    role: UserRole,
  ) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  verifyOTP: (otpId: string, code: string) => Promise<User>;
  resendOTP: (otpId: string) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  otpRequired: boolean;
  otpData: any;
}
