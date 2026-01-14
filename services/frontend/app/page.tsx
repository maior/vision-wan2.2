'use client'

import { useState, useEffect } from 'react'
import { getDashboardStats, getPreprocessingStatus, getDetailedIssues, getSampleData, getMediaUrl } from '@/lib/api'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { MetricCard } from '@/components/ui/MetricCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  CubeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'

interface Stats {
  total_samples: number
  avg_quality_score: number
  samples_with_issues: number
  total_videos: number
  total_images: number
  preprocessing_progress: number
  training_status: string
}

interface IssueDetail {
  type: string
  severity: string
  level?: string
  problem?: {
    description?: string
    impact?: string
    root_cause?: string
  }
  solution?: {
    method?: string
    steps?: string[]
    expected_result?: string
    priority?: string
  }
  details?: any
}

interface SampleIssue {
  clip_id: string
  media_type: string
  issues: IssueDetail[]
  issue_count: number
}

interface DetailedIssuesData {
  total_samples: number
  samples_with_issues: number
  issue_rate: number
  issue_types: {
    low_tokens: number
    no_cot: number
    quality_fail: number
  }
  top_issues: SampleIssue[]
  summary: {
    [key: string]: {
      count: number
      description: string
      solution: string
    }
  }
}

interface PreprocessingStatus {
  csv_updated: boolean
  total_data: number
  video: { total: number; processed: number; progress: number }
  image: { total: number; processed: number; progress: number }
  model: { downloaded: boolean; files: number; path: string }
  ready_for_training: boolean
}

