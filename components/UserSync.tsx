'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';

// This component ensures that when a user signs in via Clerk,
// their data is automatically stored in our database
export default function UserSync() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      // Call an API route to sync the user
      fetch('/api/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch(error => {
        console.error('Failed to sync user:', error);
      });
    }
  }, [isLoaded, user]);

  return null; // This component doesn't render anything
}
