'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-border/70 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        'bg-secondary/90 hover:bg-secondary',
        'data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:shadow-[0_0_12px_color-mix(in_srgb,var(--primary)_35%,transparent)]',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block size-5 rounded-full bg-foreground shadow-md ring-0 transition-transform duration-200',
          'data-[state=checked]:bg-primary-foreground',
          'data-[state=unchecked]:translate-x-0 data-[state=checked]:translate-x-5'
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
