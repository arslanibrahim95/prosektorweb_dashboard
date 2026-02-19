-- ============================================================================
-- Website Builder - RLS (Row Level Security) Policies
-- 
-- Bu migration builder tabloları için güvenlik politikalarını ekler
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Component Library RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.component_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS component_library_select ON public.component_library;
CREATE POLICY component_library_select ON public.component_library
    FOR SELECT USING (true);

DROP POLICY IF EXISTS component_library_insert ON public.component_library;
CREATE POLICY component_library_insert ON public.component_library
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS component_library_update ON public.component_library;
CREATE POLICY component_library_update ON public.component_library
    FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS component_library_delete ON public.component_library;
CREATE POLICY component_library_delete ON public.component_library
    FOR DELETE USING (auth.uid() IS NOT NULL AND is_system = false);

-- ---------------------------------------------------------------------------
-- Component Styles RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.component_styles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS component_styles_select ON public.component_styles;
CREATE POLICY component_styles_select ON public.component_styles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS component_styles_insert ON public.component_styles;
CREATE POLICY component_styles_insert ON public.component_styles
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS component_styles_update ON public.component_styles;
CREATE POLICY component_styles_update ON public.component_styles
    FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS component_styles_delete ON public.component_styles;
CREATE POLICY component_styles_delete ON public.component_styles
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- ---------------------------------------------------------------------------
-- Page Layouts RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.page_layouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS page_layouts_select ON public.page_layouts;
CREATE POLICY page_layouts_select ON public.page_layouts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS page_layouts_insert ON public.page_layouts;
CREATE POLICY page_layouts_insert ON public.page_layouts
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS page_layouts_update ON public.page_layouts;
CREATE POLICY page_layouts_update ON public.page_layouts
    FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS page_layouts_delete ON public.page_layouts;
CREATE POLICY page_layouts_delete ON public.page_layouts
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- ---------------------------------------------------------------------------
-- Layout History RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.layout_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS layout_history_select ON public.layout_history;
CREATE POLICY layout_history_select ON public.layout_history
    FOR SELECT USING (true);

DROP POLICY IF EXISTS layout_history_insert ON public.layout_history;
CREATE POLICY layout_history_insert ON public.layout_history
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS layout_history_delete ON public.layout_history;
CREATE POLICY layout_history_delete ON public.layout_history
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Force RLS
ALTER TABLE public.component_library FORCE ROW LEVEL SECURITY;
ALTER TABLE public.component_styles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.page_layouts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.layout_history FORCE ROW LEVEL SECURITY;
