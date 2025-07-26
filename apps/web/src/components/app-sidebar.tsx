import * as React from 'react'
import {
  BlocksIcon,
  LayersIcon,
  Mail,
  PenSquare,
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
import { currentUser } from '@clerk/nextjs/server'
import { getUserChats } from '@/actions/chat'
import { UserChat } from '@/types'

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
    {
      title: 'New Chat',
      url: '/chat',
      icon: (
        <PenSquare className="text-muted-foreground group-hover/menu-item:text-foreground transition-colors icon-nav" />
      ),
    },
  ],
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

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const user = await currentUser()
  let chats: UserChat[] = []
  if (user?.id) {
    const result = await getUserChats(user.id)
    if (result.success && result.data) {
      chats = result.data
    }
  }
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex flex-col items-center justify-between">
        <TeamSwitcher teams={data.teams} />
        <SidebarMenuButton tooltip="Search">
          <Search className="icon-nav icon-interactive" />
          <span>Search</span>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent className="flex flex-col">
        <NavMain items={data.main} />
        <NavChats chats={chats} />
      </SidebarContent>
      <SidebarFooter className="flex flex-col items-center justify-center gap-1">
        <UsageCard />
      </SidebarFooter>
    </Sidebar>
  )
}
