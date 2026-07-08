import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

interface Institute {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  themeColor?: string | null;
  coverImageUrl?: string | null;
  description?: string | null;
  allowedEmailDomain?: string | null;
  isPrivate?: boolean;
  facebookUrl?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
}

interface InstituteContextType {
  institute: Institute | null;
  isLoading: boolean;
  error: string | null;
  refreshInstitute: () => Promise<void>;
}

import { AxiosError } from 'axios';

const InstituteContext = createContext<InstituteContextType | undefined>(undefined);

export const InstituteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { slug } = useParams<{ slug: string }>();
  const [institute, setInstitute] = useState<Institute | null>(null);
  const [isLoading, setIsLoading] = useState(!!slug);
  const [error, setError] = useState<string | null>(slug ? null : 'No institute specified');

  const fetchInstitute = async () => {
    if (!slug) return;
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await api.get(`/institutes/by-slug/${slug}`);
      setInstitute(data.institute);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const msg = axiosError.response?.data?.message || 'Institute not found';
      setError(msg);
      setInstitute(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitute();
  }, [slug]);

  const refreshInstitute = async () => {
    await fetchInstitute();
  };

  // Apply dynamic theme color
  useEffect(() => {
    if (institute?.themeColor) {
      document.documentElement.style.setProperty('--color-brand-500', institute.themeColor);
      document.documentElement.style.setProperty('--color-brand-600', `color-mix(in srgb, ${institute.themeColor} 85%, black)`);
      document.documentElement.style.setProperty('--color-brand-700', `color-mix(in srgb, ${institute.themeColor} 70%, black)`);
      document.documentElement.style.setProperty('--color-border-focus', institute.themeColor);
    } else {
      document.documentElement.style.removeProperty('--color-brand-500');
      document.documentElement.style.removeProperty('--color-brand-600');
      document.documentElement.style.removeProperty('--color-brand-700');
      document.documentElement.style.removeProperty('--color-border-focus');
    }
  }, [institute?.themeColor]);

  return (
    <InstituteContext.Provider value={{ institute, isLoading, error, refreshInstitute }}>
      {children}
    </InstituteContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useInstitute = () => {
  const context = useContext(InstituteContext);
  if (context === undefined) {
    throw new Error('useInstitute must be used within an InstituteProvider');
  }
  return context;
};
