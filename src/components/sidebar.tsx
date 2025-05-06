"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { VariantProps, cva } from "class-variance-authority";
import { PanelLeft } from "lucide-react";

// import { useIsMobile } from "@/hooks/use-mobile" // Temporarily commented out
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton"; // Fixed path
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Fixed path

const SIDEBAR_COOKIE_NAME = "sidebar:state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContext = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContext | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
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
    // const isMobile = useIsMobile() // Temporarily commented out
    const isMobile = false; // Temporarily set to false
    const [openMobile, setOpenMobile] = React.useState(false);

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          _setOpen(openState);
        }

        // This sets the cookie to keep the sidebar state.
        if (typeof document !== "undefined") {
          // Check if document is defined (for SSR/server environments)
          document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
        }
      },
      [setOpenProp, open]
    );

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open);
    }, [isMobile, setOpen, setOpenMobile]);

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          toggleSidebar();
        }
      };

      if (typeof window !== "undefined") {
        // Check if window is defined
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
      }
    }, [toggleSidebar]);

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = open ? "expanded" : "collapsed";

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
    );

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
              "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    );
  }
);
SidebarProvider.displayName = "SidebarProvider";

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right";
    variant?: "sidebar" | "floating" | "inset";
    collapsible?: "offcanvas" | "icon" | "none";
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      );
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
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
      );
    }

    return (
      <div
        ref={ref}
        className="group peer hidden md:block text-sidebar-foreground"
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
      >
        {/* This is what handles the sidebar gap on desktop */}
        <div
          className={cn(
            "duration-200 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-linear",
            "group-data-[collapsible=offcanvas]:w-0",
            "group-data-[side=right]:rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
          )}
        />
        <div
          className={cn(
            "duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] ease-linear md:flex",
            side === "left"
              ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
              : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
            // Adjust the padding for floating and inset variants.
            variant === "floating" || variant === "inset"
              ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l",
            className
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className={cn(
              "flex h-full flex-col bg-sidebar",
              variant === "floating" || variant === "inset" ? "rounded-md" : ""
            )}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }
);
Sidebar.displayName = "Sidebar";

const SidebarToggle = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    icon?: React.ReactNode;
    withTooltip?: boolean;
  }
>(({ icon, withTooltip = false, className, ...props }, ref) => {
  const { isMobile, toggleSidebar } = useSidebar();

  const ToggleIcon = icon || <PanelLeft className="h-6 w-6" />;

  if (isMobile) {
    return (
      <Button
        ref={ref}
        onClick={toggleSidebar}
        size="icon"
        variant="ghost"
        className={className}
        {...props}
      >
        {ToggleIcon}
      </Button>
    );
  }

  if (withTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={ref}
            size="icon"
            variant="ghost"
            onClick={toggleSidebar}
            className={cn(
              "duration-200 peer-data-[state=collapsed]:peer-data-[collapsible=icon]:rotate-180 peer-data-[state=collapsed]:peer-data-[side=right]:-rotate-180 peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-[-10px]",
              className
            )}
            {...props}
          >
            {ToggleIcon}
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="flex items-center gap-2 bg-sidebar text-sidebar-foreground"
        >
          <p>Toggle Sidebar</p>
          <kbd className="bg-background text-foreground ml-auto rounded px-2 py-1 text-xs font-semibold">
            ⌘B
          </kbd>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      ref={ref}
      size="icon"
      variant="ghost"
      onClick={toggleSidebar}
      className={cn(
        "duration-200 peer-data-[state=collapsed]:peer-data-[collapsible=icon]:rotate-180 peer-data-[state=collapsed]:peer-data-[side=right]:-rotate-180 peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-[-10px]",
        className
      )}
      {...props}
    >
      {ToggleIcon}
    </Button>
  );
});
SidebarToggle.displayName = "SidebarToggle";

