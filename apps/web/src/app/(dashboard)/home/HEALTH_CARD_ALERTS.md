# SiteHealthCard - Critical Status Alert Banners

## Overview

The SiteHealthCard component displays site health status with automatic alert banners for critical and warning conditions.

## Features Implemented

### 1. Critical Status Alerts (Destructive/Red)

Displayed when any of these conditions are met:

```tsx
const isCritical = isSslError || isSiteError;
```

#### SSL Errors
- SSL status is NOT one of: `active`, `valid`, `pending`
- Examples: `failed`, `expired`, `error`, `invalid`
- Message: `SSL sertifikası hatası: {sslStatus}. Hemen kontrol edin.`

#### Site Errors
- Site status is `error` OR `offline`
- Message: `Site durumu: {status}. Hemen kontrol edin.`

**Alert Styling:**
- Red border: `border-destructive/50`
- Red background: `bg-destructive/10`
- Red icon: `XCircle`

### 2. Warning Status Alerts (Yellow)

Displayed when no critical conditions exist AND one of these is true:

```tsx
const isWarning = sslStatus === 'pending' || currentSiteStatus === 'staging';
```

#### SSL Pending
- SSL status is exactly `pending`
- Message: `SSL sertifikası doğrulanıyor. Production yayınına geçmeyi unutmayın.`

#### Staging Environment
- Site status is `staging`
- Message: `Site staging ortamında yayında. Production yayınına geçmeyi unutmayın.`

**Alert Styling:**
- Yellow border: `border-warning/50`
- Yellow background: `bg-warning/10`
- Yellow icon: `AlertTriangle`

### 3. Card Status Indicators

The card itself responds to critical status:

- **Normal:** Primary color icon (blue)
- **Critical:** Destructive color icon (red), light red background

```tsx
<Globe className={cn('h-4 w-4', isCritical ? 'text-destructive' : 'text-primary')} />
```

### 4. Badge Status Colors

Inline status badges change color based on errors:

- **SSL Error:** Red text `text-destructive`, red border `border-destructive/50`
- **Site Error:** Red text `text-destructive`, red border `border-destructive/50`
- **Normal:** Default outline style

## Data Points Displayed

1. **Site Status** Badge
   - Values: `draft`, `staging`, `published`, `error`, `offline`, etc.
   - Icon: Globe

2. **SSL Status** Badge
   - Values: `SSL: {status}`
   - Icon: Shield

3. **Active Job Posts** Counter
   - Value: Number of active job postings
   - Icon: Clock

## Refresh Functionality

The card includes a "Senkronize Et" (Sync) button that:

- Calls `onRefetch()` to refetch dashboard stats
- Shows spinning icon during loading
- Disabled while loading
- Updates "Son yenilenme" (Last updated) timestamp

## Timestamp Display

Shows "Son yenilenme: {time}" relative to `dataUpdatedAt`:

- `az önce` (just now)
- `1 dk önce` (1 min ago)
- `{n} dk önce` ({n} mins ago)
- Updates every 30 seconds

## Implementation Details

### File: `SiteHealthCard.tsx`

```tsx
interface SiteHealthProps {
  currentSiteStatus?: string;
  primaryDomainStatus?: { ssl_status: string } | null;
  activeJobPostsCount: number;
  isLoading: boolean;
  onRefetch?: () => void;           // Refetch callback
  dataUpdatedAt?: number;            // Timestamp in ms
}
```

### File: `SiteHealthCardSection.tsx`

Wraps component with Suspense and passes all props:

```tsx
<Suspense fallback={<SiteHealthCardSkeleton />}>
  <SiteHealthCard
    currentSiteStatus={currentSiteStatus}
    primaryDomainStatus={primaryDomainStatus}
    activeJobPostsCount={activeJobPostsCount}
    isLoading={isLoading}
    onRefetch={onRefetch}
    dataUpdatedAt={dataUpdatedAt}
  />
</Suspense>
```

### File: `page.tsx`

Provides data and callbacks:

```tsx
const { data: summary, isLoading, refetch, dataUpdatedAt } = useDashboardStats(site.currentSiteId);

<SiteHealthCardSection
  currentSiteStatus={currentSite?.status}
  primaryDomainStatus={primaryDomainStatus ? { ssl_status: primaryDomainStatus.ssl_status } : null}
  activeJobPostsCount={activeJobPostsCount}
  isLoading={isLoading}
  onRefetch={refetch}
  dataUpdatedAt={dataUpdatedAt}
/>
```

## Testing

### Test Critical SSL Status
```tsx
primaryDomainStatus={{ ssl_status: 'failed' }}
// Should show: Red alert banner + red SSL badge
```

### Test Critical Site Status
```tsx
currentSiteStatus="offline"
// Should show: Red alert banner + red Site Status badge
```

### Test Warning - SSL Pending
```tsx
primaryDomainStatus={{ ssl_status: 'pending' }}
// Should show: Yellow alert banner
```

### Test Warning - Staging
```tsx
currentSiteStatus="staging"
// Should show: Yellow alert banner
```

### Test Normal Status
```tsx
currentSiteStatus="published"
primaryDomainStatus={{ ssl_status: 'active' }}
// Should show: No alert banners, normal styling
```

## Alert Priority

If multiple conditions exist:
1. **Critical alerts** take priority (red)
2. **Warning alerts** only show if no critical alerts exist
3. Card styling reflects critical status regardless

## Accessibility

- Alert roles and descriptions for screen readers
- Icon + text for color-blind users
- Contrast meets WCAG AA standards
- Clear action text: "Hemen kontrol edin" (Check immediately)

## Future Enhancements

- Email notifications for critical status
- Webhook alerts for SSL issues
- Auto-retry failed SSL checks
- Status history/timeline
- Performance metrics dashboard
