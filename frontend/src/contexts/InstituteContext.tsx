import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { getMediaUrl } from '../utils/url';

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
  themeConfig?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  } | null;
  terminologyMap?: Record<string, string> | null;
  legalPages?: {
    termsOfService?: string;
    privacyPolicy?: string;
  } | null;
}

interface InstituteContextType {
  institute: Institute | null;
  isLoading: boolean;
  error: string | null;
  refreshInstitute: () => Promise<void>;
  t: (term: string) => string;
}

import { AxiosError } from 'axios';

const InstituteContext = createContext<InstituteContextType | undefined>(undefined);

export const InstituteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { slug } = useParams<{ slug: string }>();
  const [institute, setInstitute] = useState<Institute | null>(null);
  const [isLoading, setIsLoading] = useState(!!slug);
  const [error, setError] = useState<string | null>(slug ? null : 'No institute specified');

  const fetchInstitute = useCallback(async () => {
    if (!slug) return;
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await api.get(`/institutes/by-slug/${slug}`);
      const fetchedInstitute = data.institute;
      
      if (fetchedInstitute) {
        if (fetchedInstitute.logoUrl) {
          fetchedInstitute.logoUrl = getMediaUrl(fetchedInstitute.logoUrl);
        }
        if (fetchedInstitute.coverImageUrl) {
          fetchedInstitute.coverImageUrl = getMediaUrl(fetchedInstitute.coverImageUrl);
        }
      }
      
      setInstitute(fetchedInstitute);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const msg = axiosError.response?.data?.message || 'Institute not found';
      setError(msg);
      setInstitute(null);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    // Avoid synchronous setState warning in effect by deferring
    void Promise.resolve().then(() => fetchInstitute());
  }, [fetchInstitute]);

  const refreshInstitute = async () => {
    await fetchInstitute();
  };

  const t = useCallback((term: string) => {
    if (!institute?.terminologyMap) return term;
    return institute.terminologyMap[term] || term;
  }, [institute]);

  // Apply dynamic theme config
  useEffect(() => {
    const primary = institute?.themeConfig?.primaryColor || institute?.themeColor;
    
    if (primary) {
      document.documentElement.style.setProperty('--color-brand-500', primary);
      document.documentElement.style.setProperty('--color-brand-600', `color-mix(in srgb, ${primary} 85%, black)`);
      document.documentElement.style.setProperty('--color-brand-700', `color-mix(in srgb, ${primary} 70%, black)`);
      document.documentElement.style.setProperty('--color-border-focus', primary);
    } else {
      document.documentElement.style.removeProperty('--color-brand-500');
      document.documentElement.style.removeProperty('--color-brand-600');
      document.documentElement.style.removeProperty('--color-brand-700');
      document.documentElement.style.removeProperty('--color-border-focus');
    }
    
    const secondary = institute?.themeConfig?.secondaryColor;
    if (secondary) {
      document.documentElement.style.setProperty('--color-secondary-500', secondary);
    } else {
      document.documentElement.style.removeProperty('--color-secondary-500');
    }
  }, [institute?.themeColor, institute?.themeConfig]);

  return (
    <InstituteContext.Provider value={{ institute, isLoading, error, refreshInstitute, t }}>
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
