import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Redirect based on role
  switch (session.user.role) {
    case 'admin':
      redirect('/staff');
    case 'supervisor':
      redirect('/dashboard');
    case 'staff':
      redirect('/home');
    default:
      redirect('/login');
  }
}
