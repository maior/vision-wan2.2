'use client'

import { useState, useEffect } from 'react'
import { getInferenceResults, getInferenceStatus } from '@/lib/api'
import Layout from '@/components/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  PlayCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7010'

interface QualityMetrics {
  temporal_consistency: number
  sharpness: number
  color_diversity: number
  overall_quality: number
}

interface VideoResult {
  name: string
  filename: string
  size: number
  size_mb: number
  created: number
  url: string
  prompt: string
  description: string
  version: string
  clip_score?: number
  fvd_score?: number
  quality_metrics?: QualityMetrics
}

interface VersionResults {
  status: string
  videos: VideoResult[]
  count: number
  expected_count: number
}

interface InferenceResultsData {
  versions: {
    [key: string]: VersionResults
  }
  model_info: {
    [key: string]: {
      model: string
      epochs: number
    }
  }
}

interface VersionStatus {
  status: string
  progress: number
  videos_generated: number
  videos_expected: number
  message: string
}

interface InferenceStatusData {
  versions: {
    [key: string]: VersionStatus
  }
}

export default function InferencePage() {
  const [results, setResults] = useState<InferenceResultsData | null>(null)
  const [status, setStatus] = useState<InferenceStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState<string>('korean')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resultsData, statusData] = await Promise.all([
          getInferenceResults(),
          getInferenceStatus()
        ])
        setResults(resultsData)
        setStatus(statusData)
      } catch (error) {
        console.error('Failed to fetch inference data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">완료</Badge>
      case 'in_progress':
        return <Badge variant="warning">진행중</Badge>
      case 'waiting':
        return <Badge variant="neutral">대기중</Badge>
      case 'not_started':
        return <Badge variant="neutral">미시작</Badge>
      default:
        return <Badge variant="neutral">{status}</Badge>
    }
  }

  const getFVDColor = (fvd: number) => {
    if (fvd < 100) return 'bg-green-50 border-green-200 text-green-700'
    if (fvd < 200) return 'bg-yellow-50 border-yellow-200 text-yellow-700'
    return 'bg-red-50 border-red-200 text-red-700'
  }

  const getFVDGrade = (fvd: number) => {
    if (fvd < 70) return 'S'
    if (fvd < 100) return 'A'
    if (fvd < 150) return 'B'
    if (fvd < 250) return 'C'
    return 'D'
  }

  const getVersionLabel = (version: string) => {
    const labels: { [key: string]: string } = {
      'base': '베이스 모델 (LoRA 없음)',
      'epoch0': 'LoRA Epoch-0 (1 epoch)',
      'epoch2': 'LoRA Epoch-2 (3 epochs)',
      'korean': '한국형 프롬프트 (LoRA Epoch-2)'
    }
    return labels[version] || version
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ClockIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">Loading inference results...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!results) {
    return (
      <Layout>
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <InformationCircleIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No inference results available</p>
            </div>
          </CardContent>
        </Card>
      </Layout>
    )
  }

  const versionData = results.versions[selectedVersion]
  const versionStatus = status?.versions[selectedVersion]

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">LoRA 추론 결과</h1>
          <p className="text-slate-600 mt-2">
            다양한 LoRA 버전으로 생성된 비디오 결과 비교
          </p>
        </div>

        {/* Version Tabs */}
        <div className="flex space-x-2 border-b border-slate-200 pb-2">
          {Object.keys(results.versions).map((version) => {
            const versionInfo = results.versions[version]
            const versionStatus = status?.versions[version]

            return (
              <button
                key={version}
                onClick={() => setSelectedVersion(version)}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  selectedVersion === version
                    ? 'bg-white text-blue-600 border-t-2 border-x-2 border-blue-600 border-b-0'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{getVersionLabel(version)}</span>
                  {versionStatus && getStatusBadge(versionStatus.status)}
                  {versionInfo && versionInfo.count > 0 && (
                    <Badge variant="neutral">{versionInfo.count}/{versionInfo.expected_count}</Badge>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Status Bar */}
        {versionStatus && versionStatus.status !== 'not_started' && (
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {versionStatus.status === 'completed' ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  ) : versionStatus.status === 'in_progress' ? (
                    <ClockIcon className="h-6 w-6 text-yellow-600 animate-pulse" />
                  ) : (
                    <InformationCircleIcon className="h-6 w-6 text-slate-400" />
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">{versionStatus.message}</p>
                    <p className="text-sm text-slate-600">
                      {versionStatus.videos_generated} / {versionStatus.videos_expected} videos generated
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">
                    {Math.round(versionStatus.progress)}%
                  </div>
                  <div className="w-32 h-2 bg-slate-200 rounded-full mt-2">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${versionStatus.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Videos Grid */}
        {versionData && versionData.count > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {versionData.videos.map((video) => (
              <Card key={video.filename} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">{video.description}</span>
                    <PlayCircleIcon className="h-6 w-6 text-blue-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Video Player */}
                  <div className="bg-black rounded-lg overflow-hidden mb-4">
                    <video controls className="w-full">
                      <source src={`${API_BASE_URL}${video.url}`} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>

                  {/* Prompt */}
                  <div className="mb-4">
                    <p className="text-sm text-slate-600 font-medium mb-1">Prompt:</p>
                    <p className="text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-200">
                      {video.prompt}
                    </p>
                  </div>

                  {/* Metrics */}
                  {(video.clip_score !== undefined || video.fvd_score !== undefined) && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {/* CLIP Score */}
                      {video.clip_score !== undefined && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs font-semibold text-blue-900 mb-1">CLIP Score</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-blue-700">
                              {video.clip_score.toFixed(3)}
                            </span>
                            <span className="text-xs text-blue-600">/ 1.0</span>
                          </div>
                          <p className="text-xs text-blue-700 mt-1">Text-Video Alignment</p>
                        </div>
                      )}

                      {/* FVD Score */}
                      {video.fvd_score !== undefined && (
                        <div className={`border rounded-lg p-3 ${getFVDColor(video.fvd_score)}`}>
                          <p className="text-xs font-semibold mb-1">FVD Score</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold">
                              {Math.round(video.fvd_score)}
                            </span>
                            <span className="text-xs">/ 1140</span>
                          </div>
                          <p className="text-xs mt-1">
                            Grade: {getFVDGrade(video.fvd_score)} · RAPA {video.fvd_score < 1140 ? '✅' : '❌'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quality Metrics Details */}
                  {video.quality_metrics && (
                    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                      <p className="text-xs font-semibold text-slate-900 mb-2">Quality Details</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Temporal:</span>
                          <span className="font-medium text-slate-900">
                            {(video.quality_metrics.temporal_consistency * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Sharpness:</span>
                          <span className="font-medium text-slate-900">
                            {(video.quality_metrics.sharpness * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Color:</span>
                          <span className="font-medium text-slate-900">
                            {(video.quality_metrics.color_diversity * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-xs pt-1 border-t border-slate-300">
                          <span className="text-slate-900 font-semibold">Overall:</span>
                          <span className="font-bold text-slate-900">
                            {(video.quality_metrics.overall_quality * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* File Info */}
                  <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-600">
                    <p>Size: {video.size_mb} MB • {video.filename}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <ClockIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">
                  {versionStatus?.status === 'in_progress'
                    ? 'Videos are being generated...'
                    : 'No videos available yet'}
                </p>
                {versionStatus && (
                  <p className="text-sm text-slate-500">{versionStatus.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Model Info */}
        {results.model_info && (
          <Card>
            <CardHeader>
              <CardTitle>모델 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(results.model_info).map(([version, info]) => (
                  <div key={version} className="border border-slate-200 rounded-lg p-4">
                    <p className="font-semibold text-slate-900 mb-2">{getVersionLabel(version)}</p>
                    <p className="text-sm text-slate-600">{info.model}</p>
                    <p className="text-xs text-slate-500 mt-1">Epochs: {info.epochs}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
