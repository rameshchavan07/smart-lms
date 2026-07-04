import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, PlayCircle } from 'lucide-react';
import { LectureRecordingPlayer, LectureRecorderUI, Skeleton } from '../../components';

const LiveClassRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meetingUrl, setMeetingUrl] = useState('');
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [courseName, setCourseName] = useState('');
  const [lectureTitle, setLectureTitle] = useState('');
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [isEnded, setIsEnded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLectureDetails = async () => {
      try {
        if (!id) return;
        const { data } = await api.get(API_ENDPOINTS.LECTURES.BY_ID(id));
        setMeetingUrl(data.lecture.meetingUrl || `open-learn-x-${data.lecture.id}`);
        setJwtToken(data.jitsiToken || null);
        setCourseName(data.lecture.course.title);
        setLectureTitle(data.lecture.title);
        setRecordingUrl(data.lecture.recordingUrl || null);
        setIsEnded(new Date(data.lecture.endTime) < new Date());
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-subtle p-6">
        <Skeleton className="w-full max-w-4xl h-[70vh] rounded-2xl" />
        <Skeleton className="w-64 h-6 mt-6" />
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

  const appId = import.meta.env.VITE_JITSI_APP_ID as string;
  const isJaaS = !!appId && appId.startsWith('vpaas-magic-cookie');

  // For JaaS: roomName must be "AppID/room" but the JWT uses room: '*' wildcard
  // so any token signed with the AppID will work for any room under that AppID
  const jitsiRoomName = isJaaS ? `${appId}/${meetingUrl}` : meetingUrl;

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
            <p className="text-xs text-muted">{courseName} • Powered by {isJaaS ? 'JaaS (8x8.vc)' : 'Jitsi Meet'}</p>
          </div>
        </div>
        {recordingUrl ? (
          <div className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full flex items-center gap-2">
            <PlayCircle className="w-4 h-4" />
            Watching Recording
          </div>
        ) : isEnded ? (
          <div className="px-3 py-1 bg-red-500/20 text-red-400 text-sm font-medium rounded-full flex items-center gap-2">
            Class Ended
          </div>
        ) : (
          <div className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-medium rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Class is Live
          </div>
        )}
      </div>

      {/* Jitsi Wrapper or Recording Player */}
      <div className="flex-1 w-full bg-black relative flex flex-col justify-center">
        {recordingUrl ? (
          <div className="w-full max-w-5xl mx-auto p-4">
            <LectureRecordingPlayer url={recordingUrl} />
          </div>
        ) : isEnded ? (
          <div className="text-center text-muted p-8">
            <p className="text-xl font-semibold mb-2">This live class has ended.</p>
            <p className="text-sm">The recording will be available here soon.</p>
          </div>
        ) : (
          <JitsiMeeting
            domain={isJaaS ? '8x8.vc' : 'meet.jit.si'}
            roomName={jitsiRoomName}
            jwt={jwtToken ?? undefined}
            configOverwrite={{
              startWithAudioMuted: true,
              disableModeratorIndicator: false,
              startScreenSharing: false,
              enableEmailInStats: false,
            }}
            interfaceConfigOverwrite={{
              DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
              SHOW_CHROME_EXTENSION_BANNER: false,
            }}
            userInfo={{
              displayName: `${user?.firstName} ${user?.lastName} (${user?.role})`,
              email: user?.email || 'guest@openlearnx.com'
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onApiReady={(externalApi: any) => {
              externalApi.addListener('videoConferenceJoined', () => {
                console.log('[Attendance Hook] I Joined the conference');
                if (user?.role === 'STUDENT' && id) {
                  api.post(API_ENDPOINTS.ATTENDANCE.MARK(id), { action: 'join' }).catch(err => console.error(err));
                }
              });
              externalApi.addListener('videoConferenceLeft', () => {
                console.log('[Attendance Hook] I Left the conference');
                if (user?.role === 'STUDENT' && id) {
                  api.post(API_ENDPOINTS.ATTENDANCE.MARK(id), { action: 'leave' }).catch(err => console.error(err));
                }
                navigate(-1);
              });
              externalApi.addListener('participantJoined', (participant: unknown) => {
                console.log('[Attendance Hook] Participant Joined:', participant);
              });
              externalApi.addListener('participantLeft', (participant: unknown) => {
                console.log('[Attendance Hook] Participant Left:', participant);
              });
              externalApi.addListener('errorOccurred', (err: unknown) => {
                console.error('[Jitsi] Error occurred:', err);
              });
            }}
            getIFrameRef={(iframeRef) => {
              iframeRef.style.height = '100%';
              iframeRef.style.width = '100%';
            }}
          />
        )}
      </div>

      {/* Render custom Lecture Recorder UI for Teachers only when in a live class */}
      {user?.role === 'TEACHER' && !recordingUrl && !isEnded && id && (
        <LectureRecorderUI lectureId={id} />
      )}
    </div>
  );
};

export default LiveClassRoom;
