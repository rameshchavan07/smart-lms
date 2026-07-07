import { Card } from '../components';
import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function InstitutePendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock size={32} />
        </div>
        <h1 className="text-2xl font-bold">Registration Pending</h1>
        <p className="text-muted">Your institute registration request has been submitted and is currently under review by our team. We will notify you via email once it has been approved.</p>
        <Link to="/" className="btn btn-primary inline-flex mt-4">Return to Homepage</Link>
      </Card>
    </div>
  );
}
