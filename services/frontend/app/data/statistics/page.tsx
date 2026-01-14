'use client'

import { useState, useEffect } from 'react'
import { getDetailedIssues, getDashboardStats, getResolutionStats, getCategoryStats, getSampleData, getMediaUrl } from '@/lib/api'
import Layout from '@/components/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'

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

interface Stats {
  total_samples: number
  avg_quality_score: number
  samples_with_issues: number
  total_videos: number
  total_images: number
  preprocessing_progress: number
  training_status: string
}

export default function DataStatisticsPage() {
  const [detailedIssues, setDetailedIssues] = useState<DetailedIssuesData | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set())
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null)
  const [modalData, setModalData] = useState<any>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'cot' | 'original'>('cot')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [issuesData, statsData] = await Promise.all([
          getDetailedIssues(),
          getDashboardStats()
        ])
        setDetailedIssues(issuesData)
        setStats(statsData)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)
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

  const getSeverityVariant = (severity: string): 'error' | 'warning' | 'neutral' => {
    if (severity === 'high') return 'error'
    if (severity === 'medium') return 'warning'
    return 'neutral'
  }

  const getLevelInfo = (level?: string) => {
    if (level === 'object_level') return { variant: 'info' as const, text: 'Object Level' }
    if (level === 'semantic_level') return { variant: 'warning' as const, text: 'Semantic Level' }
    if (level === 'application_level') return { variant: 'success' as const, text: 'Application Level' }
    return { variant: 'neutral' as const, text: level || 'Unknown' }
  }

  const getPriorityVariant = (priority?: string): 'error' | 'warning' | 'neutral' => {
    if (priority === '높음') return 'error'
    if (priority === '중간') return 'warning'
    return 'neutral'
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-600">Loading statistics...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">데이터셋 통계</h1>
        <p className="text-sm text-slate-600 mt-1">Dataset statistics and quality analysis</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Samples</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats?.total_samples.toLocaleString()}
                </p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-primary-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Videos</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats?.total_videos.toLocaleString()}
                </p>
              </div>
              <InformationCircleIcon className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Images</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats?.total_images.toLocaleString()}
                </p>
              </div>
              <InformationCircleIcon className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Quality Score</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats?.avg_quality_score.toFixed(1)}%
                </p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-success-500" />
            </div>
          </CardContent>
        </Card>
      </div>

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
              <h4 className="text-sm font-semibold text-slate-900 mb-3">샘플별 이슈 (상위 20개)</h4>
              {detailedIssues.top_issues.slice(0, 20).map((sample) => (
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
                    <div className="p-4 bg-white space-y-4">
                      {sample.issues.map((issue, idx) => {
                        const levelInfo = getLevelInfo(issue.level)
                        const hasProblem = issue.problem && typeof issue.problem === 'object'
                        const hasSolution = issue.solution && typeof issue.solution === 'object'

                        return (
                          <div key={idx} className="pb-4 border-b border-slate-200 last:border-0">
                            {/* Header with Badges */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              {issue.level && (
                                <Badge variant={levelInfo.variant}>
                                  {levelInfo.text}
                                </Badge>
                              )}
                              <Badge variant={getSeverityVariant(issue.severity)}>
                                심각도: {issue.severity === 'high' ? '높음' : issue.severity === 'medium' ? '중간' : '낮음'}
                              </Badge>
                              {hasSolution && issue.solution!.priority && (
                                <Badge variant={getPriorityVariant(issue.solution!.priority)}>
                                  우선순위: {issue.solution!.priority}
                                </Badge>
                              )}
                            </div>

                            {/* Level Category */}
                            {issue.details?.level_category && (
                              <div className="mb-3 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded inline-block">
                                분류: {String(issue.details.level_category)}
                              </div>
                            )}

                            {/* Problem Section */}
                            {hasProblem && (
                              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <h5 className="text-xs font-bold text-red-900 mb-2 uppercase">문제</h5>
                                <div className="space-y-2">
                                  {issue.problem!.description && (
                                    <div>
                                      <span className="text-xs font-semibold text-red-700">설명:</span>
                                      <p className="text-sm text-slate-800 mt-1">{String(issue.problem!.description)}</p>
                                    </div>
                                  )}
                                  {issue.problem!.impact && (
                                    <div>
                                      <span className="text-xs font-semibold text-red-700">영향:</span>
                                      <p className="text-sm text-slate-800 mt-1">{String(issue.problem!.impact)}</p>
                                    </div>
                                  )}
                                  {issue.problem!.root_cause && (
                                    <div>
                                      <span className="text-xs font-semibold text-red-700">근본 원인:</span>
                                      <p className="text-sm text-slate-800 mt-1">{String(issue.problem!.root_cause)}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Solution Section */}
                            {hasSolution && (
                              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <h5 className="text-xs font-bold text-green-900 mb-2 uppercase">해결방안</h5>
                                <div className="space-y-2">
                                  {issue.solution!.method && (
                                    <div>
                                      <span className="text-xs font-semibold text-green-700">방법:</span>
                                      <p className="text-sm text-slate-800 mt-1">{String(issue.solution!.method)}</p>
                                    </div>
                                  )}
                                  {issue.solution!.steps && Array.isArray(issue.solution!.steps) && issue.solution!.steps.length > 0 && (
                                    <div>
                                      <span className="text-xs font-semibold text-green-700">단계:</span>
                                      <ol className="mt-1 ml-4 space-y-1 list-decimal">
                                        {issue.solution!.steps.map((step, stepIdx) => (
                                          <li key={stepIdx} className="text-sm text-slate-800">
                                            {String(step).replace(/^\d+\.\s*/, '')}
                                          </li>
                                        ))}
                                      </ol>
                                    </div>
                                  )}
                                  {issue.solution!.expected_result && (
                                    <div>
                                      <span className="text-xs font-semibold text-green-700">예상 결과:</span>
                                      <p className="text-sm text-slate-800 mt-1">{String(issue.solution!.expected_result)}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Additional Details */}
                            {issue.details && typeof issue.details === 'object' && Object.keys(issue.details).length > 0 && (
                              <div className="mt-3">
                                <span className="text-xs font-semibold text-slate-600">상세 정보:</span>
                                <div className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded space-y-1">
                                  {Object.entries(issue.details)
                                    .filter(([key]) => key !== 'level_category')
                                    .map(([key, value]) => (
                                      <div key={key}>
                                        <span className="font-semibold">{key}:</span> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                      </div>
                                    ))
                                  }
                                </div>
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

            {/* Total Count */}
            {detailedIssues.samples_with_issues > 20 && (
              <div className="mt-4 text-center text-sm text-slate-600">
                Showing 20 of {detailedIssues.samples_with_issues.toLocaleString()} samples with issues
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Issues */}
      {detailedIssues && detailedIssues.samples_with_issues === 0 && (
        <Card className="border-success-200 bg-success-50">
          <CardContent className="py-8 text-center">
            <CheckCircleIcon className="w-12 h-12 text-success-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-success-900 mb-2">모든 샘플이 정상입니다!</h3>
            <p className="text-sm text-success-700">데이터셋에 이슈가 발견되지 않았습니다.</p>
          </CardContent>
        </Card>
      )}

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
