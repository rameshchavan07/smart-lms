import React from 'react';
import ReactPlayer from 'react-player';

interface LectureRecordingPlayerProps {
  url: string;
}

const LectureRecordingPlayer: React.FC<LectureRecordingPlayerProps> = ({ url }) => {
  // Check if it's a Google Drive link
  const isGoogleDrive = url.includes('drive.google.com');

  // Convert Google Drive /view to /preview for embedding
  const embedUrl = isGoogleDrive ? url.replace('/view', '/preview') : url;

  return (
    <div className="relative pt-[56.25%] bg-black rounded-xl overflow-hidden shadow-lg border border-border">
      {isGoogleDrive ? (
        <iframe
          src={embedUrl}
          className="absolute top-0 left-0 w-full h-full border-0"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="Lecture Recording"
        />
      ) : (
        <ReactPlayer
          url={url}
          className="absolute top-0 left-0"
          width="100%"
          height="100%"
          controls
          config={{
            file: {
              attributes: {
                controlsList: 'nodownload'
              }
            }
          }}
        />
      )}
    </div>
  );
};

export default LectureRecordingPlayer;
