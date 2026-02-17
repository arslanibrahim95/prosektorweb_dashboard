# Gelecek Sprint Onboarding Özellikleri - Teknik Gereksinimler ve İmplementasyon Planı

## Özet

Bu doküman, ProsektorWeb dashboard için geliştirilecek ileri düzey onboarding özelliklerinin teknik gereksinimlerini, veritabanı şemalarını, API tasarımlarını ve implementasyon yol haritasını detaylandırmaktadır.

---

## Özellik Öncelik Sıralaması

| Öncelik | Özellik | Tahmini Sprint | Etki |
|---------|---------|----------------|------|
| P1 | Onboarding Checklist (Dashboard) | 1-2 | Yüksek |
| P2 | Role-Based Personalized Onboarding | 2-3 | Yüksek |
| P3 | Interactive Product Tour | 3-4 | Orta |
| P4 | Onboarding Tutorial Video | 4-5 | Orta |
| P5 | AI-Powered Onboarding Assistant | 5-6 | Düşük |

---

## 1. Onboarding Checklist (Dashboard Widget)

### 1.1 Genel Bakış

Dashboard'da kullanıcıların tamamlaması gereken görevleri listeleyen bir widget. Kullanıcı platforma alışana kadar rehberlik eder.

### 1.2 Tech Stack

- **Frontend:** React, Tailwind CSS, Radix UI
- **Backend:** Next.js API Routes, Supabase
- **State Management:** Zustand
- **Animations:** Framer Motion

### 1.3 Veritabanı Şeması

```sql
-- Checklist Templates (Admin tarafından yönetilen şablonlar)
CREATE TABLE onboarding_checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklist Items
CREATE TABLE onboarding_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES onboarding_checklist_templates(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    action_type VARCHAR(50) NOT NULL, -- 'navigate', 'form', 'api_call', 'external_link'
    action_data JSONB, -- { path: '/settings', method: 'POST', etc. }
    order_index INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN DEFAULT false,
    estimated_minutes INTEGER DEFAULT 5,
    icon VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Progress (Kullanıcı başına ilerleme)
CREATE TABLE onboarding_user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    item_id UUID REFERENCES onboarding_checklist_items(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'skipped'
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- User Onboarding Session (Genel oturum takibi)
CREATE TABLE onboarding_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    completion_percentage INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    UNIQUE(user_id, tenant_id)
);
```

### 1.4 API Tasarımı

```typescript
// GET /api/onboarding/checklist
// Kullanıcının checklist'ini döner

interface ChecklistResponse {
  session: {
    id: string;
    startedAt: string;
    completionPercentage: number;
    isCompleted: boolean;
  };
  items: {
    id: string;
    title: string;
    description: string;
    actionType: string;
    actionData: Record<string, unknown>;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    completedAt: string | null;
    estimatedMinutes: number;
    icon: string | null;
  }[];
  statistics: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
  };
}

// POST /api/onboarding/checklist/:itemId/complete
// Item'ı tamamlandı olarak işaretler

interface CompleteItemRequest {
  status: 'completed' | 'skipped';
}

// WebSocket event: checklist.updated
interface ChecklistUpdatedEvent {
  type: 'progress_changed' | 'item_completed' | 'session_completed';
  data: {
    userId: string;
    completionPercentage: number;
    completedItemId?: string;
  };
}
```

### 1.5 Frontend Component Yapısı

```
components/onboarding/
├── checklist/
│   ├── OnboardingChecklistWidget.tsx    # Ana widget
│   ├── ChecklistItem.tsx                 # Tekil item
│   ├── ChecklistProgress.tsx              # İlerleme çubuğu
│   ├── ChecklistCategory.tsx              # Kategori gruplama
│   └── ChecklistCompletionModal.tsx       # Tamamlama modalı
└── hooks/
    └── useOnboardingChecklist.ts          # Veri hook'u
```

### 1.6 Implementasyon Adımları

1. Veritabanı tablolarını oluştur (migration)
2. Admin paneli için checklist template yönetimi ekle
3. API endpoint'lerini implement et
4. Frontend widget'ını geliştir
5. İlerleme durumu WebSocket real-time güncellemeleri
6. Analytics entegrasyonu

