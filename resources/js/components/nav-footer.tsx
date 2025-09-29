import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { type ComponentPropsWithoutRef } from 'react';

export function NavFooter({
    items,
    className,
    ...props
}: ComponentPropsWithoutRef<typeof SidebarGroup> & {
    items: NavItem[];
}) {
    return (
        <SidebarGroup {...props} className={`group-data-[collapsible=icon]:p-0 ${className || ''}`}>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => {
                        const href = typeof item.href === 'string' ? item.href : item.href.url;
                        const isExternal = href.startsWith('http');

                        return (
                            <SidebarMenuItem key={item.title}>
                                {isExternal ? (
                                    <SidebarMenuButton asChild>
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sidebar-foreground hover:text-sidebar-accent"
                                        >
                                            <item.icon className="text-sidebar-foreground" />
                                            <span className="text-sidebar-foreground">{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                ) : (
                                    <SidebarMenuButton asChild>
                                        <Link href={href} className="text-sidebar-foreground hover:text-sidebar-accent">
                                            <item.icon className="text-sidebar-foreground" />
                                            <span className="text-sidebar-foreground">{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                )}
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
