-- =========================================================================
-- SYS.2077 // SCHEMA.SQL - SUPABASE PRODUCTION DATABASE SPECIFICATION
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. PROFILES & STAFF TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role_title TEXT NOT NULL DEFAULT 'متخصص فروش // FIXER',
    department TEXT NOT NULL DEFAULT 'FRONT-DESK',
    avatar_url TEXT NOT NULL DEFAULT '/avatars/admin.svg',
    birth_day INT NOT NULL DEFAULT 1,
    birth_month TEXT NOT NULL DEFAULT 'فروردین',
    birth_month_num INT NOT NULL DEFAULT 1,
    birth_year INT NOT NULL DEFAULT 1380,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    is_online BOOLEAN NOT NULL DEFAULT true,
    shift_name TEXT NOT NULL DEFAULT 'شیفت روز',
    phone_number TEXT DEFAULT NULL,
    internal_ext TEXT DEFAULT NULL,
    banked_xp INT NOT NULL DEFAULT 0,
    crowns_count INT NOT NULL DEFAULT 0,
    total_cp INT NOT NULL DEFAULT 0,
    push_subscription JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 2. GAME HIGH SCORES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL,
    high_score INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_game UNIQUE (user_id, game_id)
);

-- -------------------------------------------------------------------------
-- 3. STORE ANNOUNCEMENTS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'عادی',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 3.1 STORE TASKS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assigned_to_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_to_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'عادی',
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 4. FUNCTION & TRIGGER: RECALCULATE LEADERBOARD & CROWNS
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalculate_user_cp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_cp := NEW.banked_xp + (NEW.crowns_count * 500);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalculate_user_cp ON public.profiles;
CREATE TRIGGER trg_recalculate_user_cp
BEFORE INSERT OR UPDATE OF banked_xp, crowns_count ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.recalculate_user_cp();

-- -------------------------------------------------------------------------
-- 5. FUNCTION TO SUBMIT GAME RESULT
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_game_result(
    p_user_id UUID,
    p_game_id TEXT,
    p_session_score INT,
    p_multiplier FLOAT
)
RETURNS JSON AS $$
DECLARE
    v_earned_xp INT;
    v_old_high_score INT := 0;
    v_current_crown_holder UUID;
    v_is_new_high_score BOOLEAN := false;
BEGIN
    -- 1. Calculate earned banked XP
    v_earned_xp := ROUND(p_session_score * p_multiplier);

    -- 2. Add earned XP to user's banked_xp
    UPDATE public.profiles
    SET banked_xp = banked_xp + v_earned_xp
    WHERE id = p_user_id;

    -- 3. Check existing high score for this user
    SELECT high_score INTO v_old_high_score
    FROM public.game_scores
    WHERE user_id = p_user_id AND game_id = p_game_id;

    IF v_old_high_score IS NULL THEN
        INSERT INTO public.game_scores (user_id, game_id, high_score)
        VALUES (p_user_id, p_game_id, p_session_score);
        v_is_new_high_score := true;
    ELSIF p_session_score > v_old_high_score THEN
        UPDATE public.game_scores
        SET high_score = p_session_score, updated_at = NOW()
        WHERE user_id = p_user_id AND game_id = p_game_id;
        v_is_new_high_score := true;
    END IF;

    -- 4. Check global crown holder for this game
    SELECT user_id INTO v_current_crown_holder
    FROM public.game_scores
    WHERE game_id = p_game_id
    ORDER BY high_score DESC, updated_at ASC
    LIMIT 1;

    -- Recalculate crowns for all players
    UPDATE public.profiles p
    SET crowns_count = (
        SELECT COUNT(DISTINCT gs.game_id)
        FROM public.game_scores gs
        WHERE gs.user_id = p.id
          AND gs.high_score = (
              SELECT MAX(high_score)
              FROM public.game_scores
              WHERE game_id = gs.game_id
          )
          AND gs.high_score > 0
    );

    RETURN json_build_object(
        'earned_xp', v_earned_xp,
        'new_high_score', v_is_new_high_score
    );
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public read access to game_scores" ON public.game_scores FOR SELECT USING (true);
CREATE POLICY "Allow public read access to announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Allow public read access to tasks" ON public.tasks FOR SELECT USING (true);

CREATE POLICY "Allow all operations for staff" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations for game scores" ON public.game_scores FOR ALL USING (true);
CREATE POLICY "Allow all operations for announcements" ON public.announcements FOR ALL USING (true);
CREATE POLICY "Allow all operations for tasks" ON public.tasks FOR ALL USING (true);

-- -------------------------------------------------------------------------
-- 7. ONLY DEFAULT ADMIN USER (ALL OTHER USERS ADDED VIA ADMIN PANEL)
-- -------------------------------------------------------------------------
INSERT INTO public.profiles (
    id, username, password_hash, full_name, role_title, department, avatar_url,
    birth_day, birth_month, birth_month_num, birth_year, is_admin, is_online,
    banked_xp, crowns_count, total_cp
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin',
    'cyber2077',
    'مدیر ارشد سیستم ۲۰۷۷',
    'فرمانده عملیات // SYSTEM ADMIN',
    'CORE-SYS',
    '/avatars/admin.svg',
    1, 'فروردین', 1, 1370,
    true, true,
    0, 0, 0
) ON CONFLICT (username) DO NOTHING;

-- Seed Default Announcement
INSERT INTO public.announcements (title, content, priority, is_active)
VALUES (
    'سیستم پرسنلی و آرکید ۲۰۷۷ فعال شد',
    'سیستم پرسنلی و آرکید ۲۰۷۷ فعال شد // آماده تخصیص شیفت و شروع چالش‌های سایبری',
    'PRIORITY.01',
    true
) ON CONFLICT DO NOTHING;
