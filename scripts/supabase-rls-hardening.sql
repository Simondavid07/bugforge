-- BugForge uses a server-only PostgreSQL connection and Manus OAuth; the browser does not access
-- Supabase Data API tables directly. RLS therefore acts as a default-deny guardrail for the exposed
-- public schema without changing the backend authorization model.

ALTER FUNCTION public.set_updated_at() SET search_path = pg_catalog;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."workspaceMembers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."projectMembers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."issueLabels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."issueLinks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."issueActivity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."issueWatchers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."savedViews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."userPreferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."aiRecommendations" ENABLE ROW LEVEL SECURITY;
