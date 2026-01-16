import React from 'react'
import Login from './Login'
import PublicRoute from '@/hocs/PublicRoute'

const page = () => {
  return (
      <PublicRoute> 
        <Login />
      </PublicRoute>
  )
}

export default page