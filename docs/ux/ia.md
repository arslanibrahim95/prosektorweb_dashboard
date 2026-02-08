# Information Architecture (IA)

ProsektorWeb Dashboard bilgi mimarisi ve navigasyon yapısı.

---

## Tenant Menu Yapısı

```
📊 Home                          [all roles]
   └─ Dashboard

🌐 Site                          [admin+]
   ├─ Pages                      
   ├─ Builder                    
   ├─ Theme                      [Phase-2]
   ├─ Menus                      
   ├─ Media                      
   ├─ Domains                    
   ├─ SEO                        
   └─ Publish                    

📦 Modules                       [admin+]
   ├─ Offer Settings             
   ├─ Contact Settings           
   └─ Legal / KVKK               

👔 HR                            [admin+]
   ├─ Job Posts                  
   └─ Applications → (Inbox redirect)

📬 Inbox                         [editor+]
   ├─ Offers (badge: unread)
   ├─ Contact (badge: unread)
   └─ Applications (badge: unread)

📈 Analytics                     [admin+]
   └─ Dashboard

⚙️ Settings                      [varies]
   ├─ Users & Roles              [owner+]
   ├─ Notifications              [all roles]
   └─ Billing                    [owner only]
```

---

## Super Admin Menu

```
🏢 Tenants                       [super_admin only]
   ├─ All Tenants
   ├─ Create Tenant
   └─ Tenant Details

📊 Platform Analytics            [super_admin only]
   └─ System Stats

⚙️ Platform Settings             [super_admin only]
   ├─ Feature Flags
   └─ Plans & Billing
```

---

## Role-Based Visibility

| Screen | super_admin | owner | admin | editor | viewer |
|--------|:-----------:|:-----:|:-----:|:------:|:------:|
| Home | ✅ | ✅ | ✅ | ✅ | ✅ |
| Site (all) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Modules | ✅ | ✅ | ✅ | ❌ | ❌ |
| HR | ✅ | ✅ | ✅ | ❌ | ❌ |
| Inbox | ✅ | ✅ | ✅ | ✅ | ❌ |
| Analytics | ✅ | ✅ | ✅ | ❌ | ❌ |
| Users & Roles | ✅ | ✅ | ❌ | ❌ | ❌ |
| Notifications | ✅ | ✅ | ✅ | ✅ | ✅ |
| Billing | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## URL Structure

```
/home                           # Dashboard
/site/pages                     # Page list
/site/builder?page_id=xxx       # Page editor
/site/menus                     # Menu management
/site/media                     # Media library
/site/domains                   # Domain setup
/site/seo                       # SEO settings
/site/publish                   # Publish flow

/modules/offer                  # Offer settings
/modules/contact                # Contact settings
/modules/legal                  # KVKK texts
/modules/hr/job-posts           # Job CRUD
/modules/hr/applications        # → Redirects to inbox

/inbox/offers                   # Offer inbox
/inbox/contact                  # Contact inbox
/inbox/applications             # Applications inbox

/analytics                      # Site analytics

/settings/users                 # Team management
/settings/notifications         # Preferences
/settings/billing               # Subscription
```

---

## MVP vs Phase-2

### MVP (7 gün)
- ✅ Site: Pages, Builder (basic), Menus, Media, Domains, SEO, Publish
- ✅ Modules: Offer, Contact, Legal (KVKK)
- ✅ HR: Job Posts, Applications
- ✅ Inbox: All three inboxes
- ✅ Settings: Users, Notifications, Billing

### Phase-2
- ❌ Theme editor (visual customization)
- ❌ Form builder (custom fields)
- ❌ Pipeline/Assignment (application tracking)
- ❌ Notes on inbox items
- ❌ Advanced analytics (funnel, conversion)
