import { Card } from '../../components';

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
      <Card className="p-6">
        <p className="text-muted">Welcome to the Super Admin portal. Use the sidebar to manage platform-wide settings and institute registrations.</p>
      </Card>
    </div>
  );
}
