'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MetricCard } from '@/components/ui/MetricCard'
import {
  VideoCameraIcon,
  PhotoIcon,
  ServerIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  RocketLaunchIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FolderIcon,
} from '@heroicons/react/24/outline'
import { getPreprocessingStatus } from '@/lib/api'

interface PreprocessingStatus {
  csv_updated: boolean
  total_data: number
  video: {
    total: number
    processed: number
    progress: number
  }
  image: {
    total: number
    processed: number
    progress: number
  }
  model: {
    downloaded: boolean
    files: number
    path: string
  }
  ready_for_training: boolean
}

export default function PreprocessingPage() {
  const [status, setStatus] = useState<PreprocessingStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getPreprocessingStatus()
        setStatus(data)
      } catch (error) {
        console.error('Failed to fetch preprocessing status:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStatus()
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  const preprocessingSteps = [
    { name: 'JSON Parsing', status: 'completed', progress: 100, time: '45 min' },
    { name: 'Caption Extraction', status: 'completed', progress: 100, time: '30 min' },
    { name: 'CSV Generation', status: 'completed', progress: 100, time: '15 min' },
    { name: 'Train/Val Split', status: 'completed', progress: 100, time: '5 min' },
  ]

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-600">Loading preprocessing status...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Data Preprocessing</h1>
        <p className="text-sm text-slate-600 mt-1">MBC Dataset → CSV conversion and splitting</p>
      </div>

      {/* Training Ready Alert */}
      {status?.ready_for_training ? (
        <Card className="mb-8 border-success-200 bg-success-50">
          <CardContent className="py-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-success-100 rounded-lg">
                  <RocketLaunchIcon className="w-6 h-6 text-success-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-success-900">Ready for Training</h3>
                  <p className="text-sm text-success-700 mt-1">
                    All preprocessing complete. {status.total_data.toLocaleString()} samples ready for LoRA fine-tuning.
                  </p>
                </div>
              </div>
              <Link href="/training">
                <Button variant="primary" size="sm">
                  Start Training
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8 border-warning-200 bg-warning-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-warning-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-warning-600" />
              </div>
              <div>
                <h3 className="font-semibold text-warning-900">Preprocessing In Progress</h3>
                <p className="text-sm text-warning-700 mt-1">
                  Some tasks are still running. Please wait for completion.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Video Processing */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <VideoCameraIcon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Video</h3>
              </div>
              <Badge variant={status?.video.progress === 100 ? 'success' : 'info'}>
                {status?.video.progress === 100 ? 'Complete' : 'Processing'}
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Processed</span>
                <span className="font-semibold text-slate-900">{status?.video.processed.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total</span>
                <span className="font-semibold text-slate-900">{status?.video.total.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
                <div
                  className={`h-2 rounded-full transition-all ${
                    status?.video.progress === 100 ? 'bg-success-500' : 'bg-primary-500'
                  }`}
                  style={{ width: `${status?.video.progress}%` }}
                ></div>
              </div>
              <div className="text-center mt-2">
                <span className="text-xl font-bold text-slate-900">{status?.video.progress.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Processing */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <PhotoIcon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Image</h3>
              </div>
              <Badge variant={status?.image.progress === 100 ? 'success' : 'info'}>
                {status?.image.progress === 100 ? 'Complete' : 'Processing'}
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Processed</span>
                <span className="font-semibold text-slate-900">{status?.image.processed.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total</span>
                <span className="font-semibold text-slate-900">{status?.image.total.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
                <div
                  className={`h-2 rounded-full transition-all ${
                    status?.image.progress === 100 ? 'bg-success-500' : 'bg-primary-500'
                  }`}
                  style={{ width: `${status?.image.progress}%` }}
                ></div>
              </div>
              <div className="text-center mt-2">
                <span className="text-xl font-bold text-slate-900">{status?.image.progress.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Model Download */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <ServerIcon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Model</h3>
              </div>
              <Badge variant={status?.model.downloaded ? 'success' : 'warning'}>
                {status?.model.downloaded ? 'Complete' : 'Downloading'}
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Files</span>
                <span className="font-semibold text-slate-900">{status?.model.files.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Status</span>
                <span className="font-semibold text-slate-900">
                  {status?.model.downloaded ? 'Complete' : 'In Progress'}
                </span>
              </div>
              <div className="mt-3 text-xs text-slate-500 break-all">
                {status?.model.path}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CSV Update Status */}
      <Card className="mb-8">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">CSV Path Update</h3>
                <p className="text-sm text-slate-600">Updated with preprocessed file paths</p>
              </div>
            </div>
            <Badge variant={status?.csv_updated ? 'success' : 'error'}>
              {status?.csv_updated ? 'Complete' : 'Incomplete'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Processing Steps */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Processing Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {preprocessingSteps.map((step, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step.status === 'completed' ? 'bg-success-500' : 'bg-primary-500'
                    }`}>
                      {step.status === 'completed' ? (
                        <CheckCircleIcon className="w-6 h-6 text-white" />
                      ) : (
                        <span className="text-white font-semibold">{idx + 1}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{step.name}</h3>
                      <p className="text-sm text-slate-600">Time: {step.time}</p>
                    </div>
                  </div>
                  <Badge variant={step.status === 'completed' ? 'success' : 'info'}>
                    {step.status === 'completed' ? 'Complete' : 'Processing'}
                  </Badge>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-success-500 h-2 rounded-full transition-all"
                    style={{ width: `${step.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Output Files */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Generated Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <DocumentTextIcon className="w-6 h-6 text-slate-600" />
                  <div>
                    <h3 className="font-semibold text-slate-900">all_train.csv</h3>
                    <code className="text-xs text-primary-600">./preprocessed_data/all_train.csv</code>
                  </div>
                </div>
                <Badge variant="info">812 MB</Badge>
              </div>
              <div className="flex gap-4 text-sm mt-3">
                <span className="text-slate-600">Samples: <span className="font-semibold text-slate-900">179,994</span></span>
                <span className="text-slate-600">Training data (90%)</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <DocumentTextIcon className="w-6 h-6 text-slate-600" />
                  <div>
                    <h3 className="font-semibold text-slate-900">all_val.csv</h3>
                    <code className="text-xs text-primary-600">./preprocessed_data/all_val.csv</code>
                  </div>
                </div>
                <Badge variant="info">92 MB</Badge>
              </div>
              <div className="flex gap-4 text-sm mt-3">
                <span className="text-slate-600">Samples: <span className="font-semibold text-slate-900">20,000</span></span>
                <span className="text-slate-600">Validation data (10%)</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <DocumentTextIcon className="w-6 h-6 text-slate-600" />
                  <div>
                    <h3 className="font-semibold text-slate-900">test_100.csv</h3>
                    <code className="text-xs text-primary-600">./preprocessed_data/test_100.csv</code>
                  </div>
                </div>
                <Badge variant="info">45 KB</Badge>
              </div>
              <div className="flex gap-4 text-sm mt-3">
                <span className="text-slate-600">Samples: <span className="font-semibold text-slate-900">100</span></span>
                <span className="text-slate-600">Overfitting test (balanced sampling)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Processing Speed"
          value="~2,222"
          subtitle="samples/min"
          icon={<ClockIcon className="w-6 h-6 text-slate-600" />}
        />
        <MetricCard
          title="Total Duration"
          value="~95"
          subtitle="minutes"
          icon={<ClockIcon className="w-6 h-6 text-slate-600" />}
        />
        <MetricCard
          title="CSV Size"
          value="904"
          subtitle="MB"
          icon={<DocumentTextIcon className="w-6 h-6 text-slate-600" />}
        />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Button variant="secondary" className="flex items-center justify-center gap-2">
          <ArrowPathIcon className="w-5 h-5" />
          Rerun Preprocessing
        </Button>
        <Link href="/quality">
          <Button variant="primary" className="w-full flex items-center justify-center gap-2">
            <MagnifyingGlassIcon className="w-5 h-5" />
            Quality Validation
          </Button>
        </Link>
        <Link href="/data">
          <Button variant="ghost" className="w-full flex items-center justify-center gap-2">
            <FolderIcon className="w-5 h-5" />
            View Data
          </Button>
        </Link>
      </div>
    </Layout>
  )
}
