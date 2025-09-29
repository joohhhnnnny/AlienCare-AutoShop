import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Inventory',
        href: '/inventory',
    },
];

export default function Inventory() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                            <h1 className="mb-4 text-3xl font-bold">Inventory Management</h1>
                            <p className="text-gray-600 dark:text-gray-400">Manage your auto shop inventory here</p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
