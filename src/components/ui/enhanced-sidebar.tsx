
// This file is a copy of the provided src/components/ui/sidebar.tsx
// with minor adjustments for theme and potentially new elements like SidebarTitle.
// The original sidebar.tsx might be overwritten or used by other scaffolding logic,
// so this copy ensures its availability and allows modifications specific to Notel's needs.
// With the shift to command palette, this component's usage might be limited or repurposed.

"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import type { VariantProps} from "class-variance-authority";
import { cva } from "class-variance-authority"
import { PanelLeft, PanelRight, PanelLeftOpen, PanelLeftClose, PanelRightOpen, PanelRightClose } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile" 
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
// import { Skeleton } from "@/components/ui/skeleton" // Not used in current version
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "Notel_sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "280px" 
const SIDEBAR_WIDTH_MOBILE = "20rem" 
const SIDEBAR_WIDTH_ICON = "80px" 
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContextType = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
  side: "left" | "right"
  collapsible: "offcanvas" | "icon" | "none";
}

const SidebarContext = React.createContext<SidebarContextType | null>(null)

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
    side?: "left" | "right" // Added side here
    collapsible?: "offcanvas" | "icon" | "none"; // Added collapsible here
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      side = "left", // Default side
      collapsible = "icon", // Default collapsible behavior
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
        const storedState = document.cookie.split('; ').find(row => row.startsWith(`${SIDEBAR_COOKIE_NAME}_${side}=`))?.split('=')[1];
        return storedState ? storedState === 'true' : defaultOpen;
      }
      return defaultOpen;
    });
    
    const open = openProp ?? _open
    
    const setOpen = React.useCallback(
      (value: boolean | ((currentOpen: boolean) => boolean)) => {
        const newOpenState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(newOpenState);
        } else {
          _setOpen(newOpenState);
        }
        if (typeof window !== 'undefined') {
          document.cookie = `${SIDEBAR_COOKIE_NAME}_${side}=${newOpenState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
        }
      },
      [setOpenProp, open, side]
    );

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

    const contextValue = React.useMemo<SidebarContextType>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
        side,
        collapsible,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar, side, collapsible]
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
              "group/sidebar-wrapper flex min-h-0 w-full flex-grow", 
              // "has-[[data-variant=inset]]:bg-sidebar", // inset variant styling may change
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
  React.ComponentProps<"div">
  // Props like side, variant, collapsible are now on SidebarProvider
>(
  (
    {
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile, side, collapsible, variant = "floating" } = useSidebar();


    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full w-[--sidebar-width] flex-col bg-popover text-popover-foreground", // Updated bg/text
            side === "left" ? "border-r border-border" : "border-l border-border", // Updated border color
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
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[--sidebar-width] bg-popover p-0 text-popover-foreground [&>button]:hidden supports-[backdrop-filter]:backdrop-blur-lg" // Updated bg/text
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
    
    // Desktop sidebar
    const sidebarOuterContainerClasses = cn(
        "duration-200 fixed inset-y-0 z-30 hidden h-full transition-[left,right,width] ease-linear md:flex",
        side === "left" ? "left-0" : "right-0", 
        "p-2", 
        collapsible === "icon" ? 
          (state === "expanded" ? "w-[calc(var(--sidebar-width)_+_theme(spacing.4))]" : "w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]") :
          "w-[calc(var(--sidebar-width)_+_theme(spacing.4))]",
         className 
    );

    const sidebarInnerClasses = cn(
        "flex h-full w-full flex-col bg-popover/80 text-popover-foreground border border-border/50 backdrop-blur-lg rounded-2xl shadow-glass supports-[backdrop-filter]:backdrop-blur-lg", // Glass effect
    );


    return (
      <div
        ref={ref}
        className="group peer hidden md:block text-popover-foreground shrink-0" 
        data-state={state}
        data-collapsible={collapsible} // Set consistently for group-data selectors
        data-variant={variant} 
        data-side={side} 
        {...props} 
      >
         <div
          className={cn(
            "duration-200 relative h-full bg-transparent transition-[width] ease-linear",
            collapsible === "icon" ? 
              (state === "expanded" ? "w-[calc(var(--sidebar-width)_+_theme(spacing.4))]" : "w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]") :
              "w-[calc(var(--sidebar-width)_+_theme(spacing.4))]"
          )}
        />
        <div
          className={sidebarOuterContainerClasses}
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
  const { toggleSidebar, open, side, isMobile, openMobile, collapsible } = useSidebar();
  
  if (collapsible === 'none' && !isMobile) return null; // Don't render trigger if not collapsible on desktop

  const currentOpen = isMobile ? openMobile : open;

  let IconComponent;
  if (side === 'left') {
    IconComponent = currentOpen ? PanelLeftClose : PanelLeftOpen;
  } else { // side === 'right'
    IconComponent = currentOpen ? PanelRightClose : PanelRightOpen;
  }


  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8 text-foreground hover:bg-accent/10 hover:text-accent-foreground", className)} // Updated colors
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <IconComponent />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => {
  const { collapsible } = useSidebar();
  return (
    <h2
      ref={ref}
      className={cn(
        "px-4 py-2 text-lg font-semibold tracking-tight text-popover-foreground", // Updated text color
        collapsible === 'icon' && "group-data-[state=collapsed]:hidden",
         className
        )}
      {...props}
    >
      {children}
    </h2>
  );
});
SidebarTitle.displayName = "SidebarTitle";


const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => {
  const { side, state, collapsible, variant } = useSidebar();
  const isIconCollapsible = collapsible === 'icon';
  const isFloating = variant === 'floating';

  return (
    <main
      ref={ref}
      className={cn(
        "relative flex min-h-0 flex-1 flex-col bg-background overflow-auto transition-all duration-200 ease-linear", 
        // Desktop adjustments based on sidebar side, state, and variant
        !isIconCollapsible && isFloating && side === 'left' && "md:ml-[calc(var(--sidebar-width)_+_theme(spacing.4))]",
        !isIconCollapsible && isFloating && side === 'right' && "md:mr-[calc(var(--sidebar-width)_+_theme(spacing.4))]",
        
        isIconCollapsible && isFloating && side === 'left' && 
          (state === 'expanded' ? "md:ml-[calc(var(--sidebar-width)_+_theme(spacing.4))]" : "md:ml-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"),
        
        isIconCollapsible && isFloating && side === 'right' &&
          (state === 'expanded' ? "md:mr-[calc(var(--sidebar-width)_+_theme(spacing.4))]" : "md:mr-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"),

        // Inset variant specific styles (might need review based on final design)
        // variant === 'inset' && "min-h-[calc(100%-theme(spacing.4))] md:m-2 md:rounded-xl md:shadow",
        // variant === 'inset' && side === 'left' && (state === 'collapsed' ? "md:ml-2" : "md:ml-0"),
        // variant === 'inset' && side === 'right' && (state === 'collapsed' ? "md:mr-2" : "md:mr-0"),
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
  const { collapsible } = useSidebar();
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        "h-9 w-full bg-accent/20 border-border text-popover-foreground shadow-none focus-visible:ring-2 focus-visible:ring-ring", // Updated styles
        collapsible === 'icon' && "group-data-[state=collapsed]:hidden",
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
      className={cn("flex flex-col gap-2 p-3 border-b border-border/50", className)} // Updated border
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
      className={cn("flex flex-col gap-2 p-3 border-t border-border/50 mt-auto", className)} // Updated border
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  const { collapsible } = useSidebar();
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn(
        "mx-3 my-2 w-auto bg-border/50", // Updated color
        collapsible === 'icon' && "group-data-[state=collapsed]:hidden",
        className
      )} 
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
        "flex min-h-0 flex-1 flex-col gap-1 overflow-auto custom-scrollbar", // Added custom-scrollbar
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
  "peer/menu-button flex w-full items-center justify-start gap-2.5 overflow-hidden rounded-md p-2.5 text-left outline-none ring-ring transition-all focus-visible:ring-2 group-data-[collapsible=icon]:group-data-[state=expanded]:justify-start group-data-[collapsible=icon]:group-data-[state=collapsed]:justify-center [&>svg]:size-5 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "text-popover-foreground hover:bg-accent/10 data-[active=true]:text-primary data-[active=true]:bg-transparent data-[active=true]:hover:bg-accent/10 data-[active=true]:shadow-[inset_3px_0_0_0_hsl(var(--primary))]", // Updated styles for active state
        
      },
      size: { 
        default: "h-10 text-sm", 
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
    shortcut?: string 
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      tooltip,
      shortcut, 
      className,
      children, 
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const { isMobile, state, side, collapsible } = useSidebar();
    const isIconOnly = collapsible === 'icon' && state === 'collapsed' && !isMobile;

    const buttonContent = (
      <>
        {children}
        {shortcut && !isIconOnly && (
            <span className="ml-auto text-xs text-muted-foreground group-data-[state=collapsed]:hidden">
                {shortcut}
            </span>
        )}
      </>
    );
    
    const button = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), 
          isIconOnly && "w-12 h-12 p-0 flex items-center justify-center",
          className)}
        {...props}
      >
        {buttonContent}
      </Comp>
    )

    if (!tooltip || isMobile) { 
      return button
    }
    
    const tooltipText = typeof tooltip === 'string' ? tooltip : (isIconOnly ? (children as any)?.props?.children || '' : '');

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        {tooltipText && (
           <TooltipContent
            side={side === 'left' ? 'right' : 'left'}
            align="center"
            hidden={!isIconOnly} // Only show tooltip when icon-only and not mobile
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
>(({ className, ...props }, ref) => {
  const { collapsible } = useSidebar();
  return (
  <ul
    ref={ref}
    data-sidebar="menu-sub"
    className={cn(
      "ml-4 my-1 flex min-w-0 flex-col gap-0.5 border-l border-border/30 pl-3", // Updated border
      collapsible === 'icon' && "group-data-[state=collapsed]:hidden",
      className
    )}
    {...props}
  />
  );
})
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement, 
  React.ComponentProps<"a"> & { // Changed from button to a for Link compatibility
    asChild?: boolean
    isActive?: boolean
  }
>(({ asChild = false, isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";
  const { collapsible } = useSidebar();

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-active={isActive}
      className={cn(
        "flex h-8 min-w-0 items-center gap-2 overflow-hidden rounded-md px-2.5 text-sm text-popover-foreground outline-none ring-ring hover:bg-accent/10 hover:text-primary focus-visible:ring-2 active:bg-accent/20 active:text-primary disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        "data-[active=true]:bg-accent/10 data-[active=true]:font-medium data-[active=true]:text-primary", // Updated active styles
        collapsible === 'icon' && "group-data-[state=collapsed]:hidden",
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
