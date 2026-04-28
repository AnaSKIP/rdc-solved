import { Outlet } from 'react-router-dom'
import { TopNav } from './TopNav'
import { InternalChat } from './InternalChat'

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-[hsl(var(--background))] font-sans text-gray-800 overflow-hidden w-full">
      <TopNav />
      <main className="flex-1 relative flex flex-col min-w-0 overflow-hidden bg-gray-100">
        <Outlet />
      </main>
      <InternalChat />
    </div>
  )
}
