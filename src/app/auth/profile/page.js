import React, { Suspense } from 'react';
import Profile from './Profile';
import PrivateRoute from '@/hocs/PrivateRoute';

const page = () => {
  return (
    <PrivateRoute>
      <Suspense fallback={null}>
        <Profile />
      </Suspense>
    </PrivateRoute>
  );
};

export default page;