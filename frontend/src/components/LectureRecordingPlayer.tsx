import React from 'react';
import ReactPlayer from 'react-player';

interface LectureRecordingPlayerProps {
  url: string;
}

const LectureRecordingPlayer: React.FC<LectureRecordingPlayerProps> = ({ url }) => {
  return (
    <div className="relative pt-[56.25%] bg-black rounded-xl overflow-hidden shadow-lg border border-border">
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
    </div>
  );
};

export default LectureRecordingPlayer;
