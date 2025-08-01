import DashboardSidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  
  return (
    <div className="flex bg-darken justify-center container mx-auto w-full md:max-w-5xl max-w-sm pt-10">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
} 