---

## 2. Role-Based Personalized Onboarding

### 2.1 Genel Bakış

Kullanıcı rolüne göre özelleştirilmiş onboarding akışları. Her rol (admin, editor, viewer, HR manager vb.) için farklı adımlar ve içerikler.

### 2.2 Tech Stack

- **Frontend:** React, Tailwind CSS, i18next (çoklu dil desteği)
- **Backend:** Next.js API Routes, Supabase
- **Role Management:** Mevcut permission sistemi kullanılacak

### 2.3 Kullanıcı Rolleri ve Onboarding Akışları

```
Rol: Admin
├── Hoş geldiniz videosu
├── Organizasyon oluşturma (zorunlu)
├── İlk sayfa oluşturma
├── Domain yapılandırma
├── Ekip davet etme
├── Modül aktivasyonu
└── İleri düzey ayarlar

Rol: Editor
├── Hoş geldiniz videosu
├── Dashboard'a giriş
├── İçerik yönetimi turu
├── Sayfa düzenleme
├── Medya kütüphanesi
└── Yardım & Destek

Rol: HR Manager
├── Hoş geldiniz videosu
├── İş ilanı oluşturma
├── Başvuru yönetimi
├── Teklif şablonları
└── Ekip koordinasyonu

Rol: Viewer
├── Hoş geldiniz videosu
├── Dashboard turu
├── Bildirimler
└── Profil ayarları
```

### 2.4 Veritabanı Şeması

```sql
-- Role-based Onboarding Flows
CREATE TABLE onboarding_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role)
);

-- Flow Steps
CREATE TABLE onboarding_flow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID REFERENCES onboarding_flows(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(50) NOT NULL, -- 'video', 'form', 'tour', 'quiz', 'task'
    content_data JSONB, -- { videoUrl: '', formId: '', tourId: '', etc. }
    order_index INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    estimated_minutes INTEGER DEFAULT 5,
    conditions JSONB, -- { role: 'admin', hasFeature: 'hr', etc. }
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Flow Progress
CREATE TABLE onboarding_user_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    flow_id UUID REFERENCES onboarding_flows(id) ON DELETE SET NULL,
    current_step_index INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    is_completed BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, tenant_id)
);

-- User Step Progress
CREATE TABLE onboarding_user_step_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_flow_id UUID REFERENCES onboarding_user_flows(id) ON DELETE CASCADE,
    step_id UUID REFERENCES onboarding_flow_steps(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    quiz_score INTEGER,
    attempt_count INTEGER DEFAULT 0,
    UNIQUE(user_flow_id, step_id)
);
```

### 2.5 API Tasarımı

```typescript
// GET /api/onboarding/flow
// Kullanıcının rolüne göre uygun flow'u döner

interface GetFlowResponse {
  flow: {
    id: string;
    name: string;
    description: string;
    totalSteps: number;
    estimatedMinutes: number;
  };
  currentProgress: {
    stepIndex: number;
    completedSteps: number;
    isCompleted: boolean;
    startedAt: string;
  };
  steps: {
    id: string;
    title: string;
    description: string;
    contentType: 'video' | 'form' | 'tour' | 'quiz' | 'task';
    contentData: Record<string, unknown>;
    status: 'pending' | 'current' | 'completed' | 'skipped';
    isRequired: boolean;
    estimatedMinutes: number;
  }[];
}

// POST /api/onboarding/flow/:stepId/complete
interface CompleteStepRequest {
  status: 'completed' | 'skipped';
  quizAnswers?: Record<string, unknown>;
  taskData?: Record<string, unknown>;
}

// POST /api/onboarding/flow/select
// Rol seçimi yapılır (ilk girişte)
interface SelectFlowRequest {
  role: 'admin' | 'editor' | 'viewer' | 'hr_manager' | 'sales';
}
```

### 2.6 Frontend Component Yapısı

