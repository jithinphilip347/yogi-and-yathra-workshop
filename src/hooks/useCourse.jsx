import React from 'react'
import { useQueryClient,useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import courseApi from '@/libs/courseApi'

const useCourse = ({ queries }) => {
  const reactQueryClient = useQueryClient()
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const userId = user?.id

  const courseQuery = useQuery({
    queryKey: ['course', queries],
    queryFn: () => courseApi.all(queries),
    refetchOnWindowFocus: false,
    enabled: !!queries,
    onError: (err) => {
        console.log(err)
    }
  })

  // `enrolled-courses` requires a bearer token. This hook is used by the public
  // course rails (home page, /course), which signed-out visitors must be able to
  // view, so the request is gated on an authenticated user: a guest simply has no
  // enrollments to list, and firing it anyway produced a 401 on every public page.
  const enrollmentsQuery = useQuery({
    queryKey: ['enrollments', userId],
    queryFn: () => courseApi.enrollments(),
    refetchOnWindowFocus: false,
    enabled: !!userId && !!isAuthenticated,
    onError: (err) => {
        console.log(err)
    }
  })

  return {
    courseQuery,
    enrollmentsQuery
  }
}

export default useCourse