import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard', // or use route('dashboard') if your route helper is typed
  },
  {
    title: 'Job Order',
    href: '/joborder',
  },
];

export default function JobOrder() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Job Order" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
          <div className="flex items-center justify-center h-full">
            <h1 className="text-2xl font-bold">Job Order Page</h1>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
