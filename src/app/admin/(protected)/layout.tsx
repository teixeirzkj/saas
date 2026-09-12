import Link from 'next/link';
import { LogOut, Plus } from 'lucide-react';

import { requireAdmin } from '@/lib/admin-auth';

import { adminLogoutAction } from '@/app/admin/login/actions';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 px-4 sm:px-6">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] font-display text-[13px] font-bold text-white">
            N
          </span>
          <span className="hidden font-display text-[14px] font-semibold text-white sm:inline">
            NEXO · Admin
          </span>
        </Link>

        <Link
          href="/admin/contas/nova"
          className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 text-[13px] font-medium text-white/80 transition hover:bg-white/[0.09]"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova conta
        </Link>

        <div className="flex items-center gap-2 pl-2">
          <span className="hidden text-[13px] text-white/45 sm:inline">{admin.name}</span>
          <form action={adminLogoutAction}>
            <button
              type="submit"
              aria-label="Sair"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white/45 transition hover:bg-white/[0.07] hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-6 sm:px-6">{children}</main>
    </div>
  );
}