```
components/onboarding/
├── role-based/
│   ├── RoleSelectionModal.tsx            # İlk rol seçimi
│   ├── FlowNavigator.tsx                  # Adım navigasyonu
│   ├── FlowProgress.tsx                    # Genel ilerleme
│   ├── StepContent/
│   │   ├── VideoStep.tsx                   # Video içerik
│   │   ├── FormStep.tsx                    # Form içerik
│   │   ├── TourStep.tsx                    # Tur içerik
│   │   ├── QuizStep.tsx                    # Quiz/Soru
│   │   └── TaskStep.tsx                    # Görev içerik
│   └── CompletionCertificate.tsx           # Tamamlama belgesi
└── hooks/
    └── useOnboardingFlow.ts
```

### 2.7 Implementasyon Adımları

1. Veritabanı şemasını oluştur
2. Admin paneli için flow yönetimi ekle
3. İlk girişte rol seçimi modal'ı ekle
4. Role-based API endpoint'lerini implement et
5. Video, form, tour, quiz step componentleri
6. İlerleme takibi ve analytics
7. Tamamlama belgesi/sertifikası

---

## 3. Interactive Product Tour

### 3.1 Genel Bakış

Dashboard içinde interaktif gezinme rehberi. Elementleri highlight eden, tooltip gösteren ve kullanıcıyı adım adım yönlendiren sistem.

### 3.2 Tech Stack

- **Frontend:** React, Framer Motion, Tippy.js (tooltip)
- **State:** Zustand (persist middleware ile localStorage)
- **Analytics:** PostHog/Mixpanel event takibi

### 3.3 Veritabanı Şeması

```sql
-- Tour Definitions
CREATE TABLE onboarding_tours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_page VARCHAR(100), -- '/' , '/settings', etc.
    trigger_condition JSONB, -- { role: 'admin', hasTenants: true }
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tour Steps
CREATE TABLE onboarding_tour_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID REFERENCES onboarding_tours(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    element_selector VARCHAR(255) NOT NULL, -- '#sidebar-settings'
    placement VARCHAR(20) DEFAULT 'bottom', -- 'top', 'bottom', 'left', 'right'
    title VARCHAR(255) NOT NULL,
    content TEXT,
    media_url VARCHAR(500),
    media_type VARCHAR(20), -- 'image', 'video'
    action_type VARCHAR(20), -- 'next', 'click', 'wait', 'complete'
    action_selector VARCHAR(255),
    delay_ms INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Tour Progress
CREATE TABLE onboarding_user_tours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tour_id UUID REFERENCES onboarding_tours(id) ON DELETE CASCADE,
    current_step_index INTEGER DEFAULT 0,
    completed_steps INTEGER[] DEFAULT '{}',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    is_skipped BOOLEAN DEFAULT false,
    is_completed BOOLEAN DEFAULT false,
    interaction_data JSONB DEFAULT '{}',
    UNIQUE(user_id, tour_id)
);
```

### 3.4 API Tasarımı

```typescript
// GET /api/onboarding/tours?page=/dashboard
// Mevcut sayfa için turları döner

interface GetToursResponse {
  tours: {
    id: string;
    name: string;
    description: string;
    steps: {
      id: string;
      elementSelector: string;
      placement: 'top' | 'bottom' | 'left' | 'right';
      title: string;
      content: string;
      mediaUrl?: string;
      mediaType?: 'image' | 'video';
      actionType: 'next' | 'click' | 'wait' | 'complete';
      actionSelector?: string;
    }[];
    userProgress: {
      currentStepIndex: number;
      completedSteps: number[];
      isCompleted: boolean;
      isSkipped: boolean;
    };
  }[];
  shouldAutoStart: boolean; -- Kullanıcı daha önce turu tamamlamamışsa
}

// POST /api/onboarding/tours/:tourId/progress
interface UpdateTourProgressRequest {
  currentStepIndex: number;
  action: 'next' | 'previous' | 'skip' | 'complete';
  interactionData?: Record<string, unknown>;
}
```

### 3.5 Frontend Component Yapısı

```
components/onboarding/
├── tour/
│   ├── TourController.tsx                 # Tur yönetimi
│   ├── TourOverlay.tsx                    # Background overlay
│   ├── TourHighlight.tsx                  # Element highlight
│   ├── TourTooltip.tsx                    # Tooltip bileşeni
│   ├── TourSpotlight.tsx                  # Spotlight effect
│   ├── TourControls.tsx                   # Skip/Next/Previous
│   ├── TourMediaViewer.tsx                # Resim/Video viewer
│   └── TourCompletionModal.tsx           # Tamamlama modalı
└── hooks/
    ├── useTour.ts                         # Tur hook
    └── useTourProgress.ts                 # İlerleme hook
```

