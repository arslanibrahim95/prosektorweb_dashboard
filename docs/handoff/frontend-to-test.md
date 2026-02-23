# Frontend to Test Handoff

> **Version:** 1.0.0 | **Son Güncelleme:** 2026-02-23

E2E test rehberi ve selector dokümanı.

---

## Test Kullanıcıları

| Role | Email | Erişim |
|------|-------|--------|
| owner | owner@prosektorweb.com | Tüm özellikler |
| admin | admin@prosektorweb.com | Ayarlar hariç fatura |
| editor | editor@prosektorweb.com | İçerik düzenleme |
| viewer | viewer@prosektorweb.com | Sadece görüntüleme |

---

## Page Selectors

### Dashboard Home
```
[data-testid="home-page"]
[data-testid="site-health-widget"]
[data-testid="recent-activity"]
[data-testid="setup-checklist"]
```

### Inbox Screens
```
[data-testid="offers-inbox"]
[data-testid="contact-inbox"]
[data-testid="applications-inbox"]
[data-testid="inbox-table"]
[data-testid="inbox-drawer"]
[data-testid="inbox-search"]
[data-testid="inbox-filter-status"]
```

### HR Module
```
[data-testid="job-posts-page"]
[data-testid="job-posts-table"]
[data-testid="job-post-create-btn"]
[data-testid="job-post-dialog"]
[data-testid="job-post-title-input"]
[data-testid="job-post-slug-input"]
[data-testid="job-post-save-btn"]
```

### Module Settings
```
[data-testid="offer-settings-page"]
[data-testid="contact-settings-page"]
[data-testid="module-enabled-switch"]
[data-testid="kvkk-select"]
[data-testid="settings-save-btn"]
```

### Site Builder
```
[data-testid="site-pages-list"]
[data-testid="page-builder"]
[data-testid="block-picker"]
[data-testid="canvas"]
[data-testid="block-inspector"]
[data-testid="publish-btn"]
```

### Settings
```
[data-testid="users-page"]
[data-testid="invite-user-btn"]
[data-testid="notifications-page"]
[data-testid="billing-page"]
```

---

## Critical Flows

### Flow 1: Job Post → Application Inbox
1. Navigate to `/modules/hr/job-posts`
2. Click "Yeni İlan" → fill form → save
3. Public: Submit application to job post
4. Navigate to `/inbox/applications`
5. Verify application appears in list

### Flow 2: Offer Form → Inbox
1. Public: Submit offer form
2. Navigate to `/inbox/offers`
3. Verify submission appears
4. Click row → drawer opens
5. Verify details visible

### Flow 3: Contact Form → Inbox
1. Public: Submit contact form
2. Navigate to `/inbox/contact`
3. Verify message appears
4. Click row → drawer opens

---

## State Testing

### Empty States
All inbox screens should show empty state with CTA when no data.

Selector: `[data-testid="empty-state"]`

### Loading States
During API calls, skeleton should display.

Selector: `[data-testid="loading-state"]`

### Error States
On API failure, error message with retry button.

Selector: `[data-testid="error-state"]`

### Unauthorized
When role insufficient, 403 screen.

Selector: `[data-testid="unauthorized-screen"]`

---

## API Endpoints (Mock)

| Endpoint | Method | Usage |
|----------|--------|-------|
| `/api/me` | GET | User/tenant/role |
| `/api/inbox/offers` | GET | Offer requests |
| `/api/inbox/contact` | GET | Contact messages |
| `/api/hr/job-posts` | GET/POST/PATCH/DELETE | Job CRUD |
| `/api/hr/applications` | GET | Applications |

---

## Notes

- All forms use `react-hook-form` with Zod validation
- Toast notifications via `sonner`
- Dark mode: Toggle `.dark` class on `<html>`
