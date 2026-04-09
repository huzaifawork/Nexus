import React, { useState } from 'react';
import { User, Lock, Bell, Globe, Palette, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState((user as any)?.location || '');
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  if (!user) return null;

  const userId = (user as any)._id || user.id;

  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      await updateProfile(userId, { name, bio, location } as any);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.put(`/users/${userId}/change-password`, { currentPassword, newPassword });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardBody className="p-2">
            <nav className="space-y-1">
              {[
                { icon: <User size={18} />, label: 'Profile', active: true },
                { icon: <Lock size={18} />, label: 'Security', active: false },
                { icon: <Bell size={18} />, label: 'Notifications', active: false },
                { icon: <Globe size={18} />, label: 'Language', active: false },
                { icon: <Palette size={18} />, label: 'Appearance', active: false },
                { icon: <CreditCard size={18} />, label: 'Billing', active: false },
              ].map(({ icon, label, active }) => (
                <button key={label} className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${active ? 'text-primary-700 bg-primary-50' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <span className="mr-3">{icon}</span>{label}
                </button>
              ))}
            </nav>
          </CardBody>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Profile Settings</h2></CardHeader>
            <CardBody className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar src={user.avatarUrl} alt={user.name} size="xl" />
                <div>
                  <Button variant="outline" size="sm">Change Photo</Button>
                  <p className="mt-2 text-sm text-gray-500">JPG, GIF or PNG. Max size of 800K</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input label="Email" type="email" defaultValue={user.email} disabled />
                <Input label="Role" value={user.role} disabled />
                <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  className="w-full rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setName(user.name); setBio(user.bio); }}>Cancel</Button>
                <Button isLoading={profileLoading} onClick={handleProfileSave}>Save Changes</Button>
              </div>
            </CardBody>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Security Settings</h2></CardHeader>
            <CardBody className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                    <Badge variant="error" className="mt-1">Not Enabled</Badge>
                  </div>
                  <Button variant="outline">Enable</Button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Change Password</h3>
                <div className="space-y-4">
                  <Input label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    error={confirmNewPassword && newPassword !== confirmNewPassword ? 'Passwords do not match' : undefined}
                  />
                  <div className="flex justify-end">
                    <Button isLoading={passwordLoading} onClick={handlePasswordChange}>Update Password</Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
