import { redirect } from 'next/navigation';

// HR Applications are in inbox/applications
// This page redirects there or shows a summary
export default function HRApplicationsPage() {
    redirect('/inbox/applications');
}
