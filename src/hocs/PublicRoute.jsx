"use client";
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && isAuthenticated) {
        // Redirect to profile or home if already logged in
      router.push("/auth/profile"); 
    }
  }, [isAuthenticated, router, isMounted]);

  if (!isMounted || isAuthenticated) {
    return null;
  }

  return children;  
}

export default PublicRoute;
