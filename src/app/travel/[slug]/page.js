"use client";

import React from "react";
import { useParams } from "next/navigation";
import TravelDetails from "../travel-details/TravelDetails";

export default function TravelSlugPage() {
  const params = useParams();
  return <TravelDetails slug={params?.slug} />;
}