### 3.6 Component Özellikleri

```typescript
// TourTooltip Props
interface TourTooltipProps {
  step: TourStep;
  isActive: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
}

// Highlight Effect
interface TourHighlightProps {
  targetSelector: string;
  isActive: boolean;
  padding: number;
  borderRadius: number;
  animation: 'pulse' | 'bounce' | 'none';
}

// Spotlight Effect  
interface TourSpotlightProps {
  targetSelector: string;
  isActive: boolean;
  maskColor: string;
  maskOpacity: number;
  clickThrough: boolean;
}
```

### 3.7 Implementasyon Adımları

1. Tour veritabanı şeması
2. Tour yönetim API'leri
3. Highlight, tooltip, spotlight componentleri
4. Tour controller ve state management
5. Element selector tracking
6. Analytics entegrasyonu
7. Auto-start ve trigger conditions

---

## 4. Onboarding Tutorial Video Sistemi

### 4.1 Genel Bakış

Kullanıcı rolüne göre özelleştirilmiş video içerik yönetim sistemi. Video yükleme, dönüştürme ve CDN entegrasyonu.

### 4.2 Tech Stack

- **Video Processing:** Mux (video hosting/transcoding) veya Cloudflare Stream
- **Storage:** Supabase Storage veya AWS S3
- **CDN:** Cloudflare CDN veya Mux Stream
- **Frontend:** React Player, Video.js

### 4.3 Veritabanı Şeması

```sql
-- Video Categories
CREATE TABLE onboarding_video_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Videos
CREATE TABLE onboarding_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES onboarding_video_categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_seconds INTEGER NOT NULL,
    
    -- Video Sources
    original_url VARCHAR(500),
    processed_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    hls_url VARCHAR(500), -- Adaptive streaming
    
    -- Video Metadata
    width INTEGER,
    height INTEGER,
    file_size_bytes BIGINT,
    mime_type VARCHAR(50),
    
    -- Playback Settings
    auto_play BOOLEAN DEFAULT false,
    show_controls BOOLEAN DEFAULT true,
    loop_video BOOLEAN DEFAULT false,
    
    -- Localization
    locale VARCHAR(10) DEFAULT 'tr',
    
    -- Status
    status VARCHAR(20) DEFAULT 'processing', -- 'processing', 'ready', 'failed'
    processing_error TEXT,
    
    -- Usage
    view_count INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Access (Role-based)
CREATE TABLE onboarding_video_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES onboarding_videos(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    is_required BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    UNIQUE(video_id, role)
);

-- User Video Progress
CREATE TABLE onboarding_user_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES onboarding_videos(id) ON DELETE CASCADE,
    watched_seconds INTEGER DEFAULT 0,
    completion_percentage INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    last_watched_at TIMESTAMPTZ,
    UNIQUE(user_id, video_id)
);
```

### 4.4 API Tasarımı

```typescript
// GET /api/onboarding/videos
// Rol bazlı videoları döner

interface GetVideosResponse {
  categories: {
    id: string;
    name: string;
    videos: {
      id: string;
      title: string;
      description: string;
      durationSeconds: number;
      thumbnailUrl: string;
      isRequired: boolean;
      userProgress: {
        watchedSeconds: number;
        completionPercentage: number;
        isCompleted: boolean;
      };
    }[];
  }[];
  totalDuration: number;
  completedDuration: number;
}

// GET /api/admin/onboarding/videos
// Admin: Video yönetimi

interface AdminVideoResponse {
  id: string;
  title: string;
  status: 'processing' | 'ready' | 'failed';
  durationSeconds: number;
  viewCount: number;
  completionRate: number;
  createdAt: string;
}

// POST /api/admin/onboarding/videos/upload
// Video upload (presigned URL)

interface UploadVideoRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
}

interface UploadVideoResponse {
  uploadUrl: string;
  videoId: string;
  processingStatus: string;
}

// Webhooks (Mux/Cloudflare Stream)
POST /api/webhooks/video-processing
{
  "event": "video.processing.completed",
  "data": {
    "videoId": "mux-xxx",
    "playbackId": "mux-xxx",
    "thumbnailUrl": "...",
    "hlsUrl": "..."
  }
}
```

