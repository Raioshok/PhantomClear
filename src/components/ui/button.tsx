import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium cursor-pointer transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-primary/90 hover:shadow-[0_0_18px_color-mix(in_srgb,var(--primary)_30%,transparent)]',
        destructive:
          'bg-destructive text-white font-medium hover:bg-destructive/90 shadow-[0_0_14px_color-mix(in_srgb,var(--destructive)_25%,transparent)] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
        outline:
          'border border-border/80 bg-secondary/40 text-foreground shadow-xs hover:bg-secondary hover:border-primary/30 hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground border border-border/40 hover:bg-secondary/80 hover:border-border',
        ghost:
          'hover:bg-secondary/70 hover:text-foreground dark:hover:bg-accent/40',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5 text-xs',
        lg: 'h-10 rounded-xl px-6 has-[>svg]:px-4 font-medium',
        icon: 'size-9 rounded-xl',
        'icon-sm': 'size-8 rounded-lg',
        'icon-lg': 'size-10 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
