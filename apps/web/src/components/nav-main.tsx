'use client'

import { Collapsible } from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import Link from 'next/link'
import React from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive || pathname === item.url}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <SidebarMenuButton tooltip={item.title} asChild>
                <Link
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
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
