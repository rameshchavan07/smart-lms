import { Link, Navigate } from 'react-router-dom';
import { useInstitute } from '../../contexts/InstituteContext';
import { Button, Card } from '../../components';
import { GraduationCap, LogIn, UserPlus } from 'lucide-react';

export default function InstituteLanding() {
  const { institute, isLoading, error } = useInstitute();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted">Loading institute details...</div>;
  }

  if (error || !institute) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">!</span>
          </div>
          <h1 className="text-2xl font-bold">Institute Not Found</h1>
          <p className="text-muted">{error || "The institute you are looking for does not exist or is not active."}</p>
          <Link to="/" className="btn btn-primary inline-flex mt-4">Go to Homepage</Link>
        </Card>
      </div>
    );
  }

  // Check if status is anything other than APPROVED, though InstituteContext API should have blocked it.
  if (institute.status !== 'APPROVED') {
    return <Navigate to={`/i/${institute.slug}/unavailable`} replace />;
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-6">
        {institute.logoUrl ? (
          <img src={institute.logoUrl} alt={institute.name} className="w-24 h-24 mx-auto rounded-2xl object-cover shadow-sm bg-white p-2 border border-border" />
        ) : (
          <div className="w-24 h-24 mx-auto rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-brand">
            <GraduationCap size={40} />
          </div>
        )}
        
        <div>
          <h1 className="text-3xl font-bold text-primary">{institute.name}</h1>
          <p className="text-muted mt-2">Welcome to the official learning portal.</p>
        </div>

        <div className="space-y-4 pt-6">
          <Link to={`/i/${institute.slug}/login`} className="w-full">
            <Button className="w-full btn-primary gap-2 h-12 text-base">
              <LogIn size={18} /> Login to Portal
            </Button>
          </Link>
          <Link to={`/i/${institute.slug}/register`} className="w-full">
            <Button variant="secondary" className="w-full gap-2 h-12 text-base">
              <UserPlus size={18} /> Register as Student
            </Button>
          </Link>
        </div>
      </Card>
      <div className="mt-8 text-sm text-muted">
        Powered by OpenLearnX
      </div>
    </div>
  );
}
