'use client'
import * as Clerk from '@clerk/elements/common'
import * as SignIn from '@clerk/elements/sign-in'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import Loader from '@/components/global/loader'
import Link from 'next/link'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="w-full max-w-[20rem]">
        <SignIn.Root>
          <Clerk.Loading>
            {(isGlobalLoading) => (
              <>
                <SignIn.Step name="start" className="space-y-4">
                  <div className="flex flex-col items-center">
                    <Clerk.Connection name="google" asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        type="button"
                        disabled={isGlobalLoading}
                      >
                        <Clerk.Loading scope="provider:google">
                          {(isLoading) =>
                            isLoading ? (
                              <>
                                <Loader className="mr-1" />
                              </>
                            ) : (
                              <>
                                <Image
                                  src="/icons/google.svg"
                                  alt="Google"
                                  className="mr-1"
                                  width={16}
                                  height={16}
                                />
                                Sign in with Google
                              </>
                            )
                          }
                        </Clerk.Loading>
                      </Button>
                    </Clerk.Connection>
                  </div>
                  <p className="flex justify-center items-center gap-x-3 text-sm text-muted-foreground">
                    or
                  </p>
                  <Clerk.Field name="emailAddress" className="space-y-2">
                    <Clerk.Input type="email" required asChild autoComplete="off">
                      <Input placeholder="Email" />
                    </Clerk.Input>
                    <Clerk.FieldError className="block text-sm text-destructive" />
                  </Clerk.Field>

                  <div className="grid w-full gap-y-4">
                  <div id="clerk-captcha" data-cl-theme="light" data-cl-size="flexible" />
                    <SignIn.Action submit asChild>
                      <Button size="sm" disabled={isGlobalLoading}>
                        <Clerk.Loading>
                          {(isLoading) => {
                            return isLoading ? <Loader className="text-white" /> : 'Continue'
                          }}
                        </Clerk.Loading>
                      </Button>
                    </SignIn.Action>

                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        Don&apos;t have an account?
                      </span>
                      <Button
                        variant="link"
                        className="text-sm px-0"
                        size="sm"
                        asChild
                      >
                        <Link href="/sign-up">Sign up</Link>
                      </Button>
                    </div>
                  </div>
                </SignIn.Step>

                <SignIn.Step name="verifications">
                  <SignIn.Strategy name="email_code">
                    <Card className="w-full sm:w-96 border-none shadow-none">
                      <CardHeader className="items-center text-center">
                        <CardTitle>Check your email</CardTitle>
                        <CardDescription>
                          We&apos;ve sent you a verification code
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-y-4">
                        <div className="grid items-center justify-center gap-y-2">
                          <Clerk.Field name="code" className="space-y-2">
                            <Clerk.Label className="sr-only">
                              Verification code
                            </Clerk.Label>
                            <div className="flex justify-center text-center">
                              <Clerk.Input
                                type="otp"
                                className="flex justify-center has-[:disabled]:opacity-50"
                                autoSubmit
                                render={({ value, status }) => {
                                  return (
                                    <div
                                      data-status={status}
                                      className={cn(
                                        'relative flex size-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md',
                                        {
                                          'z-10 ring-2 ring-ring ring-offset-background':
                                            status === 'cursor' ||
                                            status === 'selected',
                                        }
                                      )}
                                    >
                                      {value}
                                      {status === 'cursor' && (
                                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                          <div className="animate-caret-blink h-4 w-px bg-foreground duration-1000" />
                                        </div>
                                      )}
                                    </div>
                                  )
                                }}
                              />
                            </div>
                            <Clerk.FieldError className="block text-center text-sm text-destructive" />
                          </Clerk.Field>
                          <div className="flex items-center justify-center space-x-2">
                            <span className="text-sm text-muted-foreground">
                              Didn&apos;t receive a code?
                            </span>
                            <SignIn.Action
                              asChild
                              resend
                              className="flex items-center justify-center"
                              fallback={({ resendableAfter }) => (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="px-0"
                                  disabled
                                >
                                  Resend (<>{resendableAfter}</>)
                                </Button>
                              )}
                            >
                              <Button
                                type="button"
                                variant="link"
                                size="sm"
                                className="px-0"
                              >
                                Resend
                              </Button>
                            </SignIn.Action>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <div className="grid w-full gap-y-4">
                          <SignIn.Action submit asChild>
                            <Button size="sm" disabled={isGlobalLoading}>
                              <Clerk.Loading>
                                {(isLoading) => {
                                  return isLoading ? <Loader /> : 'Continue'
                                }}
                              </Clerk.Loading>
                            </Button>
                          </SignIn.Action>
                        </div>
                      </CardFooter>
                    </Card>
                  </SignIn.Strategy>
                </SignIn.Step>
              </>
            )}
          </Clerk.Loading>
        </SignIn.Root>
      </div>
    </div>
  )
}
