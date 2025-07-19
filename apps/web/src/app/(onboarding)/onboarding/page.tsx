'use client'

import * as React from 'react'
import { useRef, useState } from 'react'
import { useAnimationFrame } from 'motion/react'
import { useOrganizationList, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { completeOnboarding } from '@/actions/clerk'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useMousePositionRef } from '@/hooks/use-mouse-position-ref'
import StatusDisplay from '@/components/global/status-display'

// Zod schema for form validation
const onboardingSchema = z.object({
  organizationName: z
    .string()
    .min(1, 'Team name is required')
    .min(2, 'Team name must be at least 2 characters')
    .max(50, 'Team name must be less than 50 characters')
    .regex(
      /^[a-zA-Z0-9\s\-_']+$/,
      'Team name can only contain letters, numbers, spaces, hyphens, underscores, and apostrophes'
    ),
})

type OnboardingFormData = z.infer<typeof onboardingSchema>

export default function OnboardingComponent() {
  const [error, setError] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0 })
  const { user } = useUser()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const placeholderText = user?.fullName?.split(' ')[0] + "'s Team"

  const positionRef = useMousePositionRef(
    containerRef as React.RefObject<HTMLElement>
  )

  useAnimationFrame(() => {
    const newX = positionRef.current?.x || 0
    const newY = positionRef.current?.y || 0
    setCoordinates({ x: newX, y: newY })
  })

  const { isLoaded, createOrganization } = useOrganizationList()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      organizationName: '',
    },
  })

  if (!isLoaded) return null

  const { x, y } = coordinates

  const onSubmit = async (data: OnboardingFormData) => {
    setIsLoading(true)
    setError('')

    try {
      const res = await completeOnboarding()
      if (res?.message) {
        await user?.reload()
      }
      if (res?.error) {
        setError(res?.error)
        return
      }

      await createOrganization({ name: data.organizationName })
        .then((res) => {
          console.log('Organization created:', res)
          reset()
          router.push('/')
        })
        .catch((err) => {
          console.error(
            'Organization creation error:',
            JSON.stringify(err, null, 2)
          )
          setError('Failed to create organization. Please try again.')
        })
    } catch (err) {
      console.error('Onboarding error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-transparent p-4 relative"
      ref={containerRef}
    >
      <Card className="w-full max-w-md bg-transparent border-none">
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="organizationName" className="text-sm font-medium">
                Team Name
              </Label>
              <Input
                id="organizationName"
                type="text"
                placeholder={placeholderText}
                disabled={isLoading}
                {...register('organizationName')}
                className={
                  errors.organizationName
                    ? 'border-red-500 focus:border-red-500'
                    : ''
                }
              />
              {errors.organizationName && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.organizationName.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter the name of your team.
              </p>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                Error: {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Setting up...' : 'Complete Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <StatusDisplay x={x} y={y} />
    </div>
  )
}
