import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', style }) => (
  <div className={`skeleton rounded-xl ${className}`} style={style} />
);

export const StatCardSkeleton: React.FC = () => (
  <div className="card" style={{ padding: 20 }}>
    <div className="flex items-start gap-4">
      <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  </div>
);

export const CourseCardSkeleton: React.FC = () => (
  <div className="course-card p-0 overflow-hidden">
    <Skeleton className="h-40 rounded-none rounded-t-2xl" />
    <div className="p-5 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 4 }) => (
  <tr>
    {[...Array(cols)].map((_, i) => (
      <td key={i} className="py-3 px-4">
        <Skeleton className="h-4 w-full max-w-[120px]" />
      </td>
    ))}
  </tr>
);

export default Skeleton;
