"use client";
import { db } from "@/lib/firebase";
import { useFounderAuth } from "@/lib/useFounderAuth";
import { collection, limit, orderBy, query, where } from "firebase/firestore";
import { useState } from "react";
import FounderWorkspacesPage from "../FounderWorkspacesPage";

const PAGE_SIZE = 20;

export default function Page() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    industry: "",
    health: "",
    plan: "",
    billingStatus: "",
  });
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const { isFounderUser, ready, user } = useFounderAuth();
  const founderUserId = user?.uid;
  if (!founderUserId) return <div>Missing founderUserId in context</div>;

  const fetchWorkspaces = async (reset = false) => {
    setLoading(true);
    let q = query(
      collection(db, `founder/${founderUserId}/workspaceSnapshots`),
      orderBy("date", "desc"),
      limit(PAGE_SIZE),
    );
    const filterArr = [];
    if (filters.industry)
      filterArr.push(where("industry", "==", filters.industry));
    if (filters.health) filterArr.push(where("health", "==", filters.health));
    if (filters.plan) filterArr.push(where("plan", "==", filters.plan));
    if (filters.billingStatus)
      filterArr.push(where("billingStatus", "==", filters.billingStatus));
    // ...fetch logic here...
  };

  return <FounderWorkspacesPage />;
}
