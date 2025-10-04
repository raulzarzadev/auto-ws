import { PropsWithChildren, ReactNode } from "react";

import { ThemeToggle } from "@/components/shared/theme-toggle";

interface AppShellProps extends PropsWithChildren {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const AppShell = ({ title, description, actions, children }: AppShellProps) => (
  <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-10">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold text-[hsl(var(--foreground))]">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <ThemeToggle />
      </div>
    </header>
    <main className="flex flex-1 flex-col gap-6 pb-16">{children}</main>
  </div>
);
