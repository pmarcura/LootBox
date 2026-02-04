export type FriendRequestStatus = "pending" | "accepted" | "rejected";

export type FriendRequestRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: FriendRequestStatus;
  created_at: string;
  from_profile?: { id: string; display_name: string | null };
  to_profile?: { id: string; display_name: string | null };
};

export type FriendRow = {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  profile?: { id: string; display_name: string | null };
};
