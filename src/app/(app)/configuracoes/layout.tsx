import { SettingsNav } from './settings-nav';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <SettingsNav />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
