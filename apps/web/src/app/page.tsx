import { redirect } from 'next/navigation';

// Redirect root to home dashboard
export default function RootPage() {
  redirect('/home');
}
