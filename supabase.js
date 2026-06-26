// js/supabase.js
const SUPABASE_URL = "https://rlfywkvyjoydpbvprtdt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnl3a3Z5am95ZHBidnBydGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzQ2MTEsImV4cCI6MjA5NzkxMDYxMX0.oF3BnxQD0AE_47ypbIA39iV0FGICbXZJPwOgiZTcjMk";

const _db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window._db = _db;