const SidebarSearch = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => {
  const { state, open } = useSidebar();
  return (
    <div
      className={cn(
        "w-full",
        state === "collapsed" ? "hidden" : "",
        !open ? "px-2" : "px-3"
      )}
    >
      <Input ref={ref} {...props} className={cn("h-8 w-full", className)} />
    </div>
  );
});
SidebarSearch.displayName = "SidebarSearch";

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, children, ...props }, ref) => {
  const { state, open } = useSidebar();
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-2",
        state === "collapsed" ? "px-0" : "",
        open ? "" : "items-center px-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
SidebarHeader.displayName = "SidebarHeader";

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, children, ...props }, ref) => {
  const { open } = useSidebar();

  return (
    <div
      ref={ref}
      className={cn(
        "grow overflow-auto",
        !open ? "no-scrollbar" : "",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
SidebarContent.displayName = "SidebarContent";

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, children, ...props }, ref) => {
  const { state, open } = useSidebar();
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col",
        state === "collapsed" ? "p-0" : "",
        open ? "" : "items-center p-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
SidebarFooter.displayName = "SidebarFooter";

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, children, ...props }, ref) => {
  const { state, open } = useSidebar();
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-1",
        state === "collapsed" ? "px-0" : "",
        open ? "px-3 py-2" : "items-center px-2 py-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, children, ...props }, ref) => {
  const { state } = useSidebar();

  return (
    <div
      ref={ref}
      className={cn(
        "duration-200 text-xs font-medium text-muted-foreground transition-opacity",
        state === "collapsed" ? "opacity-0" : "opacity-100",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("flex flex-col gap-1", className)} {...props}>
      {children}
    </div>
  );
});
SidebarGroupContent.displayName = "SidebarGroupContent";

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, children, ...props }, ref) => {
  return (
    <ul ref={ref} className={cn("flex flex-col gap-1", className)} {...props}>
      {children}
    </ul>
  );
});
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, children, ...props }, ref) => {
  return (
    <li ref={ref} className={cn("flex", className)} {...props}>
      {children}
    </li>
  );
});
SidebarMenuItem.displayName = "SidebarMenuItem";

const SidebarMenuLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & { href: string }
>(({ className, href, children, ...props }, ref) => {
  const { open } = useSidebar();

  return (
    <a
      ref={ref}
      href={href}
      className={cn(
        "duration-200 flex w-full items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted",
        !open ? "justify-center px-0" : "",
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
});
SidebarMenuLink.displayName = "SidebarMenuLink";

const buttonVariants = cva(
  "relative flex w-full items-center justify-start gap-3 rounded-md px-2 py-2 text-start transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10",
        sm: "h-9",
        lg: "h-11",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>
>(({ className, children, variant = "ghost", size = "sm", ...props }, ref) => {
  const { open } = useSidebar();

  return (
    <button
      ref={ref}
      className={cn(
        buttonVariants({ variant, size }),
        !open ? "justify-center px-0" : "",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { open } = useSidebar();
  return (
    <Separator
      ref={ref}
      className={cn(
        "duration-200",
        open ? "mx-3 my-1" : "mx-1 my-1 rotate-90",
        className
      )}
      {...props}
    />
  );
});
SidebarSeparator.displayName = "SidebarSeparator";

const SidebarSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { open } = useSidebar();
  return (
    <div
      ref={ref}
      className={cn("flex w-full flex-col", open ? "p-3" : "p-2", className)}
      {...props}
    >
      <div
        className={cn(
          "mb-2 flex items-center gap-2",
          open ? "justify-between" : "justify-center"
        )}
      >
        <Skeleton
          className={cn(
            "h-8",
            open ? "w-[calc(100%-2.5rem)]" : "w-8 rounded-full"
          )}
        />
        <Skeleton className="h-8 w-8" />
      </div>
      <div className="flex flex-col gap-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn("h-8", open ? "w-full" : "w-8 rounded-full")}
          />
        ))}
      </div>
    </div>
  );
});
SidebarSkeleton.displayName = "SidebarSkeleton";

export {
  Sidebar,
  SidebarProvider,
  SidebarToggle,
  SidebarSearch,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuLink,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarSkeleton,
  useSidebar,
};
