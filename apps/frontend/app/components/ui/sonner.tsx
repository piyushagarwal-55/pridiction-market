import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-[#1e293b] group-[.toaster]:to-[#0f172a] group-[.toaster]:text-[#f1f5f9] group-[.toaster]:border-[#3b82f6] group-[.toaster]:shadow-lg group-[.toaster]:backdrop-blur-md',
          description: 'group-[.toast]:text-[#cbd5e1]',
          actionButton:
            'group-[.toast]:bg-[#3b82f6] group-[.toast]:text-[#f1f5f9]',
          cancelButton:
            'group-[.toast]:bg-[#1e293b] group-[.toast]:text-[#cbd5e1]',
          success: 'group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-[#1e293b] group-[.toaster]:to-[#0f172a] group-[.toaster]:border-[#10b981]',
          error: 'group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-[#1e293b] group-[.toaster]:to-[#0f172a] group-[.toaster]:border-[#ef4444]',
          info: 'group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-[#1e293b] group-[.toaster]:to-[#0f172a] group-[.toaster]:border-[#06b6d4]',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
