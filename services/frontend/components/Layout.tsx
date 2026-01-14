'use client'

import { useState, ReactNode } from 'react'
import Sidebar from './Sidebar'
import Breadcrumb from './Breadcrumb'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between px-6 py-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900 p-2 rounded-md hover:bg-slate-100"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb */}
            <Breadcrumb />

            {/* System Status */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-success-50 border border-success-200 rounded-md">
                <div className="h-2 w-2 bg-success-500 rounded-full"></div>
                <span className="text-success-700 text-sm font-medium">System Online</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <p>© 2025 Wan2.2 LoRA Training Pipeline</p>
            <div className="flex items-center gap-4">
              <span>V100 × 2</span>
              <span>•</span>
              <span>170K Samples</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
