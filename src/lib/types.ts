/* =========================
   CORE DATABASE TYPES
   ========================= */

export type UserRole = "student" | "club_organizer" | "admin";

export type User = {
  id: string; // UUID
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;

  roll_number?: string;
  rollNumber?: string; // Alias for roll_number
  branch?: string;
  section?: string;

  organizer_status?: "pending" | "approved" | "rejected";

  status?: "active" | "banned";

  avatar?: string;

  club_ids?: string[]; // Array of club IDs this user manages

  email_preferences?: {
    eventReminders: boolean;
    commentReplies: boolean;
    registrationConfirmations: boolean;
  };

  emailPreferences?: { // Alias for email_preferences
    eventReminders: boolean;
    commentReplies: boolean;
    registrationConfirmations: boolean;
  };

  created_at?: string;
  updated_at?: string;
};

/* =========================
   CLUB
   ========================= */

export type Club = {
  id: string; // UUID
  name: string;
  description?: string;
  category?: string;
  logo?: string;

  organizer_id?: string; // UUID (matches DB)
  status: "pending" | "approved" | "rejected";

  created_at?: string;
  updated_at?: string;
};

/* =========================
   EVENT
   ========================= */

export type Event = {
  id: string; // UUID
  title: string;
  description?: string;
  long_description?: string;
  longDescription?: string; // Alias for long_description

  date: string;
  time?: string;
  venue: string;

  club?: string;
  clubName?: string; // Alias for club
  category?: string;
  tags?: string[];

  image_url?: string;
  image?: string; // Alias for image_url

  registrationCount?: number;

  created_by: string; // UUID (REQUIRED – ownership)

  is_completed?: boolean;

  created_at?: string;
  updated_at?: string;
};

/* =========================
   REGISTRATION
   ========================= */

export type Registration = {
  id: number;
  event_id: string; // UUID
  user_id: string; // UUID

  full_name: string;
  email: string;

  roll_number?: string;
  branch?: string;
  section?: string;

  title?: string;
  date?: string;

  registration_date?: string;
};

/* =========================
   COMMENT
   ========================= */

export type Comment = {
  id: string; // Changed to UUID string to match DB
  event_id: string; // UUID
  user_id: string; // UUID

  content: string;

  parent_id?: string | null;
  children?: Comment[]; // For nested replies

  created_at: string;

  user?: {
    first_name: string;
    last_name: string;
    avatar?: string;
  };

  likes_count?: number; // From count aggregation
  user_has_liked?: boolean; // From current user check
};

/* =========================
   REMINDER
   ========================= */

export type Reminder = {
  id: string; // UUID
  user_id: string; // UUID
  event_id: string; // UUID

  event_title: string;
  event_date: string;
  reminder_time: string;

  sent: boolean;
  created_at: string;
};

/* =========================
   NOTIFICATION
   ========================= */

export type Notification = {
  id: string; // UUID
  user_id: string; // UUID

  type: "reminder" | "comment" | "registration" | "event_update" | "system";

  title: string;
  message?: string;

  event_id?: string; // UUID
  read: boolean;

  created_at: string;
  action_url?: string;
};