### 4.5 Frontend Component Yapısı

```
components/onboarding/
├── video/
│   ├── VideoPlayer.tsx                    # Ana player
│   ├── VideoThumbnail.tsx                 # Thumbnail grid
│   ├── VideoProgressBar.tsx               # İlerleme çubuğu
│   ├── VideoCategoryList.tsx              # Kategori listesi
│   ├── VideoCompletionBadge.tsx           # Tamamlandı rozeti
│   └── VideoUploader.tsx                   # Admin upload
├── hooks/
│   ├── useVideoPlayer.ts
│   └── useVideoProgress.ts
```

### 4.6 Video Processing Pipeline

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────┐
│  Upload     │───▶│ Transcoding  │───▶│ Thumbnail   │───▶│ CDN     │
│  (S3/Mux)   │    │ (Mux/Cloud) │    │ Generation  │    │ Cache   │
└─────────────┘    └──────────────┘    └─────────────┘    └─────────┘
                        │
                        ▼
                 ┌─────────────┐
                 │   Webhook   │
                 │  Notifier   │
                 └─────────────┘
```

### 4.7 Implementasyon Adımları

1. Video storage ve CDN entegrasyonu
2. Upload API ve presigned URL sistemi
3. Webhook handler (processing events)
4. Video player component
5. Category ve video yönetim admin paneli
6. User progress tracking
7. Analytics ve completion rate

---

## 5. AI-Powered Onboarding Assistant

### 5.1 Genel Bakış

Chat tabanlı AI asistan. Kullanıcı sorularına context-aware yanıtlar, dokümantasyon bazlı Q&A, ve kişiselleştirilmiş rehberlik.

### 5.2 Tech Stack

- **AI:** OpenAI GPT-4 API veya Anthropic Claude
- **Vector DB:** Pinecone veya Supabase pgvector
- **Chat UI:** Vercel AI SDK veya React Chatbot
- **Backend:** Next.js API Routes

### 5.3 Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Chat Widget  │  │ Context Bar  │  │ Suggestion Panel     │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ /api/chat   │  │ /api/search  │  │ /api/embeddings      │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌───────────────┐  ┌─────────────────────┐
│  OpenAI/Claude │  │  Pinecone    │  │  Supabase         │
│  (LLM)          │  │  (Vector DB)│  │  (User Context)   │
└─────────────────┘  └───────────────┘  └─────────────────────┘
```

### 5.4 Veritabanı Şeması

```sql
-- Chat Sessions
CREATE TABLE onboarding_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    message_count INTEGER DEFAULT 0,
    satisfaction_score INTEGER, -- 1-5
    is_completed BOOLEAN DEFAULT false
);

-- Chat Messages
CREATE TABLE onboarding_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES onboarding_chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    context_data JSONB DEFAULT '{}', -- { currentPage: '/settings', userRole: 'admin' }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tokens_used INTEGER,
    model VARCHAR(50)
);

-- Knowledge Base Articles (for RAG)
CREATE TABLE onboarding_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    tags TEXT[],
    locale VARCHAR(10) DEFAULT 'tr',
    embedding VECTOR(1536), -- OpenAI ada-002 embedding
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQ Questions
CREATE TABLE onboarding_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    keywords TEXT[],
    locale VARCHAR(10) DEFAULT 'tr',
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.5 API Tasarımı

```typescript
// POST /api/onboarding/chat
// Chat message gönderir

interface ChatRequest {
  message: string;
  context?: {
    currentPage: string;
    userRole: string;
    onboardingStep?: string;
    completedSteps?: string[];
  };
  sessionId?: string; // Devam eden conversation için
}

interface ChatResponse {
  sessionId: string;
  message: {
    id: string;
    role: 'assistant';
    content: string;
    suggestions?: string[]; // Takip önerileri
    quickActions?: {
      label: string;
      action: string;
      payload: Record<string, unknown>;
    }[];
  };
  metadata: {
    tokensUsed: number;
    model: string;
    contextTokens: number;
  };
}

