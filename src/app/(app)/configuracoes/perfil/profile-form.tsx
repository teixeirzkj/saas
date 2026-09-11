'use client';

import { useRouter } from 'next/navigation';
import { KeyRound, Save, User } from 'lucide-react';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input, PasswordInput } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/misc';
import { useToast } from '@/components/ui/toast';

import { changePassword, updateProfile, uploadAvatar } from '../actions';

export function ProfileForm({
  user,
}: {
  user: { name: string; email: string; avatarUrl: string | null; role: string };
}) {
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, startTransition] = useTransition();
  const [passwordPending, startPasswordTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? '');

  const submitProfile = (formData: FormData) => {
    formData.set('avatarUrl', avatarUrl);
    startTransition(async () => {
      const result = await updateProfile({}, formData);
      if (result.errors) {
        setErrors(result.errors);
        return error('Verifique os campos', Object.values(result.errors)[0]);
      }
      if (result.error) return error('Não foi possível salvar', result.error);
      setErrors({});
      success('Perfil atualizado');
      router.refresh();
    });
  };

  const submitPassword = (formData: FormData) => {
    startPasswordTransition(async () => {
      const result = await changePassword({}, formData);
      if (result.errors) {
        setPasswordErrors(result.errors);
        return error('Verifique os campos', Object.values(result.errors)[0]);
      }
      if (result.error) return error('Não foi possível alterar', result.error);
      setPasswordErrors({});
      success('Senha alterada com sucesso');
      (document.getElementById('password-form') as HTMLFormElement | null)?.reset();
    });
  };

  return (
    <>
      <PageHeader title="Perfil" description="Suas informações pessoais de acesso." />

      <div className="space-y-4">
        <Card>
          <CardHeader
            title="Informações pessoais"
            icon={<User className="h-4 w-4" />}
            action={<Badge tone="purple">{user.role === 'owner' ? 'Proprietário' : 'Membro'}</Badge>}
          />

          <form action={submitProfile} className="space-y-4">
            <ImageUpload
              label="Sua foto"
              value={avatarUrl}
              onChange={setAvatarUrl}
              action={uploadAvatar}
              folder="avatar"
              shape="circle"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Nome" name="name" defaultValue={user.name} error={errors.name} required />
              <Input label="E-mail" name="email" type="email" defaultValue={user.email} error={errors.email} required />
            </div>

            <div className="flex justify-end">
              <Button type="submit" loading={pending}>
                <Save className="h-4 w-4" />
                Salvar alterações
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader title="Alterar senha" icon={<KeyRound className="h-4 w-4" />} />
          <form id="password-form" action={submitPassword} className="space-y-4">
            <PasswordInput
              label="Senha atual"
              name="current"
              autoComplete="current-password"
              error={passwordErrors.current}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <PasswordInput
                label="Nova senha"
                name="password"
                autoComplete="new-password"
                error={passwordErrors.password}
                required
              />
              <PasswordInput
                label="Confirmar nova senha"
                name="confirm"
                autoComplete="new-password"
                error={passwordErrors.confirm}
                required
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="secondary" loading={passwordPending}>
                Alterar senha
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
