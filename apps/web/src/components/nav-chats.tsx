'use client'

import { MoreHorizontal, Trash2, PenSquare, HomeIcon } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import React from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { MessageSquare } from 'lucide-react'
import Link from 'next/link'
export function NavChats({
  chats,
}: {
  chats: {
    name: string
    url: string
    icon: React.ReactNode
  }[]
}) {
  const { isMobile } = useSidebar()
  const pathname = usePathname()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Chats</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link
              href="/chat"
              className={cn(
                'flex items-center space-x-2 p-2 rounded-md',
                pathname === '/chat' ? 'bg-accent' : 'hover:bg-muted'
              )}
            >
              <HomeIcon
                className={cn(
                  'transition-colors icon-nav',
                  pathname === '/chat'
                    ? 'text-foreground'
                    : 'text-muted-foreground group-hover/menu-item:text-foreground'
                )}
              />
              <span>Home</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {chats.map((item) => (
          <SidebarMenuItem key={item.name} className="group/item">
            <SidebarMenuButton asChild>
              <a
                href={item.url}
                className={cn(
                  'flex items-center space-x-2 p-2 rounded-md',
                  pathname === item.url ? 'bg-accent' : 'hover:bg-muted'
                )}
              >
                {item.icon &&
                  React.cloneElement(
                    item.icon as React.ReactElement<
                      React.SVGProps<SVGSVGElement>
                    >,
                    {
                      className: cn(
                        'transition-colors icon-nav',
                        pathname === item.url
                          ? 'text-foreground'
                          : 'text-muted-foreground group-hover/menu-item:text-foreground'
                      ),
                    }
                  )}
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction
                  showOnHover
                  className={`group-hover/item:bg-sidebar-accent group-hover/item:text-sidebar-accent-foreground group-hover/item:cursor-pointer pr-2`}
                >
                  <MoreHorizontal className="text-muted-foreground" />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-40"
                side={isMobile ? 'bottom' : 'right'}
                align={isMobile ? 'end' : 'start'}
              >
                <DropdownMenuItem>
                  <PenSquare className="text-muted-foreground" />
                  <span>Rename</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-red-500/10">
                  <Trash2 className="text-destructive" />
                  <span className="text-destructive">Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
