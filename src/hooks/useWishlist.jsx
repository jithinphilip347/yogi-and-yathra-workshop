"use client";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import toast from "react-hot-toast";
import {
  addToWishlist,
  removeFromWishlist,
} from "@/features/wishlist/wishlistSlice";

const useWishlist = () => {
  const wishlist = useSelector((state) => state.wishlist?.wishlist || []);
  const dispatch = useDispatch();

  const isInWishlist = (courseId, type = "course") => {
    if (!courseId) return false;
    return wishlist.some(
      (item) =>
        String(item.id) === String(courseId) &&
        (item.type || "course") === (type || "course")
    );
  };

  const findWishlistIcon = (courseId, type = "course") => {
    const isWishList = isInWishlist(courseId, type);
    return isWishList ? (
      <FaHeart className="wishlistActive" />
    ) : (
      <FaRegHeart />
    );
  };

  const handleWishlist = (item, type = "course") => {
    if (!item?.id) return;
    const isWishList = isInWishlist(item.id, type);

    if (isWishList) {
      dispatch(removeFromWishlist({ id: item.id, type }));
      toast.success("Removed from wishlist");
    } else {
      dispatch(addToWishlist({ ...item, type }));
      toast.success("Added to wishlist");
    }
  };

  return {
    wishlist,
    isInWishlist,
    findWishlistIcon,
    handleWishlist,
  };
};

export default useWishlist;
