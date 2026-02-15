-- ============================================================================
-- Website Builder - Component Library & Layouts
-- 
-- Bu migration website builder için gerekli bileşen kütüphanesi ve sayfa 
-- düzeni tablolarını oluşturur.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Component Library - Builder bileşenleri için şablonlar
-- ---------------------------------------------------------------------------

CREATE TABLE public.component_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Bileşen bilgileri
    name VARCHAR(255) NOT NULL,                    -- "Hero Section", "Contact Form"
    category VARCHAR(100) NOT NULL,               -- "hero", "content", "form", "navigation", "layout", "media"
    component_type VARCHAR(100) NOT NULL,         -- "hero", "text", "image", "gallery", "form", "button", "nav", "footer", "container", "grid", "flex"
    
    -- Bileşen şeması (properties panel için)
    schema JSONB NOT NULL DEFAULT '{}'::jsonb,   -- Düzenlenebilir özellikler şeması
    
    -- Varsayılan değerler
    default_props JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Görsel önizleme
    thumbnail_url TEXT,
    icon VARCHAR(100),
    
    -- Durum
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_system BOOLEAN NOT NULL DEFAULT false,    -- Sistem bileşeni (silinemez)
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT component_library_tenant_name_unique UNIQUE (tenant_id, name),
    CONSTRAINT component_library_category_check CHECK (
        category IN ('hero', 'content', 'form', 'navigation', 'layout', 'media', 'custom')
    )
);

CREATE INDEX idx_component_library_tenant ON public.component_library(tenant_id);
CREATE INDEX idx_component_library_category ON public.component_library(category);
CREATE INDEX idx_component_library_type ON public.component_library(component_type);

CREATE TRIGGER trg_component_library_updated_at
BEFORE UPDATE ON public.component_library
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Component Styles - Bileşen stilleri/presetleri
-- ---------------------------------------------------------------------------

CREATE TABLE public.component_styles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    component_library_id UUID NOT NULL REFERENCES public.component_library(id) ON DELETE CASCADE,
    
    -- Stil bilgileri
    name VARCHAR(255) NOT NULL,                  -- "Modern", "Classic", "Minimal", "Bold"
    description TEXT,
    
    -- Stil verileri (CSS benzeri)
    style_data JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { colors: {}, typography: {}, spacing: {}, effects: {} }
    
    -- Önizleme
    preview_image_url TEXT,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT component_styles_tenant_component_unique UNIQUE (tenant_id, component_library_id, name)
);

CREATE INDEX idx_component_styles_component ON public.component_styles(component_library_id);

CREATE TRIGGER trg_component_styles_updated_at
BEFORE UPDATE ON public.component_styles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Page Layouts - Sayfa düzeni verileri (builder state)
-- ---------------------------------------------------------------------------

CREATE TABLE public.page_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    page_id UUID NOT NULL,
    
    -- Layout verileri (bileşen tree + konfigürasyon)
    layout_data JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { components: [], settings: {}, breakpoints: {} }
    
    -- Düzen meta verileri
    version INTEGER NOT NULL DEFAULT 1,
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    
    -- Önizleme
    preview_data JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT page_layouts_tenant_page_unique UNIQUE (tenant_id, page_id),
    CONSTRAINT page_layouts_tenant_id_id_unique UNIQUE (tenant_id, id),
    
    FOREIGN KEY (tenant_id, page_id) 
        REFERENCES public.pages(tenant_id, id) ON DELETE CASCADE
);

CREATE INDEX idx_page_layouts_page ON public.page_layouts(page_id);
CREATE INDEX idx_page_layouts_tenant ON public.page_layouts(tenant_id);

CREATE TRIGGER trg_page_layouts_updated_at
BEFORE UPDATE ON public.page_layouts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Layout History - Düzen değişiklik geçmişi (undo/redo için)
-- ---------------------------------------------------------------------------

