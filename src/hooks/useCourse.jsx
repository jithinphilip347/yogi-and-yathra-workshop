

import React from 'react'
import { useQueryClient,useQuery } from '@tanstack/react-query'
import courseApi from '@/libs/courseApi'

const useCourse = ({ queries }) => {
  const reactQueryClient = useQueryClient()

  const courseQuery = useQuery({
    queryKey: ['course', queries],
    queryFn: () => courseApi.all(queries),
    refetchOnWindowFocus: false,
    enabled: !!queries,
    onError: (err) => {
        console.log(err)
    }
  })

  const enrollmentsQuery = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => courseApi.enrollments(),
    refetchOnWindowFocus: false,
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