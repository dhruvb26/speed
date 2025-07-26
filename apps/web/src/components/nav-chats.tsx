'use client'

import {
  MoreHorizontal,
  Trash2,
  PenSquare,
  MessageCircle,
  Check,
} from 'lucide-react'
import React, { useState } from 'react'
import type { UserChat } from '@/types'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { deleteChat, updateChat } from '@/actions/chat'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface NavChatsProps {
  chats: UserChat[]
}

export function NavChats({ chats }: NavChatsProps) {
  const { isMobile } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<UserChat | null>(null)
  const [newChatName, setNewChatName] = useState('')
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  const handleRenameClick = (chat: UserChat) => {
    setRenamingChatId(chat.id)
    setNewChatName(chat.name)
  }

  const handleRenameSubmit = async (chatId: string) => {
    if (newChatName.trim()) {
      const result = await updateChat(chatId, newChatName.trim())
      if (result.success) {
        setRenamingChatId(null)
        setNewChatName('')
        setOpenDropdownId(null)
        router.refresh()
      }
    }
  }

  const handleRenameCancel = () => {
    setRenamingChatId(null)
    setNewChatName('')
    setOpenDropdownId(null)
  }

  const handleDeleteClick = (chat: UserChat) => {
    setChatToDelete(chat)
    setDeleteDialogOpen(true)
    setOpenDropdownId(null)
  }

  const handleDeleteConfirm = async () => {
    if (chatToDelete) {
      await deleteChat(chatToDelete.id)
      setDeleteDialogOpen(false)
      setChatToDelete(null)
      router.push('/chat')
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setChatToDelete(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent, chatId: string) => {
    if (e.key === 'Enter') {
      handleRenameSubmit(chatId)
    } else if (e.key === 'Escape') {
      handleRenameCancel()
    }
  }

  if (chats.length === 0) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden flex-1 flex flex-col min-h-0">
        <SidebarGroupLabel>Chats</SidebarGroupLabel>
        <div className="justify-center flex flex-1 items-center">
          <p className="text-xs text-sidebar-foreground/70">No chats yet</p>
        </div>
      </SidebarGroup>
    )
  }

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden flex-1 flex flex-col min-h-0">
        <SidebarGroupLabel>Chats</SidebarGroupLabel>
        <SidebarMenu className="flex-1 overflow-y-auto custom-scrollbar">
          {chats.map((chat) => {
            const chatUrl = `/chat/${chat.id}`
            const isActive = pathname === chatUrl
            const isRenaming = renamingChatId === chat.id

            return (
              <SidebarMenuItem key={chat.id} className="group/item">
                <SidebarMenuButton asChild>
                  <button
                    onClick={() => router.push(chatUrl)}
                    className={cn(
                      'flex items-center space-x-2 p-2 rounded-md w-full text-left',
                      isActive ? 'bg-accent' : 'group-hover/item:bg-muted'
                    )}
                  >
                    <MessageCircle
                      className={cn(
                        'transition-colors icon-nav',
                        isActive
                          ? 'text-foreground'
                          : 'text-muted-foreground group-hover/menu-item:text-foreground'
                      )}
                    />
                    <span className="truncate flex-1">{chat.name}</span>
                  </button>
                </SidebarMenuButton>
                <DropdownMenu
                  open={openDropdownId === chat.id}
                  onOpenChange={(open) => {
                    if (open) {
                      setOpenDropdownId(chat.id)
                    } else {
                      setOpenDropdownId(null)
                      if (renamingChatId === chat.id) {
                        setRenamingChatId(null)
                        setNewChatName('')
                      }
                    }
                  }}
                >
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
                    {isRenaming ? (
                      <div className="flex items-center gap-1 p-1">
                        <Input
                          value={newChatName}
                          onChange={(e) => setNewChatName(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, chat.id)}
                          className="h-7 text-xs flex-1 min-w-0"
                          autoFocus
                        />
                        <Button
                          onClick={() => handleRenameSubmit(chat.id)}
                          size="icon"
                          variant="outline"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleRenameClick(chat)
                        }}
                      >
                        <PenSquare className="text-muted-foreground" />
                        <span>Rename</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="focus:bg-red-500/10"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDeleteClick(chat)
                      }}
                    >
                      <Trash2 className="text-destructive" />
                      <span className="text-destructive">Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroup>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{chatToDelete?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
