'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'

// TypeScript interfaces
interface KeywordData {
  word: string
  count: number
}

interface CategoryData {
  category: string
  count: number
  percentage: number
}

interface ImbalanceScore {
  category: string
  deviation: number
  status: string
}

interface Recommendation {
  type: string
  message: string
  action: string
}

interface DataDistribution {
  summary: {
    total_samples: number
    unique_keywords: number
    avg_prompt_length: number
    min_prompt_length: number
    max_prompt_length: number
    imbalance_index: number
  }
  keywords: {
    top_50: KeywordData[]
    total_unique: number
  }
  categories: {
    distribution: CategoryData[]
    imbalance_scores: ImbalanceScore[]
  }
  recommendations: Recommendation[]
  metadata: {
    csv_path: string
    analysis_date: string
  }
}

// API functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7010'

async function getDataDistribution(): Promise<DataDistribution> {
  const response = await fetch(`${API_BASE_URL}/api/statistics/data-distribution`)
  if (!response.ok) {
    throw new Error(`Failed to fetch data distribution: ${response.statusText}`)
  }
  return response.json()
}

// Helper functions
function getCategoryColor(category: string): string {
  const colors: { [key: string]: string } = {
    'people': 'bg-blue-100 text-blue-800 border-blue-300',
    'urban': 'bg-gray-100 text-gray-800 border-gray-300',
    'nature': 'bg-green-100 text-green-800 border-green-300',
    'indoor': 'bg-purple-100 text-purple-800 border-purple-300',
    'action': 'bg-red-100 text-red-800 border-red-300',
    'object': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'animal': 'bg-orange-100 text-orange-800 border-orange-300',
    'food': 'bg-pink-100 text-pink-800 border-pink-300',
    'other': 'bg-slate-100 text-slate-800 border-slate-300'
  }
  return colors[category] || 'bg-gray-100 text-gray-800 border-gray-300'
}

function getStatusBadgeColor(status: string): string {
  if (status === '과다') return 'bg-red-100 text-red-800'
  if (status === '과소') return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}

function getRecommendationIcon(type: string): string {
  if (type === 'warning') return '⚠️'
  if (type === 'success') return '✅'
  return 'ℹ️'
}

export default function DataDistributionPage() {
  const [data, setData] = useState<DataDistribution | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const distribution = await getDataDistribution()
        setData(distribution)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-slate-600">데이터 분석 중...</p>
        </div>
      </Layout>
    )
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">오류 발생</h3>
          <p className="text-red-600">{error || '데이터를 불러올 수 없습니다.'}</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">학습 데이터 분포 분석</h1>
          <p className="text-slate-600">1K 학습 데이터셋의 키워드, 카테고리, 불균형 분석</p>
          <div className="mt-4 flex gap-4 text-sm text-slate-500">
            <span>분석 시간: {new Date(data.metadata.analysis_date).toLocaleString('ko-KR')}</span>
            <span>•</span>
            <span>데이터: {data.metadata.csv_path.split('/').pop()}</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-blue-500">
            <div className="text-sm text-slate-600 mb-1">전체 샘플</div>
            <div className="text-2xl font-bold text-slate-800">{data.summary.total_samples.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-green-500">
            <div className="text-sm text-slate-600 mb-1">고유 키워드</div>
            <div className="text-2xl font-bold text-slate-800">{data.keywords.total_unique.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-purple-500">
            <div className="text-sm text-slate-600 mb-1">평균 프롬프트 길이</div>
            <div className="text-2xl font-bold text-slate-800">{Math.round(data.summary.avg_prompt_length)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-yellow-500">
            <div className="text-sm text-slate-600 mb-1">최소 길이</div>
            <div className="text-2xl font-bold text-slate-800">{data.summary.min_prompt_length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-orange-500">
            <div className="text-sm text-slate-600 mb-1">최대 길이</div>
            <div className="text-2xl font-bold text-slate-800">{data.summary.max_prompt_length}</div>
          </div>
          <div className={`bg-white rounded-lg shadow p-4 border-t-4 ${data.summary.imbalance_index > 50 ? 'border-red-500' : 'border-green-500'}`}>
            <div className="text-sm text-slate-600 mb-1">불균형 지수</div>
            <div className={`text-2xl font-bold ${data.summary.imbalance_index > 50 ? 'text-red-600' : 'text-green-600'}`}>
              {data.summary.imbalance_index.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">권장사항</h2>
          <div className="space-y-3">
            {data.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  rec.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  rec.type === 'success' ? 'bg-green-50 border-green-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getRecommendationIcon(rec.type)}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800 mb-1">{rec.message}</div>
                    <div className="text-sm text-slate-600">{rec.action}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribution Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">카테고리 분포</h2>
            <div className="space-y-3">
              {data.categories.distribution.map((cat) => (
                <div key={cat.category}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(cat.category)}`}>
                      {cat.category}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">
                      {cat.count} ({cat.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full ${getCategoryColor(cat.category).split(' ')[0]} transition-all duration-500`}
                      style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Imbalance Scores */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">불균형 점수</h2>
            <div className="space-y-3">
              {data.categories.imbalance_scores.map((score) => (
                <div key={score.category} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(score.category)}`}>
                      {score.category}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(score.status)}`}>
                      {score.status}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-slate-700">
                    {score.deviation.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
              균등 분포 기준: {(100 / data.categories.distribution.length).toFixed(1)}% per category
            </div>
          </div>
        </div>

        {/* Top Keywords */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">상위 50개 키워드</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {data.keywords.top_50.slice(0, 50).map((keyword, idx) => (
              <div
                key={idx}
                className="p-3 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="font-medium text-slate-800 truncate" title={keyword.word}>
                  {keyword.word}
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  {keyword.count.toLocaleString()}회
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: `${(keyword.count / data.keywords.top_50[0].count) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
