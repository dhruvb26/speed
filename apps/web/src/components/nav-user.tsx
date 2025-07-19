'use client'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { SignOutButton, useUser } from '@clerk/nextjs'
import { ChevronDown, Settings, User, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { CreditCardIcon, GearIcon, UserIcon, SparkleIcon } from '@phosphor-icons/react'

export function NavUser() {
  const { user } = useUser()

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex flex-row items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center text-left text-sm px-2 py-1 w-full gap-2 rounded-md">
              {/* <Avatar className="w-8 h-8 rounded-full">
                <AvatarImage src={user?.imageUrl ?? ''} />
                <AvatarFallback className="bg-accent text-accent-foreground">
                  {user?.fullName?.split(' ')[0]?.charAt(0) ?? ''}
                </AvatarFallback>
              </Avatar> */}
              <span className="truncate font-semibold flex flex-col items-start">
                {user?.fullName ?? ''}
                <span className="text-xs font-normal text-muted-foreground">
                  {user?.emailAddresses[0].emailAddress}
                </span>
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 ml-12" side="bottom">
          <DropdownMenuItem>
              <SparkleIcon className="w-4 h-4" />
              Upgrade to Pro
            </DropdownMenuItem>
            <DropdownMenuItem>
              <GearIcon weight="duotone" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <CreditCardIcon className="w-4 h-4" />
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <SignOutButton>
                <div className="flex items-center gap-2">
                  <LogOut className='w-4 h-4' />
                  Logout
                </div>
              </SignOutButton>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
