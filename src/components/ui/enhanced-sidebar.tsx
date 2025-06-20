
// This file is a copy of the provided src/components/ui/sidebar.tsx
// with minor adjustments for theme and potentially new elements like SidebarTitle.
// The original sidebar.tsx might be overwritten or used by other scaffolding logic,
// so this copy ensures its availability and allows modifications specific to LearnLog's needs.

"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import type { VariantProps} from "class-variance-authority";
import { cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile" // Assuming this hook exists
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "learnlog_sidebar_state" // App-specific cookie name
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "280px" // Updated width
const SIDEBAR_WIDTH_MOBILE = "20rem" // Can adjust if needed, 280px is ~17.5rem
const SIDEBAR_WIDTH_ICON = "80px" // Updated collapsed width
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)

    const [_open, _setOpen] = React.useState(() => {
      if (typeof window !== 'undefined') {
        const storedState = document.cookie.split('; ').find(row => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`))?.split('=')[1];
        return storedState ? storedState === 'true' : defaultOpen;
      }
      return defaultOpen;
    });
    
    const open = openProp ?? _open
    
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }
        if (typeof window !== 'undefined') {
          document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
        }
      },
      [setOpenProp, open]
    )

    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((currentOpen) => !currentOpen)
        : setOpen((currentOpen) => !currentOpen)
    }, [isMobile, setOpen, setOpenMobile])

    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    const state = open ? "expanded" : "collapsed"

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn(
              "group/sidebar-wrapper flex min-h-0 w-full flex-grow has-[[data-variant=inset]]:bg-sidebar", // min-h-0 and flex-grow for better layout integration
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"
  }
>(
  (
    {
      side = "left",
      variant = "floating", // Default variant for LearnLog
      collapsible = "icon", // Default collapsible for LearnLog
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground",
            side === "left" ? "border-r border-sidebar-border" : "border-l border-sidebar-border",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      )
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden supports-[backdrop-filter]:backdrop-blur-lg"
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
          >
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      )
    }

    // This container creates the 8px inset margin via padding
    const sidebarOuterContainerClasses = cn(
        "duration-200 fixed inset-y-0 z-10 hidden h-full transition-[left,right,width] ease-linear md:flex",
        side === "left"
          ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
          : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
        "p-2", // This creates the 8px inset margin
        collapsible === "icon" ? 
          (state === "expanded" ? "w-[calc(var(--sidebar-width)_+_theme(spacing.4))]" : "w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]") :
          "w-[calc(var(--sidebar-width)_+_theme(spacing.4))]",
         className
    );

    // This is the actual sidebar visual element
    const sidebarInnerClasses = cn(
        "flex h-full w-full flex-col bg-sidebar text-sidebar-foreground border border-sidebar-border rounded-2xl shadow-glass supports-[backdrop-filter]:backdrop-blur-lg",
        // Specific variant styles might not be needed if all are glassmorphic now
        // variant === "floating" && "rounded-2xl border border-sidebar-border shadow-glass",
        // variant === "inset" && "rounded-2xl" 
    );


    return (
      <div
        ref={ref}
        className="group peer hidden md:block text-sidebar-foreground shrink-0" // shrink-0 to prevent squishing
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant} // Keep variant for potential future differences
        data-side={side}
      >
        {/* This div creates the space for the sidebar, considering the inset margin */}
         <div
          className={cn(
            "duration-200 relative h-full bg-transparent transition-[width] ease-linear",
            "group-data-[collapsible=offcanvas]:w-0",
            collapsible === "icon" ? 
              (state === "expanded" ? "w-[calc(var(--sidebar-width)_+_theme(spacing.4))]" : "w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]") :
              "w-[calc(var(--sidebar-width)_+_theme(spacing.4))]"
          )}
        />
        <div
          className={sidebarOuterContainerClasses}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className={sidebarInnerClasses}
          >
            {children}
          </div>
        </div>
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("px-4 py-2 text-lg font-semibold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden", className)}
    {...props}
  >
    {children}
  </h2>
));
SidebarTitle.displayName = "SidebarTitle";


const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={cn(
        "relative flex min-h-0 flex-1 flex-col bg-background overflow-auto", // min-h-0 and overflow-auto
        // Adjust margin for main content when sidebar is floating/inset
        "md:peer-data-[variant=floating]:ml-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]",
        "md:peer-data-[state=expanded]:peer-data-[variant=floating]:ml-[calc(var(--sidebar-width)_+_theme(spacing.4))]",
        // Fallback for non-floating or if logic needs adjustment
        "peer-data-[variant=inset]:min-h-[calc(100%-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
        className
      )}
      {...props}
    />
  )
})
SidebarInset.displayName = "SidebarInset"

const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        "h-9 w-full bg-sidebar-accent border-sidebar-border text-sidebar-foreground shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarInput.displayName = "SidebarInput"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-3 border-b border-sidebar-border", className)} // Adjusted padding
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-3 border-t border-sidebar-border mt-auto", className)} // Adjusted padding, mt-auto
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn("mx-3 my-2 w-auto bg-sidebar-border group-data-[collapsible=icon]:hidden", className)} // Adjusted margin
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-1 overflow-auto", 
        className
      )}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"


const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col gap-1 p-2", className)} 
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center justify-start gap-2.5 overflow-hidden rounded-md p-2.5 text-left text-sm outline-none ring-sidebar-ring transition-all focus-visible:ring-2 group-data-[collapsible=icon]:justify-center [&>svg]:size-5 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary data-[active=true]:text-primary data-[active=true]:bg-transparent data-[active=true]:hover:bg-sidebar-accent",
        // outline might not be needed if all buttons follow the same style
      },
      size: { 
        default: "h-10 text-sm", // 40px height
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
    shortcut?: string // Kept for potential future use, but won't be displayed by default
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      tooltip,
      shortcut, // Kept in props but not rendered for now
      className,
      children, 
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const { isMobile, state } = useSidebar()

    const buttonContent = (
      <>
        {children} {/* Icon and Text */}
        {/* Tooltip content for collapsed state */}
        <span className="sr-only group-data-[collapsible=icon]:not-sr-only group-data-[collapsible=icon]:hidden">
          {typeof tooltip === 'string' ? tooltip : (children as any)?.props?.children || ''}
        </span>
      </>
    );
    
    const button = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), 
          "group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:h-12", // 80px width - padding = ~56px. Size for icon button
          className)}
        {...props}
      >
        {buttonContent}
      </Comp>
    )


    if (!tooltip) { 
      return button
    }
    
    const tooltipText = typeof tooltip === 'string' ? tooltip : state === "collapsed" && !isMobile ? (children as any)?.props?.children || '' : '';


    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        {tooltipText && (
           <TooltipContent
            side="right"
            align="center"
            hidden={state !== "collapsed" || isMobile} // Only show tooltip when collapsed and not mobile
            className="bg-popover text-popover-foreground border-border shadow-lg"
          >
            {tooltipText}
          </TooltipContent>
        )}
      </Tooltip>
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"


const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu-sub"
    className={cn(
      "ml-4 my-1 flex min-w-0 flex-col gap-0.5 border-l border-sidebar-border pl-3", 
      "group-data-[collapsible=icon]:hidden",
      className
    )}
    {...props}
  />
))
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement, 
  React.ComponentProps<"a"> & {
    asChild?: boolean
    isActive?: boolean
  }
>(({ asChild = false, isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-active={isActive}
      className={cn(
        "flex h-8 min-w-0 items-center gap-2 overflow-hidden rounded-md px-2.5 text-sm text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-primary focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-primary disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-primary",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarSeparator,
  SidebarTitle,
  SidebarTrigger,
  useSidebar,
}

