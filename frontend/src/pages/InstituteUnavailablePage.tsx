import { Card } from '../components';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function InstituteUnavailablePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-2xl font-bold">Institute Unavailable</h1>
        <p className="text-muted">This institute is currently suspended or inactive. If you are an administrator, please contact support for more information.</p>
        <Link to="/" className="btn btn-primary inline-flex mt-4">Return to Homepage</Link>
      </Card>
    </div>
  );
}
