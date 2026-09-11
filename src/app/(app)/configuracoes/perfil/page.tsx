import type { Metadata } from 'next';

import { requireBusiness } from '@/lib/auth';

import { ProfileForm } from './profile-form';

export const metadata: Metadata = { title: 'Perfil' };

export default async function ProfilePage() {
  const { user } = await requireBusiness();

  return (
    <ProfileForm
      user={{ name: user.name, email: user.email, avatarUrl: user.avatarUrl, role: user.role }}
    />
  );
}
