// Même projet Supabase que les apps Flashcards et Suivi élèves (tables préfixées labo_).
// Cette clé est publique : elle ne permet que de LIRE. Toute écriture passe par
// des fonctions qui vérifient le code des profs (voir sql/01-structure.sql).
export const SUPABASE_URL = 'https://iuharjafrhwzhhggwzgy.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1aGFyamFmcmh3emhoZ2d3emd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MjMzMTgsImV4cCI6MjA5NjM5OTMxOH0.ieZT0hpGMcPQsJm6IjufzsZelZW3i25VSKhe_F8tqHk';