// POST /api/onboarding/chat/feedback
// Yanıt feedback'i

interface ChatFeedbackRequest {
  messageId: string;
  isHelpful: boolean;
  feedback?: string; // Optional detaylı feedback
}

// GET /api/onboarding/knowledge/search
// Dokümantasyon araması (RAG)

interface KnowledgeSearchRequest {
  query: string;
  limit?: number;
  category?: string;
}

interface KnowledgeSearchResponse {
  results: {
    id: string;
    title: string;
    content: string;
    category: string;
    relevanceScore: number;
    sourceUrl?: string;
  }[];
}
```

### 5.6 Frontend Component Yapısı

```
components/onboarding/
├── ai-assistant/
│   ├── ChatWidget.tsx                     # Floating chat button + panel
│   ├── ChatPanel.tsx                      # Ana chat alanı
│   ├── ChatMessage.tsx                    # Tekil mesaj
│   ├── ChatInput.tsx                      # Input alanı
│   ├── SuggestionChips.tsx                # Öneri çipleri
│   ├── QuickActions.tsx                   # Hızlı aksiyonlar
│   ├── ContextIndicator.tsx               # Mevcut bağlam
│   └── ChatHeader.tsx                     # Header + kapatma
├── knowledge/
│   ├── KnowledgeSearch.tsx                # Arama bileşeni
│   ├── ArticleCard.tsx                    # Makale kartı
│   └── CategoryNav.tsx                    # Kategori navigasyonu
└── hooks/
    ├── useChat.ts                          # Chat hook
    └── useKnowledgeSearch.ts               # Arama hook
```

### 5.7 RAG (Retrieval Augmented Generation) Pipeline

```typescript
// 1. User Query → Embedding
const queryEmbedding = await openai.embeddings.create({
  model: 'text-embedding-ada-002',
  input: userQuery
});

// 2. Vector Search
const searchResults = await pinecone.query({
  vector: queryEmbedding.data[0].embedding,
  topK: 5,
  filter: { locale: 'tr' }
});

// 3. Build Context
const context = searchResults.matches
  .map(match => match.metadata.content)
  .join('\n\n');

// 4. Generate Response
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    {
      role: 'system',
      content: `Sen ProsektorWeb onboarding asistanısın. 
Kullanıcılara platform kullanımı konusunda yardımcı olursun.
Şu dokümantasyona göre yanıt ver: ${context}`
    },
    {
      role: 'user',
      content: userQuery
    }
  ],
  temperature: 0.7,
  max_tokens: 500
});
```

### 5.8 Implementasyon Adımları

1. Vector database kurulumu (Pinecone/pgvector)
2. Dokümantasyon embedding pipeline
3. Chat API endpoint'leri
4. Frontend chat widget
5. RAG pipeline entegrasyonu
6. Analytics ve feedback sistemi
7. Context-aware suggestions

---

## 6. Ortak Teknik Altyapı

### 6.1 Analytics Events

Tüm onboarding özellikleri için ortak analytics:

```typescript
// Checklist
trackOnboardingEvent('checklist_viewed', { step: 'dashboard_widget' });
trackOnboardingEvent('checklist_item_started', { itemId: 'xxx' });
trackOnboardingEvent('checklist_item_completed', { itemId: 'xxx', timeSpent: 120 });
trackOnboardingEvent('checklist_completed', { totalTime: 600 });

// Role-based Flow
trackOnboardingEvent('flow_started', { role: 'admin', flowId: 'xxx' });
trackOnboardingEvent('flow_step_viewed', { stepId: 'xxx', flowId: 'yyy' });
trackOnboardingEvent('flow_step_completed', { stepId: 'xxx', flowId: 'yyy' });
trackOnboardingEvent('flow_completed', { flowId: 'xxx', totalTime: 900 });

// Tour
trackOnboardingEvent('tour_started', { tourId: 'xxx', page: '/dashboard' });
trackOnboardingEvent('tour_step_viewed', { stepId: 'xxx', tourId: 'yyy' });
trackOnboardingEvent('tour_completed', { tourId: 'xxx' });
trackOnboardingEvent('tour_skipped', { tourId: 'xxx', stepReached: 3 });

