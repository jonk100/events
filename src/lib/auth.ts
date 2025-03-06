// src/lib/auth.ts
import { supabase } from "./supabase";

/**
 * Signs up a user with email and password.
 */
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Signs in a user with email and password.
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Signs out the current user.
 */
export async function signOut() {
  await supabase.auth.signOut();
}

/**
 * Gets the current user session.
 */
export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}
