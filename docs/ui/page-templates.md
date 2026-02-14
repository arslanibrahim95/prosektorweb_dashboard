# Page Templates

Her sayfa için layout ve component listesi.

---

## Home Dashboard

**Route:** `/home`
**Layout:** Grid dashboard

### Components
| Component | Usage |
|-----------|-------|
| Card | Widget container |
| Badge | Status indicators |
| Progress | Checklist completion |
| Skeleton | Loading state |

### Widgets
1. **Site Health** - Status badge, checklist
2. **Stats Cards** - 4x metrics grid
3. **Recent Activity** - Timeline list
4. **Setup Checklist** - Progress + tasks

### States
- ✅ Empty: Checklist CTA
- ✅ Loading: Skeleton cards
- ✅ Error: ErrorState with retry

---

## Inbox: Offers / Contact / Applications

**Routes:** `/inbox/offers`, `/inbox/contact`, `/inbox/applications`
**Layout:** DataTable + Drawer

### Components
| Component | Usage |
|-----------|-------|
| DataTable | Main list |
| Badge | Read/unread status |
| Sheet (Drawer) | Detail view |
| Input | Search |
| Select | Filters |

### Columns
| Column | Type |
|--------|------|
| Name | Text |
| Email | Text |
| Date | Relative time |
| Status | Badge |
| Actions | Dropdown |

### Features
- ✅ Pagination (10/25/50)
- ✅ Sorting by date
- ✅ Search input
- ✅ Status filter
- ✅ Row click → drawer

### States
- ✅ Empty: "Henüz mesaj yok" + form link
- ✅ Loading: TableSkeleton
- ✅ Error: ErrorState

---

## HR: Job Posts

**Route:** `/modules/hr/job-posts`
**Layout:** DataTable + Dialog

### Components
| Component | Usage |
|-----------|-------|
| DataTable | Job list |
| Dialog | Create/Edit form |
| Switch | Active toggle |
| DropdownMenu | Row actions |

### CRUD Actions
- Create (Dialog)
- Edit (Dialog)
- Toggle status (inline)
- Duplicate
- Delete (confirm)

### Form Fields
| Field | Type | Validation |
|-------|------|------------|
| Title | Input | required, max 200 |
| Slug | Input | required, unique |
| Location | Input | optional |
| Type | Select | enum |
| Description | Textarea | optional |
| Active | Switch | default true |

### States
- ✅ Empty: "İlk ilanınızı oluşturun"
- ✅ Loading: TableSkeleton

---

## Module Settings: Offer / Contact

**Routes:** `/modules/offer`, `/modules/contact`
**Layout:** Card sections (max-w-2xl)

### Components
| Component | Usage |
|-----------|-------|
| Card | Section container |
| Switch | Enable toggle |
| Input | Email fields |
| Textarea | Messages |
| Select | KVKK text |
| Button | Save |

### Sections
1. **Module Toggle** - Enable/disable
2. **Recipients** - Email addresses
3. **Success Message** - Custom text
4. **KVKK Selection** - Legal text dropdown

### States
- ✅ Loading: Card skeletons
- ✅ Saving: Button loading

---

## Site: Pages List

**Route:** `/site/pages`
**Layout:** DataTable

### Components
| Component | Usage |
|-----------|-------|
| DataTable | Page list |
| Badge | Status (draft/published) |
| DropdownMenu | Actions |
| GripVertical | Drag handle (future) |

### Columns
- Drag handle
- Title
- Slug
- Status badge
- Updated date
- Actions

### States
- ✅ Empty: "İlk sayfanızı oluşturun"

---

## Site: Page Builder

**Route:** `/site/builder?page_id=`
**Layout:** Three-panel builder

### Components
| Component | Usage |
|-----------|-------|
| BlockPicker | Left panel |
| Canvas | Center panel |
| InspectorPanel | Right panel |
| Button group | Breakpoint toggle |
| Button | Save, Publish |

### Features
- Block drag-drop
- Inline editing
- Auto-save (30s)
- Responsive preview

### States
- ✅ Empty canvas: "Blok ekleyin"
- ✅ Loading: Canvas skeleton

---

## Site: Domains

**Route:** `/site/domains`
**Layout:** Card list + WizardDialog

### Components
| Component | Usage |
|-----------|-------|
| Card | Domain card |
| Badge | SSL/Verify status |
| Dialog | Add domain wizard |
| Button | Verify, Remove |

### Wizard Steps
1. Enter domain
2. DNS instructions (copy button)
3. Verification check
4. SSL provisioning

---

## Site: SEO

**Route:** `/site/seo`
**Layout:** Form sections (max-w-2xl)

### Sections
- Default title template
- Default description
- OG image upload
- Technical SEO toggles

---

## Site: Publish

**Route:** `/site/publish`
**Layout:** Tabs + cards

### Components
| Component | Usage |
|-----------|-------|
| Tabs | Staging/Production |
| Card | Environment card |
| Badge | Status |
| Accordion | Pre-publish checks |
| Table | Revision history |
| Button | Publish |

---

## Settings: Users

**Route:** `/settings/users`
**Layout:** Card list

### Components
| Component | Usage |
|-----------|-------|
| Card | User card |
| Badge | Role badge |
| Dialog | Invite form |
| DropdownMenu | User actions |

---

## Settings: Notifications

**Route:** `/settings/notifications`
**Layout:** Form sections (max-w-2xl)

### Components
| Component | Usage |
|-----------|-------|
| Card | Category section |
| Switch | Preference toggle |
| Button | Save |

---

## Settings: Billing

**Route:** `/settings/billing`
**Layout:** Card sections (max-w-2xl)

### Sections
- Current plan card
- Payment method card
- Invoice history table

---

## Analytics

**Route:** `/analytics`
**Layout:** Grid dashboard

### Widgets
- Stats cards (4x)
- Traffic chart (placeholder)
- Top pages table
- Traffic sources chart
