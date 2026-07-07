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
}

interface InstituteContextType {
  institute: Institute | null;
  isLoading: boolean;
  error: string | null;
}

import { AxiosError } from 'axios';

const InstituteContext = createContext<InstituteContextType | undefined>(undefined);

export const InstituteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { slug } = useParams<{ slug: string }>();
  const [institute, setInstitute] = useState<Institute | null>(null);
  const [isLoading, setIsLoading] = useState(!!slug);
  const [error, setError] = useState<string | null>(slug ? null : 'No institute specified');

  useEffect(() => {
    if (!slug) {
      return;
    }

    const fetchInstitute = async () => {
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

    fetchInstitute();
  }, [slug]);

  return (
    <InstituteContext.Provider value={{ institute, isLoading, error }}>
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
