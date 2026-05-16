import { useCallback, useState } from 'react';

import { signOutUser } from '@/lib/supabase/auth';

export function useSignOut() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      return await signOutUser();
    } finally {
      setIsSigningOut(false);
    }
  }, []);

  return { signOut, isSigningOut };
}
