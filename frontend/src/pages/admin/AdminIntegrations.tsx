import React from 'react';
import { Globe, Plug, Loader2, Check, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const AdminIntegrations: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['adminIntegrations'],
    queryFn: async () => {
      const res = await api.get('/integrations');
      return res.data.integrations;
    }
  });

  const toggleIntegration = useMutation({
    mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
      return api.put(`/integrations/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminIntegrations'] });
    }
  });

  const getIconForProvider = (provider: string) => {
    switch (provider) {
      case 'Zoom': return <Globe size={24} className="text-blue-500" />;
      case 'GoogleDrive': return <Globe size={24} className="text-green-500" />;
      case 'Stripe': return <Globe size={24} className="text-indigo-500" />;
      case 'Slack': return <Globe size={24} className="text-red-500" />;
      default: return <Plug size={24} className="text-gray-500" />;
    }
  };

  const getDescForProvider = (provider: string) => {
    switch (provider) {
      case 'Zoom': return 'Seamless video conferencing for live classes.';
      case 'GoogleDrive': return 'Attach and sync files directly from Google Drive.';
      case 'Stripe': return 'Process payments for paid courses and subscriptions.';
      case 'Slack': return 'Receive platform notifications directly in Slack.';
      case 'GitHub': return 'Sync repositories and assignments with GitHub.';
      default: return 'Third-party integration.';
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Integrations</h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Manage third-party connections and APIs.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration: { id: string; provider: string; isActive: boolean; name?: string; description?: string }) => (
            <div key={integration.id} className="card flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-black/5 dark:bg-surface/5 flex items-center justify-center">
                  {getIconForProvider(integration.provider)}
                </div>
                <button 
                  onClick={() => toggleIntegration.mutate({ id: integration.id, isActive: !integration.isActive })}
                  disabled={toggleIntegration.isPending}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${integration.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-surface transition-transform ${integration.isActive ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
              </div>
              <h3 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>{integration.provider}</h3>
              <p className="text-[13px] mt-2 mb-6 flex-1" style={{ color: 'var(--text-muted)' }}>
                {getDescForProvider(integration.provider)}
              </p>
              
              <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                {integration.isActive ? (
                  <span className="flex items-center gap-1 text-[12px] font-bold text-emerald-500"><Check size={14} /> Connected</span>
                ) : (
                  <span className="flex items-center gap-1 text-[12px] font-bold text-gray-500"><X size={14} /> Disconnected</span>
                )}
                
                {integration.isActive && (
                  <button className="ml-auto text-[12px] font-semibold text-brand-500 hover:underline">
                    Configure
                  </button>
                )}
              </div>
            </div>
          ))}
          {integrations.length === 0 && (
            <div className="col-span-full py-12 text-center text-[13px] text-gray-500">
              No integrations available. Please ensure seed script was run.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminIntegrations;
