'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import AuthForm from '@/components/auth/AuthForm';
import Navigation from '@/components/navigation/Navigation';
import MeasurementChart from '@/components/measurements/MeasurementChart';

export default function MeasurementsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .eq('active', true)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        await supabase.auth.signOut();
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error:', error);
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    // User state will be updated by the auth state change listener
  };

  const handleLogout = () => {
    setUser(null);
    setUserProfile(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      <Navigation user={userProfile} onLogout={handleLogout} />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <MeasurementChart user={userProfile} />
      </main>
    </div>
  );
}