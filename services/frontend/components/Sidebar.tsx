'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  FolderIcon,
  ChartBarIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  RocketLaunchIcon,
  DocumentChartBarIcon,
  WrenchScrewdriverIcon,
  ServerIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline'
import { Badge } from './ui/Badge'

interface MenuItem {
  id: string
  label: string
  icon: any
  path?: string
  badge?: { text: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: HomeIcon,
    path: '/'
  },
  {
    id: 'dataset',
    label: 'Dataset',
    icon: FolderIcon,
    children: [
      {
        id: 'dataset-browse',
        label: 'Browse',
        icon: FolderIcon,
        path: '/data'
      },
      {
        id: 'dataset-statistics',
        label: 'Statistics',
        icon: ChartBarIcon,
        path: '/data/statistics'
      },
    ]
  },
  {
    id: 'analysis',
    label: 'Analysis',
    icon: BeakerIcon,
    children: [
      {
        id: 'analysis-overview',
        label: 'Overview',
        icon: BeakerIcon,
        path: '/analysis'
      },
      {
        id: 'data-distribution',
        label: 'Data Distribution',
        icon: ChartBarIcon,
        path: '/data-distribution',
        badge: { text: 'NEW', variant: 'info' }
      },
    ]
  },
  {
    id: 'quality',
    label: 'Quality',
    icon: CheckCircleIcon,
    badge: { text: '99.4%', variant: 'success' },
    children: [
      {
        id: 'quality-overview',
        label: 'Overview',
        icon: ChartBarIcon,
        path: '/quality'
      },
      {
        id: 'quality-rapa-grade',
        label: 'RAPA Grade',
        icon: DocumentChartBarIcon,
        path: '/quality/rapa-grade',
        badge: { text: 'F', variant: 'error' }
      },
      {
        id: 'quality-caption-analysis',
        label: 'Caption Analysis',
        icon: DocumentTextIcon,
        path: '/quality/caption-analysis'
      },
      {
        id: 'quality-caption-improvement',
        label: 'Caption Enhancement',
        icon: SparklesIcon,
        path: '/quality/caption-improvement',
        badge: { text: 'NEW', variant: 'info' }
      },
      {
        id: 'quality-validation',
        label: 'Validation Report',
        icon: MagnifyingGlassIcon,
        path: '/quality/validation-report',
        badge: { text: 'NEW', variant: 'info' }
      },
    ]
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    icon: Cog6ToothIcon,
    children: [
      {
        id: 'pipeline-data-cleaning',
        label: 'Data Cleaning',
        icon: ExclamationTriangleIcon,
        path: '/preprocessing/data-cleaning',
        badge: { text: '✓', variant: 'success' }
      },
      {
        id: 'pipeline-preprocessing',
        label: 'Preprocessing',
        icon: Cog6ToothIcon,
        path: '/preprocessing',
        badge: { text: '✓', variant: 'success' }
      },
      {
        id: 'pipeline-training',
        label: 'Training Setup',
        icon: WrenchScrewdriverIcon,
        path: '/setup'
      },
      {
        id: 'pipeline-monitor',
        label: 'Training Monitor',
        icon: RocketLaunchIcon,
        path: '/training'
      },
      {
        id: 'pipeline-results',
        label: 'Results',
        icon: ChartBarIcon,
        path: '/results'
      },
      {
        id: 'pipeline-inference',
        label: 'LoRA Inference',
        icon: PlayCircleIcon,
        path: '/inference'
      },
    ]
  },
  {
    id: 'system',
    label: 'System',
    icon: ServerIcon,
    children: [
      {
        id: 'system-gpu',
        label: 'GPU Status',
        icon: ServerIcon,
        path: '/system/gpu'
      },
    ]
  }
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(['quality', 'pipeline'])

  // Auto-expand parent menu if child is active
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => child.path === pathname)
        if (hasActiveChild && !expandedItems.includes(item.id)) {
          setExpandedItems(prev => [...prev, item.id])
        }
      }
    })
  }, [pathname])

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const isActive = (path?: string) => {
    if (!path) return false
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }

  const renderMenuItem = (item: MenuItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.id)
    const active = isActive(item.path)
    const Icon = item.icon

    if (hasChildren) {
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleExpand(item.id)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-slate-100 text-slate-700"
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-slate-500" />
              <span>{item.label}</span>
              {item.badge && (
                <Badge variant={item.badge.variant} className="text-[10px] px-1.5 py-0">
                  {item.badge.text}
                </Badge>
              )}
            </div>
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Submenu */}
          <div className={`mt-1 ml-3 space-y-1 overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            {item.children?.map(child => renderMenuItem(child, depth + 1))}
          </div>
        </div>
      )
    }

    return (
      <Link key={item.id} href={item.path || '#'} onClick={onClose}>
        <div className={`
          flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors
          ${active
            ? 'bg-primary-50 text-primary-700 border border-primary-200'
            : 'text-slate-700 hover:bg-slate-100'
          }
          ${depth > 0 ? 'ml-8' : ''}
        `}>
          <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-slate-500'}`} />
            <span>{item.label}</span>
          </div>
          {item.badge && (
            <Badge variant={item.badge.variant} className="text-[10px] px-1.5 py-0">
              {item.badge.text}
            </Badge>
          )}
        </div>
      </Link>
    )
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900 bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Wan2.2</h1>
            <p className="text-xs text-slate-500 mt-0.5">LoRA Training</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 overflow-y-auto h-[calc(100vh-140px)]">
          <div className="space-y-1">
            {menuItems.map(item => renderMenuItem(item))}
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-white">
          <div className="flex items-center gap-2 px-3 py-2 bg-success-50 border border-success-200 rounded-md">
            <div className="h-2 w-2 bg-success-500 rounded-full"></div>
            <span className="text-xs font-medium text-success-700">V100 × 2 Ready</span>
          </div>
        </div>
      </aside>
    </>
  )
}
