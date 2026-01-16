"use client";
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router, isMounted]);

  // Avoid rendering children until confirmed authenticated
  if (!isMounted || !isAuthenticated) {
    return null; 
  }

  return children;
}

export default PrivateRoute;