// Video
trackOnboardingEvent('video_started', { videoId: 'xxx' });
trackOnboardingEvent('video_progress', { videoId: 'xxx', progress: 50 });
trackOnboardingEvent('video_completed', { videoId: 'xxx', watchTime: 180 });

// AI Assistant
trackOnboardingEvent('chat_started', { sessionId: 'xxx' });
trackOnboardingEvent('chat_message_sent', { sessionId: 'xxx', messageLength: 50 });
trackOnboardingEvent('chat_feedback', { messageId: 'xxx', isHelpful: true });
trackOnboardingEvent('chat_completed', { sessionId: 'xxx', messageCount: 10 });
```

### 6.2 Error Handling

```typescript
// Ortak hata tipleri
type OnboardingError =
  | { code: 'AUTH_REQUIRED'; message: 'Login required' }
  | { code: 'TENANT_REQUIRED'; message: 'Organization required' }
  | { code: 'STEP_NOT_FOUND'; message: 'Invalid step' }
  | { code: 'VIDEO_PROCESSING'; message: 'Video still processing' }
  | { code: 'AI_SERVICE_ERROR'; message: 'AI service unavailable' }
  | { code: 'RATE_LIMIT_EXCEEDED'; message: 'Too many requests' };
```

### 6.3 Performance Optimizations

1. **Lazy Loading:** Video ve tour componentleri lazy load
2. **Caching:** Sık kullanılan checklist template'leri cache
3. **Optimistic Updates:** UI anında güncelle, backend sonra sync et
4. **Debouncing:** Search input'ları debounce et
5. **Web Workers:** Embedding hesaplamaları web worker'da

---

## 7. Test Stratejisi

### 7.1 Unit Tests
- Component rendering
- Hook logic
- Utility functions
- API request/response

### 7.2 Integration Tests
- Database operations
- API endpoints
- WebSocket events

### 7.3 E2E Tests (Playwright)
- Complete user flows
- Cross-browser compatibility
- Performance benchmarks

### 7.4 Manual Testing
- Accessibility tests
- Edge cases
- Error scenarios

---

## 8. Deployment Plan

### 8.1 CI/CD Pipeline

```yaml
name: Onboarding Features

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm test
      - run: pnpm lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm build --filter=web

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploy to staging"

  deploy-production:
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploy to production"
```

### 8.2 Feature Flags

```typescript
// Feature flags (Zustand/LaunchDarkly)
const featureFlags = {
  onboardingChecklist: true,
  roleBasedOnboarding: false,
  interactiveTour: false,
  tutorialVideos: false,
  aiAssistant: false,
};

// Environment-based
const flags = process.env.NEXT_PUBLIC_FEATURES?.split(',') || [];
```

---

## 9. Timeline

| Sprint | Özellik | Deliverables |
|--------|---------|--------------|
| 1 | Onboarding Checklist | DB schema, API, Widget, Admin |
| 2 | Role-Based Onboarding | Flow system, Role selection, Step types |
| 3 | Interactive Product Tour | Highlight system, Tooltips, Tours |
| 4 | Tutorial Video | Video player, Upload system, CDN |
| 5 | AI Assistant | Chat widget, RAG pipeline, Knowledge base |
| 6 | Polish & Optimization | Tests, Performance, Accessibility |

---

## 10. Risk Analizi

| Risk | Etki | Önlem |
|------|------|-------|
| Video processing maliyeti | Orta | S3 + CloudFront, lazy encoding |
| AI maliyeti | Yüksek | Caching, rate limiting, fallback |
| Performans düşüşü | Orta | Lazy loading, code splitting |
| Kullanıcı karmaşıklığı | Düşük | Progressive disclosure |
| Bakım maliyeti | Orta | Strong typing, documentation |

---

## Sonuç

Bu doküman, ProsektorWeb dashboard için kapsamlı bir onboarding sistemi geliştirmek için gerekli tüm teknik detayları içermektedir. Öncelik sırasına göre implementasyon, toplam 6 sprint sürecektir. Her özellik bağımsız olarak deploy edilebilir ve mevcut sisteme entegre edilebilir şekilde tasarlanmıştır.
