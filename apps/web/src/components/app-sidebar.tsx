import * as React from 'react'
import {
  BlocksIcon,
  HomeIcon,
  LayersIcon,
  Mail,
  Search,
  WorkflowIcon,
} from 'lucide-react'
import { NavChats } from '@/components/nav-chats'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import { NavMain } from '@/components/nav-main'
import { TeamSwitcher } from '@/components/team-switcher'
import UsageCard from '@/components/global/usage-card'

const data = {
  main: [
    {
      title: 'Workflows',
      url: '/workflows',
      icon: (
        <WorkflowIcon className="text-muted-foreground group-hover/menu-item:text-foreground transition-colors icon-nav" />
      ),
    },
    {
      title: 'Integrations',
      url: '/integrations',
      icon: (
        <BlocksIcon className="text-muted-foreground group-hover/menu-item:text-foreground transition-colors icon-nav" />
      ),
    },
  ],
  chats: [],
  teams: [
    {
      name: "Dhruv's Team",
      logo: <LayersIcon className="icon-sidebar" />,
      plan: 'Pro',
    },
  ],
  integrations: [
    {
      name: 'Gmail',
      url: '#',
      icon: Mail,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex flex-col items-center justify-between">
        <TeamSwitcher teams={data.teams} />
        <SidebarMenuButton tooltip="Search">
          <Search className="icon-nav icon-interactive" />
          <span>Search</span>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.main} />
        <NavChats chats={data.chats} />
      </SidebarContent>
      <SidebarFooter className="flex flex-col items-center justify-center gap-1">
        <UsageCard />
      </SidebarFooter>
    </Sidebar>
  )
}
