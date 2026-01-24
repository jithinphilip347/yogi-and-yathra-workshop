import MyCourses from '@/components/profile/MyCourses';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import React from 'react'
import reviewApi from '@/libs/reviewApi';
import { toast } from 'react-hot-toast';

const useReview = ({ course_id, perPage }) => {
   const queryClient = useQueryClient();

   const createCourseReview = useMutation({
    mutationFn: (data) => {
      return reviewApi.postCourseReview(data)
    },
    onSuccess: () => {
      
      queryClient.invalidateQueries({
        queryKey: ['course-reviews']
      })
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to submit review");
      console.log(error);
    }
   })

   const getCourseReview = useQuery({
    queryKey: ['course-reviews', course_id, perPage],
    queryFn: () => reviewApi.getCourseReview(course_id, perPage),
    enabled: !!course_id
   })

   return {
    createCourseReview,
    getCourseReview
   }
}

export default useReview