CREATE TABLE public.layout_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    page_layout_id UUID NOT NULL REFERENCES public.page_layouts(id) ON DELETE CASCADE,
    
    -- History verileri
    layout_data JSONB NOT NULL,
    action VARCHAR(50) NOT NULL,                 -- "create", "update", "delete", "move", "style"
    description TEXT,
    
    -- Snapshot
    version INTEGER NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT layout_history_tenant_id_unique UNIQUE (tenant_id, id)
);

CREATE INDEX idx_layout_history_page_layout ON public.layout_history(page_layout_id);
CREATE INDEX idx_layout_history_created ON public.layout_history(created_at DESC);

-- ---------------------------------------------------------------------------
-- Navigation Menus - Menü yapıları
-- ---------------------------------------------------------------------------

-- NOT: Menus tablosu zaten var (0001_init.sql), burada sadece builder 
-- için gerekli alanları ekliyoruz (menu_items yapısı)

ALTER TABLE public.menus 
ADD COLUMN IF NOT EXISTS menu_data JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_main_menu BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- Seed Data - Varsayılan bileşenler
-- ---------------------------------------------------------------------------

DO $$
DECLARE
    v_tenant_id UUID;
    v_tenant_record RECORD;
BEGIN
    -- Sistem bileşenlerini ekle
    -- Bu bileşenler tüm tenantlar için kullanılabilir
    
    INSERT INTO public.component_library (
        tenant_id, name, category, component_type, schema, default_props, is_system, icon
    )
    SELECT 
        t.id, 'Hero Section', 'hero', 'hero',
        '{"title": {"type": "text", "label": "Başlık", "required": true}, "subtitle": {"type": "textarea", "label": "Alt Başlık"}, "backgroundImage": {"type": "image", "label": "Arka Plan Resmi"}, "backgroundColor": {"type": "color", "label": "Arka Plan Rengi"}, "textAlign": {"type": "select", "label": "Metin Hizalama", "options": ["left", "center", "right"]}, "buttonText": {"type": "text", "label": "Buton Metni"}, "buttonUrl": {"type": "url", "label": "Buton Linki"}, "buttonVariant": {"type": "select", "label": "Buton Tipi", "options": ["primary", "secondary", "outline"]}}'::jsonb,
        '{"title": "Hero Başlığı", "subtitle": "Bu bir alt başlık metnidir", "textAlign": "center", "buttonText": "Butona Tıkla", "buttonVariant": "primary", "padding": {"top": 80, "bottom": 80}}'::jsonb,
        true, 'LayoutTemplate'
    FROM public.tenants t
    ON CONFLICT (tenant_id, name) DO NOTHING;

    INSERT INTO public.component_library (
        tenant_id, name, category, component_type, schema, default_props, is_system, icon
    )
    SELECT 
        t.id, 'Navigation Bar', 'navigation', 'nav',
        '{"logo": {"type": "image", "label": "Logo"}, "logoText": {"type": "text", "label": "Logo Metni"}, "links": {"type": "array", "label": "Bağlantılar", "itemSchema": {"label": {"type": "text"}, "url": {"type": "text"}}}, "isSticky": {"type": "boolean", "label": "Yapışkan Menü"}, "transparentOnTop": {"type": "boolean", "label": "Üstte Şeffaf"}}'::jsonb,
        '{"links": [], "isSticky": false, "transparentOnTop": true}'::jsonb,
        true, 'Navigation'
    FROM public.tenants t
    ON CONFLICT (tenant_id, name) DO NOTHING;

    INSERT INTO public.component_library (
        tenant_id, name, category, component_type, schema, default_props, is_system, icon
    )
    SELECT 
        t.id, 'Footer', 'navigation', 'footer',
        '{"companyName": {"type": "text", "label": "Şirket Adı"}, "description": {"type": "textarea", "label": "Açıklama"}, "columns": {"type": "array", "label": "Sütunlar", "itemSchema": {"title": {"type": "text"}, "links": {"type": "array"}}}, "socialLinks": {"type": "array", "label": "Sosyal Medya"}, "copyrightText": {"type": "text", "label": "Telif Hakkı"}}'::jsonb,
        '{"columns": [], "copyrightText": "© 2024 Tüm hakları saklıdır."}'::jsonb,
        true, 'Footer'
    FROM public.tenants t
    ON CONFLICT (tenant_id, name) DO NOTHING;

    INSERT INTO public.component_library (
        tenant_id, name, category, component_type, schema, default_props, is_system, icon
    )
    SELECT 
        t.id, 'Text Block', 'content', 'text',
        '{"content": {"type": "rich text", "label": "İçerik"}, "textAlign": {"type": "select", "label": "Hizalama", "options": ["left", "center", "right", "justify"]}, "fontSize": {"type": "number", "label": "Yazı Boyutu"}, "fontWeight": {"type": "select", "label": "Kalınlık", "options": ["normal", "bold", "lighter"]}, "color": {"type": "color", "label": "Metin Rengi"}}'::jsonb,
        '{"content": "Metin içeriği buraya girilir...", "textAlign": "left", "fontSize": 16}'::jsonb,
        true, 'Type'
    FROM public.tenants t
    ON CONFLICT (tenant_id, name) DO NOTHING;

    INSERT INTO public.component_library (
        tenant_id, name, category, component_type, schema, default_props, is_system, icon
    )
    SELECT 
        t.id, 'Image', 'media', 'image',
        '{"src": {"type": "image", "label": "Resim"}, "alt": {"type": "text", "label": "Alternatif Metin"}, "width": {"type": "number", "label": "Genişlik"}, "height": {"type": "number", "label": "Yükseklik"}, "objectFit": {"type": "select", "label": "Resim Doldurma", "options": ["cover", "contain", "fill"]}, "borderRadius": {"type": "number", "label": "Köşe Yuvarlama"}, "shadow": {"type": "select", "label": "Gölge", "options": ["none", "sm", "md", "lg"]}}'::jsonb,
        '{"width": 800, "height": 600, "objectFit": "cover", "borderRadius": 0, "shadow": "none"}'::jsonb,
        true, 'Image'
    FROM public.tenants t
    ON CONFLICT (tenant_id, name) DO NOTHING;

    INSERT INTO public.component_library (
        tenant_id, name, category, component_type, schema, default_props, is_system, icon
    )
    SELECT 
        t.id, 'Gallery', 'media', 'gallery',
        '{"images": {"type": "array", "label": "Resimler", "itemSchema": {"src": {"type": "image"}, "alt": {"type": "text"}}}, "columns": {"type": "number", "label": "Sütun Sayısı"}, "gap": {"type": "number", "label": "Boşluk"}, "aspectRatio": {"type": "select", "label": "En Boy Oranı", "options": ["1:1", "4:3", "16:9", "3:2"]}, "lightbox": {"type": "boolean", "label": "Lightbox"}}'::jsonb,
        '{"images": [], "columns": 3, "gap": 16, "aspectRatio": "4:3", "lightbox": true}'::jsonb,
        true, 'Images'
    FROM public.tenants t
    ON CONFLICT (tenant_id, name) DO NOTHING;

    INSERT INTO public.component_library (
        tenant_id, name, category, component_type, schema, default_props, is_system, icon
    )
    SELECT 
        t.id, 'Button', 'content', 'button',
        '{"text": {"type": "text", "label": "Buton Metni"}, "url": {"type": "url", "label": "Link"}, "variant": {"type": "select", "label": "Tip", "options": ["primary", "secondary", "outline", "ghost", "link"]}, "size": {"type": "select", "label": "Boyut", "options": ["sm", "md", "lg"]}, "fullWidth": {"type": "boolean", "label": "Tam Genişlik"}, "icon": {"type": "text", "label": "İkon"}}'::jsonb,
        '{"text": "Butona Tıkla", "variant": "primary", "size": "md", "fullWidth": false}'::jsonb,
        true, 'MousePointerClick'
    FROM public.tenants t
    ON CONFLICT (tenant_id, name) DO NOTHING;

    INSERT INTO public.component_library (
        tenant_id, name, category, component_type, schema, default_props, is_system, icon
    )
    SELECT 
        t.id, 'Contact Form', 'form', 'form',
        '{"fields": {"type": "array", "label": "Alanlar", "itemSchema": {"type": {"type": "select", "options": ["text", "email", "textarea", "select", "checkbox"]}, "label": {"type": "text"}, "placeholder": {"type": "text"}, "required": {"type": "boolean"}}}, "submitButtonText": {"type": "text", "label": "Gönder Buton Metni"}, "successMessage": {"type": "text", "label": "Başarı Mesajı"}, "redirectUrl": {"type": "url", "label": "Yönlendirme URL"}}'::jsonb,
        '{"fields": [{"type": "text", "label": "Ad", "required": true}, {"type": "email", "label": "E-posta", "required": true}, {"type": "textarea", "label": "Mesaj", "required": true}], "submitButtonText": "Gönder", "successMessage": "Mesajınız başarıyla gönderildi!"}'::jsonb,
        true, 'FileInput'
    FROM public.tenants t
    ON CONFLICT (tenant_id, name) DO NOTHING;

    INSERT INTO public.component_library (
        tenant_id, name, category, component_type, schema, default_props, is_system, icon
    )
    SELECT 
        t.id, 'Container', 'layout', 'container',
        '{"backgroundColor": {"type": "color", "label": "Arka Plan Rengi"}, "backgroundImage": {"type": "image", "label": "Arka Plan Resmi"}, "padding": {"type": "object", "label": "İç Boşluk", "properties": {"top": {"type": "number"}, "right": {"type": "number"}, "bottom": {"type": "number"}, "left": {"type": "number"}}}, "margin": {"type": "object", "label": "Dış Boşluk"}, "borderRadius": {"type": "number", "label": "Köşe Yuvarlama"}, "maxWidth": {"type": "select", "label": "Maksimum Genişlik", "options": ["100%", "1280px", "1024px", "768px", "640px"]}, "fullHeight": {"type": "boolean", "label": "Tam Yükseklik"}}'::jsonb,
        '{"padding": {"top": 32, "right": 16, "bottom": 32, "left": 16}, "maxWidth": "1280px", "fullHeight": false}'::jsonb,
        true, 'Square'
    FROM public.tenants t
    ON CONFLICT (tenant_id, name) DO NOTHING;

    INSERT INTO public.component_library (
        tenant_id, name, category, component_type, schema, default_props, is_system, icon
    )
    SELECT 
        t.id, 'Grid', 'layout', 'grid',
        '{"columns": {"type": "number", "label": "Sütun Sayısı", "min": 1, "max": 6}, "gap": {"type": "number", "label": "Boşluk"}, "gapX": {"type": "number", "label": "Yatay Boşluk"}, "gapY": {"type": "number", "label": "Dikey Boşluk"}, "alignItems": {"type": "select", "label": "Dikey Hizalama", "options": ["start", "center", "end", "stretch"]}, "justifyContent": {"type": "select", "label": "Yatay Hizalama", "options": ["start", "center", "end", "between", "around"]}}'::jsonb,
        '{"columns": 2, "gap": 24, "alignItems": "start", "justifyContent": "start"}'::jsonb,
        true, 'LayoutGrid'
    FROM public.tenants t
    ON CONFLICT (tenant_id, name) DO NOTHING;

    INSERT INTO public.component_library (
        tenant_id, name, category, component_type, schema, default_props, is_system, icon
    )
    SELECT 
        t.id, 'Spacer', 'layout', 'spacer',
        '{"height": {"type": "number", "label": "Yükseklik (px)"}}'::jsonb,
        '{"height": 32}'::jsonb,
        true, 'MoveVertical'
    FROM public.tenants t
    ON CONFLICT (tenant_id, name) DO NOTHING;

    RAISE NOTICE 'Builder component library seeded successfully!';
END $$;
