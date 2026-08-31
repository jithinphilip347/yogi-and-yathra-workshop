
import { logout, updateUser } from '@/features/auth/authSlice';
import ProfileApi from '@/libs/profileApi';
import { playerSessionCache } from '@/libs/playerSessionCache';
import { useMutation, useQueryClient } from '@tanstack/react-query'
import React from 'react'
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import authApi from '@/libs/authApi';

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


  const changePassword = (data) => {
    try {
      const res = authApi.change(data);
      toast.success("Password changed successfully");
    } catch (error) {
      toast.error(error?.data?.message);
    }
  }
  

  const handleLogout = () => {
    // Never let a logged-out user's cached course session leak to the next
    // authenticated user on the same tab.
    playerSessionCache.clear();
    dispatch(logout())
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.removeQueries({ queryKey: ['notifications'] });
    queryClient.removeQueries({ queryKey: ['notification-preferences'] });
    toast.success("Logout successfully");
    router.push('/');
  }
  

  return {
    updateProfile,
    handleLogout,
    changePassword,
  }
}

export default useProfile