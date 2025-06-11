/*
  # Fix profiles table RLS policies

  1. Security Updates
    - Drop existing restrictive policies on profiles table
    - Add proper INSERT policy for user registration
    - Add proper SELECT policy for profile access
    - Add proper UPDATE policy for profile updates

  2. Changes
    - Allow authenticated users to insert profiles with their own auth.uid()
    - Allow users to select their own profile data
    - Allow users to update their own profile data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Create new policies with proper permissions
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);