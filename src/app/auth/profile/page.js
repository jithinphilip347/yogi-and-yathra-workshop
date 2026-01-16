import React from 'react'
import Profile from './Profile'
import PrivateRoute from '@/hocs/PrivateRoute'

const page = () => {
  return (
    <PrivateRoute>
        <Profile />
    </PrivateRoute>
  )
}

export default page