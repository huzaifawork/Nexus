import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Users, Calendar, Building2, MapPin, UserCircle, FileText, DollarSign, Send } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { Entrepreneur } from '../../types';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export const EntrepreneurProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [entrepreneur, setEntrepreneur] = useState<Entrepreneur | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasRequested, setHasRequested] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>('none');

  useEffect(() => {
    const fetchEntrepreneur = async () => {
      try {
        const { data } = await api.get(`/users/${id}`);
        if (data.role !== 'entrepreneur') throw new Error('Not an entrepreneur');
        setEntrepreneur(data);
        
        // Check if already sent a request to this entrepreneur
        if (currentUser?.role === 'investor') {
          try {
            const { data: collaborations } = await api.get('/collaborations');
            const existingRequest = collaborations.find(
              (collab: any) => (collab.entrepreneurId === id || collab.entrepreneurId._id === id || collab.entrepreneurId === data._id)
            );
            if (existingRequest) {
              setHasRequested(true);
              setRequestStatus(existingRequest.status);
            }
          } catch {
            // silently fail
          }
        }
      } catch {
        setEntrepreneur(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEntrepreneur();
  }, [id, currentUser]);

  const handleSendRequest = async () => {
    try {
      const entrepreneurId = (entrepreneur as any)._id || entrepreneur.id || id;
      
      await api.post('/collaborations', {
        entrepreneurId,
        message: `I'm interested in learning more about ${entrepreneur?.startupName} and would like to explore potential investment opportunities.`,
      });
      setHasRequested(true);
      setRequestStatus('pending');
      toast.success('Collaboration request sent successfully!');
    } catch (error: any) {
      if (error.response?.data?.message === 'Request already sent to this entrepreneur') {
        toast.error('You have already sent a request to this entrepreneur');
        setHasRequested(true);
      } else {
        toast.error(error.response?.data?.message || 'Failed to send request');
      }
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-600"></div></div>;

  if (!entrepreneur) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Entrepreneur not found</h2>
        <p className="text-gray-600 mt-2">The entrepreneur profile you're looking for doesn't exist.</p>
        <Link to="/dashboard/investor"><Button variant="outline" className="mt-4">Back to Dashboard</Button></Link>
      </div>
    );
  }

  const isCurrentUser = currentUser?._id === entrepreneur._id || currentUser?.id === id;
  const isInvestor = currentUser?.role === 'investor';

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar src={entrepreneur.avatarUrl} alt={entrepreneur.name} size="xl" status={entrepreneur.isOnline ? 'online' : 'offline'} className="mx-auto sm:mx-0" />
            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{entrepreneur.name}</h1>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                <Building2 size={16} className="mr-1" /> Founder at {entrepreneur.startupName}
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                <Badge variant="primary">{entrepreneur.industry}</Badge>
                {entrepreneur.location && <Badge variant="gray"><MapPin size={14} className="mr-1" />{entrepreneur.location}</Badge>}
                {entrepreneur.foundedYear && <Badge variant="accent"><Calendar size={14} className="mr-1" />Founded {entrepreneur.foundedYear}</Badge>}
                {entrepreneur.teamSize && <Badge variant="secondary"><Users size={14} className="mr-1" />{entrepreneur.teamSize} team members</Badge>}
              </div>
            </div>
          </div>
          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2">
            {!isCurrentUser && (
              <>
                <Link to={`/chat/${entrepreneur._id || id}`}>
                  <Button variant="outline" leftIcon={<MessageCircle size={18} />}>Message</Button>
                </Link>
                {isInvestor && (
                  <Button leftIcon={<Send size={18} />} disabled={hasRequested} onClick={handleSendRequest}>
                    {hasRequested ? 'Request Sent' : 'Request Collaboration'}
                  </Button>
                )}
              </>
            )}
            {isCurrentUser && (
              <Link to="/settings">
                <Button variant="outline" leftIcon={<UserCircle size={18} />}>Edit Profile</Button>
              </Link>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {isInvestor && hasRequested && (
            <Card className={`border-2 ${
              requestStatus === 'pending' ? 'bg-yellow-50 border-yellow-200' :
              requestStatus === 'accepted' ? 'bg-green-50 border-green-200' :
              requestStatus === 'rejected' ? 'bg-red-50 border-red-200' : ''
            }`}>
              <CardBody className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full mr-3 ${
                    requestStatus === 'pending' ? 'bg-yellow-100' :
                    requestStatus === 'accepted' ? 'bg-green-100' :
                    requestStatus === 'rejected' ? 'bg-red-100' : ''
                  }`}>
                    <Send size={20} className={`${
                      requestStatus === 'pending' ? 'text-yellow-700' :
                      requestStatus === 'accepted' ? 'text-green-700' :
                      requestStatus === 'rejected' ? 'text-red-700' : ''
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-md font-semibold text-gray-900">
                      {requestStatus === 'pending' && 'Collaboration Request Pending'}
                      {requestStatus === 'accepted' && 'Collaboration Request Accepted'}
                      {requestStatus === 'rejected' && 'Collaboration Request Declined'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {requestStatus === 'pending' && 'Waiting for entrepreneur to respond to your request'}
                      {requestStatus === 'accepted' && 'You can now collaborate with this entrepreneur'}
                      {requestStatus === 'rejected' && 'Your request was declined by the entrepreneur'}
                    </p>
                  </div>
                </div>
                <Badge variant={
                  requestStatus === 'pending' ? 'warning' :
                  requestStatus === 'accepted' ? 'success' :
                  requestStatus === 'rejected' ? 'error' : 'gray'
                }>
                  {requestStatus.charAt(0).toUpperCase() + requestStatus.slice(1)}
                </Badge>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">About</h2></CardHeader>
            <CardBody><p className="text-gray-700">{entrepreneur.bio || 'No bio provided.'}</p></CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Startup Overview</h2></CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-medium text-gray-900">Pitch Summary</h3>
                  <p className="text-gray-700 mt-1">{entrepreneur.pitchSummary || 'Not provided.'}</p>
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-900">Industry</h3>
                  <p className="text-gray-700 mt-1">{entrepreneur.industry || 'Not specified.'}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Funding</h2></CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Funding Needed</span>
                  <div className="flex items-center mt-1">
                    <DollarSign size={18} className="text-accent-600 mr-1" />
                    <p className="text-lg font-semibold text-gray-900">{entrepreneur.fundingNeeded || 'Not specified'}</p>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Team Size</span>
                  <p className="text-md font-medium text-gray-900">{entrepreneur.teamSize || 'N/A'} members</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Founded</span>
                  <p className="text-md font-medium text-gray-900">{entrepreneur.foundedYear || 'N/A'}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Documents</h2></CardHeader>
            <CardBody>
              <div className="space-y-3">
                {['Pitch Deck', 'Business Plan', 'Financial Projections'].map((doc) => (
                  <div key={doc} className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                    <div className="p-2 bg-primary-50 rounded-md mr-3"><FileText size={18} className="text-primary-700" /></div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{doc}</h3>
                      <p className="text-xs text-gray-500">Available on collaboration</p>
                    </div>
                  </div>
                ))}
                {!isCurrentUser && isInvestor && !hasRequested && (
                  <Button className="mt-3 w-full" onClick={handleSendRequest}>Request Collaboration</Button>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
