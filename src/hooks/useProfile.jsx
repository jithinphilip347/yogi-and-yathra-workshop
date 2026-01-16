
import { logout, updateUser } from '@/features/auth/authSlice';
import ProfileApi from '@/libs/profileApi';
import { useMutation, useQueryClient } from '@tanstack/react-query'
import React from 'react'
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';

const useProfile = () => {

  const router = useRouter();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const updateProfile = useMutation({
    mutationFn: ({ id , data }) => ProfileApi.update({ id , data }),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      dispatch(updateUser({user: data}))
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      toast.error(error?.data?.message);
    }
  })

  const handleLogout = () => {
    dispatch(logout())
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    toast.success("Logout successfully");
    router.push('/');
  }
  

  return {
    updateProfile,
    handleLogout,
  }
}

export default useProfile