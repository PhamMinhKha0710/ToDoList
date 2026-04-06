import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUIStore } from "@/stores/ui.store"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function ThemeToggle() {
  const { darkMode, toggleDarkMode } = useUIStore()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleDarkMode} 
            className="h-10 w-10 text-muted-foreground hover:text-primary transition-colors hover:bg-accent rounded-full relative"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute inset-0 m-auto h-5 w-5 rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Đổi giao diện</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Đổi sang giao diện {darkMode ? "Sáng" : "Tối"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
