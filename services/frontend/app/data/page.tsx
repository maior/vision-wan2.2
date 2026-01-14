'use client'

import { useState } from 'react'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MetricCard } from '@/components/ui/MetricCard'
import {
  CubeIcon,
  VideoCameraIcon,
  PhotoIcon,
  FolderIcon,
  DocumentTextIcon,
  BeakerIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

export default function DataPage() {
  const [dataStats] = useState({
    total: 199994,
    videos: 100000,
    images: 99994,
    preprocessed: 199994,
    trainSplit: 179994,
    valSplit: 20000,
    testSplit: 100
  })

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Data Management</h1>
        <p className="text-sm text-slate-600 mt-1">MBC Dataset - Original and preprocessed data</p>
      </div>

      {/* Data Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Total Data"
          value={dataStats.total.toLocaleString()}
          subtitle="MBC Original Dataset"
          icon={<CubeIcon className="w-6 h-6 text-slate-600" />}
        />
        <MetricCard
          title="Videos"
          value={dataStats.videos.toLocaleString()}
          subtitle="MP4 files"
          icon={<VideoCameraIcon className="w-6 h-6 text-slate-600" />}
        />
        <MetricCard
          title="Images"
          value={dataStats.images.toLocaleString()}
          subtitle="JPG/PNG files"
          icon={<PhotoIcon className="w-6 h-6 text-slate-600" />}
        />
      </div>

      {/* Dataset Split */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Dataset Split</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <SplitRow
              label="Training Data (90%)"
              count={dataStats.trainSplit}
              total={dataStats.total}
              color="primary"
            />
            <SplitRow
              label="Validation Data (10%)"
              count={dataStats.valSplit}
              total={dataStats.total}
              color="success"
            />
            <SplitRow
              label="Overfitting Test Data"
              count={dataStats.testSplit}
              total={dataStats.total}
              color="warning"
            />
          </div>
        </CardContent>
      </Card>

      {/* File Locations */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>File Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FileLocation
              label="Original Data"
              path="/home/devfit2/mbc_json/"
              description="JSON metadata + media files"
              icon={<FolderIcon className="w-6 h-6 text-slate-600" />}
            />
            <FileLocation
              label="Preprocessed Data"
              path="./preprocessed_data/"
              description="CSV format metadata"
              icon={<FolderIcon className="w-6 h-6 text-slate-600" />}
            />
            <FileLocation
              label="Training Data"
              path="./preprocessed_data/all_train.csv"
              description="179,994 samples"
              icon={<DocumentTextIcon className="w-6 h-6 text-slate-600" />}
            />
            <FileLocation
              label="Validation Data"
              path="./preprocessed_data/all_val.csv"
              description="20,000 samples"
              icon={<DocumentTextIcon className="w-6 h-6 text-slate-600" />}
            />
            <FileLocation
              label="Test Data"
              path="./preprocessed_data/test_100.csv"
              description="100 samples (balanced sampling)"
              icon={<BeakerIcon className="w-6 h-6 text-slate-600" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Resolution Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <ResolutionBar label="1920×1080" percentage={77.78} color="primary" />
              <ResolutionBar label="1280×720" percentage={5.86} color="success" />
              <ResolutionBar label="Other" percentage={16.36} color="slate" />
            </div>
            <div className="mt-4 flex items-start gap-2 bg-warning-50 rounded-lg p-3 border border-warning-200">
              <ExclamationTriangleIcon className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
              <p className="text-warning-800 text-sm">
                77.78% is 1920×1080 resolution (not supported by Wan2.2) - preprocessing required
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <CategoryBar label="Drama" count={45231} color="purple" />
              <CategoryBar label="Entertainment" count={38492} color="pink" />
              <CategoryBar label="News" count={32441} color="primary" />
              <CategoryBar label="Documentary" count={28330} color="success" />
              <CategoryBar label="Other" count={55500} color="slate" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/preprocessing">
          <Button variant="primary" className="w-full flex items-center justify-center gap-2">
            <Cog6ToothIcon className="w-5 h-5" />
            Start Preprocessing
          </Button>
        </Link>
        <Link href="/quality">
          <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
            <MagnifyingGlassIcon className="w-5 h-5" />
            Quality Validation
          </Button>
        </Link>
      </div>
    </Layout>
  )
}

function SplitRow({ label, count, total, color }: any) {
  const percentage = (count / total * 100).toFixed(2)
  const colorClasses: any = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
  }

  return (
    <div>
      <div className="flex justify-between text-slate-900 mb-2">
        <span className="font-medium">{label}</span>
        <span className="font-mono text-sm">{count.toLocaleString()} ({percentage}%)</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-3">
        <div
          className={`${colorClasses[color]} h-3 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}

function FileLocation({ label, path, description, icon }: any) {
  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-slate-100 rounded-lg">{icon}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 mb-1">{label}</h4>
          <code className="text-xs text-primary-600 bg-slate-100 px-2 py-1 rounded block overflow-x-auto">{path}</code>
          <p className="text-slate-600 text-sm mt-2">{description}</p>
        </div>
      </div>
    </div>
  )
}

function ResolutionBar({ label, percentage, color }: any) {
  const colorClasses: any = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    slate: 'bg-slate-400',
  }

  return (
    <div>
      <div className="flex justify-between text-slate-700 text-sm mb-1">
        <span>{label}</span>
        <span className="font-semibold">{percentage.toFixed(2)}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div
          className={`${colorClasses[color]} h-2 rounded-full`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}

function CategoryBar({ label, count, color }: any) {
  const colorClasses: any = {
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    slate: 'bg-slate-400',
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1">
        <div className={`w-3 h-3 rounded-full ${colorClasses[color]}`}></div>
        <span className="text-slate-700 text-sm">{label}</span>
      </div>
      <span className="text-slate-900 font-semibold">{count.toLocaleString()}</span>
    </div>
  )
}
