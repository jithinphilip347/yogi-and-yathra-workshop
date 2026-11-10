"use client";

import React from "react";
import { useParams } from "next/navigation";
import EventDetails from "../event-details/EventDetails";

export default function EventSlugPage() {
  const params = useParams();
  return <EventDetails slug={params?.slug} />;
}
