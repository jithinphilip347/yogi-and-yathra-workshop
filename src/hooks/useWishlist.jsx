
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {FaHeart , FaRegHeart} from 'react-icons/fa'
import toast from 'react-hot-toast'
import { addToWishlist, removeFromWishlist } from '@/features/wishlist/wishlistSlice'

const useWishlist = () => {
  const { wishlist } = useSelector(state => state.wishlist)
  const dispatch = useDispatch();
  
  const findWishlistIcon = (courseId , type) => {
     const isWishList = wishlist.find(item => item.id === courseId && item.type === type)
     return isWishList ? <FaHeart /> : <FaRegHeart />
  }

  const handleWishlist = (item, type) => {
    const isWishList = wishlist.find(wItem => wItem.id === item.id && wItem.type === type)
    
    if(isWishList){
      dispatch(removeFromWishlist({ id: item.id , type }))
      toast.success("Removed from wishlist")
    } else {
      dispatch(addToWishlist({ ...item, type }))
      toast.success("Added to wishlist")
    }
  }

  return {
    findWishlistIcon,
    handleWishlist
  }
}

export default useWishlist