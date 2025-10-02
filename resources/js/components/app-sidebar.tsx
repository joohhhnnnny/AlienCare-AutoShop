import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { dashboard, inventory } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BarChart4, FoldersIcon, Home, LogOut, LucideFileBarChart2, LucideReceiptText, Package, Tags, Users } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url, // Use .url for Wayfinder functions
        icon: Home,
    },
    {
        title: 'Services',
        href: '#',
        icon: FoldersIcon,
    },
    {
        title: 'Job Orders',
        href: '#',
        icon: Tags,
    },
    {
        title: 'Point of Sale',
        href: '#',
        icon: BarChart4,
    },
    {
        title: 'Billing & Payment',
        href: '#',
        icon: LucideReceiptText,
    },
    {
        title: 'Inventory',
        href: inventory(),
        icon: Package,
    },
    {
        title: 'Customers',
        href: '#',
        icon: Users,
    },
    {
        title: 'Reports and Analytics',
        href: '#',
        icon: LucideFileBarChart2,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Sign Out',
        href: '#',
        icon: LogOut,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="m-0 p-0">
                <SidebarMenu className="m-0 p-0">
                    <SidebarMenuItem className="m-0 p-0">
                        <Link href={dashboard().url} prefetch className="block h-full w-full">
                            <AppLogo />
                        </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
