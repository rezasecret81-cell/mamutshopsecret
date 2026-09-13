-- Add foreign keys from user_id columns to profiles(id)
-- This enables PostgREST embedded joins like select('*, profiles(full_name)')
-- Without these FKs, queries like chat_rooms.select('*, profiles(full_name)') fail with error

-- chat_rooms.user_id -> profiles.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chat_rooms_user_id_profiles_fkey'
      AND conrelid = 'chat_rooms'::regclass
  ) THEN
    ALTER TABLE chat_rooms
      ADD CONSTRAINT chat_rooms_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- orders.user_id -> profiles.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_user_id_profiles_fkey'
      AND conrelid = 'orders'::regclass
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- tickets.user_id -> profiles.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tickets_user_id_profiles_fkey'
      AND conrelid = 'tickets'::regclass
  ) THEN
    ALTER TABLE tickets
      ADD CONSTRAINT tickets_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ticket_replies.user_id -> profiles.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ticket_replies_user_id_profiles_fkey'
      AND conrelid = 'ticket_replies'::regclass
  ) THEN
    ALTER TABLE ticket_replies
      ADD CONSTRAINT ticket_replies_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- addresses.user_id -> profiles.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'addresses_user_id_profiles_fkey'
      AND conrelid = 'addresses'::regclass
  ) THEN
    ALTER TABLE addresses
      ADD CONSTRAINT addresses_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- chat_messages.sender_id -> profiles.id (nullable, ON DELETE SET NULL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chat_messages_sender_id_profiles_fkey'
      AND conrelid = 'chat_messages'::regclass
  ) THEN
    ALTER TABLE chat_messages
      ADD CONSTRAINT chat_messages_sender_id_profiles_fkey
      FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;