interface PipelineStage {
  id: string
  name: string
  status: 'completed' | 'in_progress' | 'pending' | 'warning'
  link: string
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [preprocessingStatus, setPreprocessingStatus] = useState<PreprocessingStatus | null>(null)
  const [detailedIssues, setDetailedIssues] = useState<DetailedIssuesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set())
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null)
  const [modalData, setModalData] = useState<any>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'cot' | 'original'>('cot')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchPreprocessing = async () => {
      try {
        const data = await getPreprocessingStatus()
        setPreprocessingStatus(data)
      } catch (error) {
        console.error('Failed to fetch preprocessing status:', error)
      }
    }
    fetchPreprocessing()
    const interval = setInterval(fetchPreprocessing, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchDetailedIssues = async () => {
      try {
        const data = await getDetailedIssues()
        setDetailedIssues(data)
      } catch (error) {
        console.error('Failed to fetch detailed issues:', error)
      }
    }
    fetchDetailedIssues()
    const interval = setInterval(fetchDetailedIssues, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch sample data when modal is opened
  useEffect(() => {
    if (selectedClipId) {
      setModalLoading(true)
      getSampleData(selectedClipId)
        .then(data => {
          setModalData(data)
        })
        .catch(error => {
          console.error('Failed to fetch sample data:', error)
          setModalData(null)
        })
        .finally(() => {
          setModalLoading(false)
        })
    }
  }, [selectedClipId])

  const handleOpenModal = (clipId: string) => {
    setSelectedClipId(clipId)
  }

  const handleCloseModal = () => {
    setSelectedClipId(null)
    setModalData(null)
    setActiveTab('cot')
  }

  const toggleIssueExpansion = (clipId: string) => {
    const newExpanded = new Set(expandedIssues)
    if (newExpanded.has(clipId)) {
      newExpanded.delete(clipId)
    } else {
      newExpanded.add(clipId)
    }
    setExpandedIssues(newExpanded)
  }

  const getSeverityBadge = (severity: string): 'error' | 'warning' | 'neutral' => {
    if (severity === 'high') return 'error'
    if (severity === 'medium') return 'warning'
    return 'neutral'
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    )
  }

  const pipelineStages: PipelineStage[] = [
    {
      id: 'data',
      name: 'Data Collection',
      status: 'completed',
      link: '/data'
    },
    {
      id: 'preprocessing',
      name: 'Preprocessing',
      status: stats?.preprocessing_progress === 100 ? 'completed' : 'in_progress',
      link: '/preprocessing'
    },
    {
      id: 'quality',
      name: 'Quality Validation',
      status: stats?.samples_with_issues === 0 ? 'completed' : 'warning',
      link: '/quality'
    },
    {
      id: 'training',
      name: 'Training',
      status: stats?.training_status === 'ready' ? 'in_progress' : 'pending',
      link: '/training'
    },
    {
      id: 'evaluation',
      name: 'Evaluation',
      status: 'pending',
      link: '/results'
    },
  ]

  const recentActivities = [
    { time: 'Nov 8', event: 'Validation Data Quality Check Complete', status: 'success', details: '19,713 clean samples (98.56%)' },
    { time: 'Nov 8', event: 'Validation Data Conversion Complete', status: 'success', details: '20,000 samples (100%)' },
    { time: 'Nov 7', event: 'Training Data Quality Check Complete', status: 'success', details: '172,939 clean samples (98.66%)' },
    { time: 'Nov 6', event: 'Training Data Conversion Complete', status: 'success', details: '170,180 samples' },
  ]

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600 mt-1">MBC Dataset LoRA Training Pipeline Overview</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Samples"
          value={stats?.total_samples?.toLocaleString() || '0'}
          subtitle={`Videos: ${stats?.total_videos?.toLocaleString() || '0'} • Images: ${stats?.total_images?.toLocaleString() || '0'}`}
          icon={<CubeIcon className="w-6 h-6 text-slate-600" />}
        />
        <MetricCard
          title="Quality Score"
          value={`${(stats?.avg_quality_score || 0).toFixed(1)}%`}
          subtitle="Average dataset quality"
          icon={<CheckCircleIcon className="w-6 h-6 text-success-600" />}
          trend={{ value: 5.2, isPositive: true }}
        />
        <MetricCard
          title="Issues Detected"
          value={stats?.samples_with_issues?.toLocaleString() || '0'}
          subtitle={`${((stats?.samples_with_issues || 0) / (stats?.total_samples || 1) * 100).toFixed(2)}% of total`}
          icon={<ExclamationTriangleIcon className="w-6 h-6 text-warning-600" />}
        />
        <MetricCard
          title="Preprocessing"
          value={`${stats?.preprocessing_progress || 0}%`}
          subtitle={stats?.preprocessing_progress === 100 ? 'Ready for training' : 'In progress'}
          icon={<ClockIcon className="w-6 h-6 text-primary-600" />}
        />
      </div>

      {/* Training Ready Alert */}
      {preprocessingStatus?.ready_for_training && (
        <Card className="mb-8 border-success-200 bg-success-50">
          <CardContent className="py-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-success-100 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-success-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-success-900">Ready for Training</h3>
                  <p className="text-sm text-success-700 mt-1">
                    All preprocessing complete. {preprocessingStatus.total_data.toLocaleString()} samples ready for LoRA fine-tuning.
                  </p>
                </div>
              </div>
              <Link href="/training">
                <Button variant="primary" size="sm">
                  Start Training
                  <ChevronRightIcon className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Pipeline Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute top-6 left-6 right-6 h-0.5 bg-slate-200"></div>

            {/* Stages */}
            <div className="relative grid grid-cols-5 gap-4">
              {pipelineStages.map((stage, index) => (
                <Link key={stage.id} href={stage.link}>
                  <div className="flex flex-col items-center cursor-pointer group">
                    {/* Status Circle */}
                    <div className={`
                      relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all
                      ${stage.status === 'completed'
                        ? 'bg-success-500 border-success-500'
                        : stage.status === 'in_progress'
                        ? 'bg-primary-500 border-primary-500 animate-pulse'
                        : stage.status === 'warning'
                        ? 'bg-warning-500 border-warning-500'
                        : 'bg-white border-slate-300'
                      }
                    `}>
                      {stage.status === 'completed' && (
                        <CheckCircleIcon className="w-6 h-6 text-white" />
                      )}
                      {stage.status === 'in_progress' && (
                        <ClockIcon className="w-6 h-6 text-white" />
                      )}
                      {stage.status === 'warning' && (
                        <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                      )}
                      {stage.status === 'pending' && (
                        <span className="text-slate-400 text-sm font-semibold">{index + 1}</span>
                      )}
                    </div>

                    {/* Stage Name */}
                    <div className="mt-3 text-center">
                      <p className="text-sm font-medium text-slate-700 group-hover:text-primary-600">
                        {stage.name}
                      </p>
                      <Badge
                        variant={
                          stage.status === 'completed' ? 'success' :
                          stage.status === 'in_progress' ? 'info' :
                          stage.status === 'warning' ? 'warning' : 'neutral'
                        }
                        className="mt-1"
                      >
                        {stage.status === 'completed' && 'Complete'}
                        {stage.status === 'in_progress' && 'In Progress'}
                        {stage.status === 'warning' && 'Warning'}
                        {stage.status === 'pending' && 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Issues Section */}
      {detailedIssues && detailedIssues.samples_with_issues > 0 && (
        <Card className="mb-8 border-warning-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>데이터셋 이슈 분석</CardTitle>
              <Badge variant="warning">
                {detailedIssues.samples_with_issues.toLocaleString()} 이슈
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Issue Type Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {Object.entries(detailedIssues.summary).map(([key, value]) => (
                <div key={key} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-semibold text-slate-900">{value.description}</h4>
                    <Badge variant={key === 'quality_fail' ? 'error' : key === 'low_tokens' ? 'warning' : 'info'}>
                      {value.count}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">해결방안:</p>
                  <p className="text-sm text-slate-700 font-medium">{value.solution}</p>
                </div>
              ))}
            </div>

            {/* Sample Issues List */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">샘플별 이슈 (상위 10개)</h4>
              {detailedIssues.top_issues.slice(0, 10).map((sample) => (
                <div key={sample.clip_id} className="border border-slate-200 rounded-lg overflow-hidden">
                  {/* Sample Header */}
                  <div className="flex items-center justify-between p-3 bg-slate-50">
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-slate-100 transition-colors -m-3 p-3 rounded-l-lg"
                      onClick={() => toggleIssueExpansion(sample.clip_id)}
                    >
                      <Badge variant="neutral">{sample.media_type}</Badge>
                      <span className="text-sm font-medium text-slate-900">
                        Clip ID: {sample.clip_id}
                      </span>
                      <Badge variant="error">{sample.issue_count} 이슈</Badge>
                      {expandedIssues.has(sample.clip_id) ? (
                        <ChevronUpIcon className="w-5 h-5 text-slate-600 ml-auto" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-slate-600 ml-auto" />
                      )}
                    </div>
                    <button
                      onClick={() => handleOpenModal(sample.clip_id)}
                      className="ml-2 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-md transition-colors"
                    >
                      JSON 및 미디어 보기
                    </button>
                  </div>

                  {/* Expanded Issue Details */}
                  {expandedIssues.has(sample.clip_id) && (
                    <div className="p-4 bg-white space-y-3">
                      {sample.issues.map((issue, idx) => {
                        const hasProblem = issue.problem && typeof issue.problem === 'object'
                        const hasSolution = issue.solution && typeof issue.solution === 'object'

                        return (
                          <div key={idx} className="pb-3 border-b border-slate-100 last:border-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              {issue.level && (
                                <Badge variant={
                                  issue.level === 'object_level' ? 'info' :
                                  issue.level === 'semantic_level' ? 'warning' :
                                  issue.level === 'application_level' ? 'success' : 'neutral'
                                }>
                                  {issue.level === 'object_level' ? 'Object Level' :
                                   issue.level === 'semantic_level' ? 'Semantic Level' :
                                   issue.level === 'application_level' ? 'Application Level' : issue.level}
                                </Badge>
                              )}
                              <Badge variant={getSeverityBadge(issue.severity)}>
                                {issue.severity === 'high' ? '높음' : issue.severity === 'medium' ? '중간' : '낮음'}
                              </Badge>
                            </div>

                            {/* Problem Section */}
                            {hasProblem && (
                              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded">
                                <h6 className="text-xs font-bold text-red-900 mb-1">문제</h6>
                                {issue.problem!.description && (
                                  <p className="text-xs text-slate-800">{String(issue.problem!.description)}</p>
                                )}
                              </div>
                            )}

                            {/* Solution Section */}
                            {hasSolution && (
                              <div className="p-2 bg-green-50 border border-green-200 rounded">
                                <h6 className="text-xs font-bold text-green-900 mb-1">해결방안</h6>
                                {issue.solution!.method && (
                                  <p className="text-xs text-slate-800">{String(issue.solution!.method)}</p>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* View All Link */}
            {detailedIssues.samples_with_issues > 10 && (
              <div className="mt-4 text-center">
                <Link href="/quality">
                  <Button variant="outline" size="sm">
                    모든 이슈 보기 ({detailedIssues.samples_with_issues.toLocaleString()}개)
                    <ChevronRightIcon className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0">
                  <div className="flex-shrink-0 w-16 text-xs text-slate-500 pt-0.5">
                    {activity.time}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{activity.event}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{activity.details}</p>
                  </div>
                  <Badge variant="success" className="flex-shrink-0">
                    ✓
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">GPU</span>
                <span className="text-sm font-medium text-slate-900">V100 32GB × 2</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Model</span>
                <span className="text-sm font-medium text-slate-900">Wan2.2-T2V-A14B</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">LoRA Rank</span>
                <span className="text-sm font-medium text-slate-900">16</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Batch Size</span>
                <span className="text-sm font-medium text-slate-900">32 (1 × 16 × 2)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Frame Count</span>
                <span className="text-sm font-medium text-slate-900">49 frames</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-slate-600">Resolution</span>
                <span className="text-sm font-medium text-slate-900">1280 × 720</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/quality/caption-improvement">
              <div className="p-4 border border-slate-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-slate-900 group-hover:text-primary-700">Caption Enhancement</h4>
                  <Badge variant="info">NEW</Badge>
                </div>
                <p className="text-sm text-slate-600">
                  View Gemini-enhanced caption improvements
                </p>
              </div>
            </Link>

            <Link href="/quality/rapa-grade">
              <div className="p-4 border border-slate-200 rounded-lg hover:border-success-300 hover:bg-success-50 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-slate-900 group-hover:text-success-700">RAPA Grade</h4>
                  <Badge variant="success">A</Badge>
                </div>
                <p className="text-sm text-slate-600">
                  Review quality assessment results
                </p>
              </div>
            </Link>

            <Link href="/preprocessing">
              <div className="p-4 border border-slate-200 rounded-lg hover:border-success-300 hover:bg-success-50 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-slate-900 group-hover:text-success-700">Preprocessing</h4>
                  <Badge variant="success">100%</Badge>
                </div>
                <p className="text-sm text-slate-600">
                  View preprocessing pipeline status
                </p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Sample Details Modal */}
      <Modal
        isOpen={selectedClipId !== null}
        onClose={handleCloseModal}
        title={`샘플 상세 정보: ${selectedClipId || ''}`}
        size="full"
      >
        {modalLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-slate-600">데이터를 불러오는 중...</p>
            </div>
          </div>
        ) : modalData ? (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Media Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">미디어</h3>
              <div className="bg-slate-100 rounded-lg overflow-hidden">
                {modalData.cot_data?.media_type === 'video' ? (
                  <video
                    controls
                    className="w-full"
                    src={getMediaUrl(selectedClipId!)}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={getMediaUrl(selectedClipId!)}
                    alt={`Sample ${selectedClipId}`}
                    className="w-full h-auto"
                  />
                )}
              </div>
            </div>

            {/* JSON Data Section with Tabs */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">데이터 비교</h3>

              {/* Tabs */}
              <div className="border-b border-slate-200">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveTab('cot')}
                    className={`pb-2 px-1 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === 'cot'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    COT 확장 데이터
                  </button>
                  <button
                    onClick={() => setActiveTab('original')}
                    className={`pb-2 px-1 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === 'original'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    원본 데이터
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-auto max-h-[65vh]">
                {activeTab === 'cot' ? (
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(modalData.cot_data, null, 2)}
                  </pre>
                ) : modalData.original_data ? (
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(modalData.original_data, null, 2)}
                  </pre>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <p>원본 데이터를 찾을 수 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-error-500 mx-auto mb-4" />
            <p className="text-slate-600">데이터를 불러올 수 없습니다.</p>
          </div>
        )}
      </Modal>
    </Layout>
  )
}
