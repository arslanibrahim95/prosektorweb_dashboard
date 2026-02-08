# Test Matrix

P0 / P1 / P2 öncelikli test senaryoları.

---

## P0 - Release Blocker

### RLS (Multi-Tenant Isolation)

| ID | Senaryo | Beklenen |
|----|---------|----------|
| RLS-01 | Tenant A user, Tenant B pages SELECT | 0 row |
| RLS-02 | Tenant A user, Tenant B offer_requests SELECT | 0 row |
| RLS-03 | Tenant A user, Tenant B job_applications SELECT | 0 row |
| RLS-04 | Tenant A user, tenant_id=B INSERT | WITH CHECK fail |
| RLS-05 | Tenant A user, Tenant B CV signed URL | 403 |

### Public Forms (Spam & Validation)

| ID | Senaryo | Beklenen |
|----|---------|----------|
| SPAM-01 | 6. request aynı IP+site/saat | 429 Rate Limit |
| SPAM-02 | Honeypot dolu | Silent reject (200) + no DB |
| SPAM-03 | Email eksik | 400 + validation error |
| SPAM-04 | Phone eksik | 400 + validation error |
| SPAM-05 | KVKK checkbox false | 400 |
| SPAM-06 | KVKK checkbox missing | 400 |

### HR CV Storage

| ID | Senaryo | Beklenen |
|----|---------|----------|
| CV-01 | Tenant B, Tenant A CV URL | 403 |
| CV-02 | .exe upload | 400 invalid type |
| CV-03 | 10MB file | 400 size limit |
| CV-04 | Valid PDF upload | 200 + path |

### E2E Critical Flows

| ID | Akış | Adımlar |
|----|------|---------|
| E2E-HR | HR Full Flow | Job create → site'de gör → apply (CV) → inbox |
| E2E-OFFER | Offer Flow | Form gönder → inbox'ta gör |
| E2E-CONTACT | Contact Flow | Form gönder → inbox'ta gör |

---

## P1 - Önemli

| ID | Senaryo | Beklenen |
|----|---------|----------|
| P1-01 | Inbox date_from/date_to filter | Doğru aralıkta items |
| P1-02 | Inbox job_post_id filter | Sadece o job's apps |
| P1-03 | Soft deleted job_post listede yok | Görünmez |
| P1-04 | Viewer rol job post CREATE | 403 |
| P1-05 | Viewer rol job post DELETE | 403 |
| P1-06 | API error format | {code, message, details?} |

---

## P2 - Nice to Have

| ID | Senaryo | Beklenen |
|----|---------|----------|
| P2-01 | SEO page load | No crash |
| P2-02 | Publish checklist | Warnings show |
| P2-03 | Domain wizard steps | UI renders |
| P2-04 | Analytics widgets | Mock data renders |

---

## Coverage Hedefler

| Kategori | Target |
|----------|--------|
| P0 | 100% |
| P1 | 80% |
| P2 | 50% |

---

## Test Öncelik Özet

```
P0 (15 test)
├── RLS: 5
├── Spam: 6
├── CV: 4
└── E2E: 3

P1 (6 test)
└── Filters, Auth, Error format

P2 (4 test)
└── UI Smoke
```
