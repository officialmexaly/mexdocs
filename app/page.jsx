import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to admin or show a landing page
  redirect('/docs');
}
