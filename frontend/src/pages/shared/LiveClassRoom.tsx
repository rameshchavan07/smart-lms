import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Loader2 } from 'lucide-react';

const LiveClassRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meetingUrl, setMeetingUrl] = useState('');
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [courseName, setCourseName] = useState('');
  const [lectureTitle, setLectureTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLectureDetails = async () => {
      try {
        const { data } = await api.get(`/lectures/${id}`);
        setMeetingUrl(data.lecture.meetingUrl || `smart-lms-${data.lecture.id}`);
        setJwtToken(data.jitsiToken || null);
        setCourseName(data.lecture.course.title);
        setLectureTitle(data.lecture.title);
      } catch (error) {
        console.error('Failed to fetch lecture', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchLectureDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Preparing virtual classroom...</p>
      </div>
    );
  }

  if (!meetingUrl) {
    return (
      <div className="p-8 text-center text-red-500">
        Lecture not found or you don't have permission to join.
      </div>
    );
  }

  const isJaaS = !!import.meta.env.VITE_JITSI_APP_ID;

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 text-white p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-700 rounded-full transition text-slate-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-lg">{lectureTitle || 'Live Class'}</h1>
            <p className="text-xs text-slate-400">{courseName} • Powered by Jitsi Meet</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-medium rounded-full flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Class is Live
        </div>
      </div>

      {/* Jitsi Wrapper */}
      <div className="flex-1 w-full bg-black relative">
        <JitsiMeeting
          domain={isJaaS ? "8x8.vc" : "meet.jit.si"}
          roomName={isJaaS ? `${import.meta.env.VITE_JITSI_APP_ID}/${meetingUrl}` : meetingUrl}
          jwt={isJaaS ? (jwtToken || undefined) : undefined}
          configOverwrite={{
            startWithAudioMuted: true,
            disableModeratorIndicator: true,
            startScreenSharing: true,
            enableEmailInStats: false,
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            SHOW_CHROME_EXTENSION_BANNER: false,
          }}
          userInfo={{
            displayName: `${user?.firstName} ${user?.lastName} (${user?.role})`,
            email: user?.email || 'guest@smartlms.com'
          }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onApiReady={(externalApi: any) => {
            // Here you can attach listeners, e.g. when user leaves
            externalApi.addListener('videoConferenceLeft', () => {
              navigate(-1);
            });
          }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
          }}
        />
      </div>
    </div>
  );
};

export default LiveClassRoom;
