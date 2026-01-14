'use client'

import { useState, useEffect } from 'react'
import { getCaptionQualityAnalysis } from '@/lib/api'
import Layout from '@/components/Layout'

export default function CaptionAnalysisV2Page() {
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCaptionQualityAnalysis()
        setAnalysis(data)
      } catch (error) {
        console.error('Failed to fetch analysis:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-4">Caption 품질 분석 v2.0</h1>
        
        {/* COT 존재 */}
        <div className="bg-green-900 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-3">✅ COT 구조 100% 존재</h2>
          <div className="bg-black bg-opacity-30 rounded p-3 font-mono text-sm text-green-400">
            object_level → semantic_level → application_level
          </div>
        </div>

        {/* 품질 문제 */}
        <div className="bg-orange-900 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">⚠️ COT 품질이 낮습니다 (40/100점)</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-red-800 bg-opacity-40 rounded p-4">
              <div className="text-2xl font-bold text-white">60%</div>
              <div className="text-sm text-red-200">Semantic 피상적</div>
            </div>
            <div className="bg-orange-800 bg-opacity-40 rounded p-4">
              <div className="text-2xl font-bold text-white">85%</div>
              <div className="text-sm text-orange-200">Application 획일적</div>
            </div>
            <div className="bg-yellow-800 bg-opacity-40 rounded p-4">
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="text-sm text-yellow-200">CSV 구조 손실</div>
            </div>
          </div>
        </div>

        {/* 개선 방안 */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">💡 개선 방안</h2>
          <div className="grid grid-cols-3 gap-4">
            {analysis?.improvement_plans?.map((plan: any) => (
              <div key={plan.priority} className="bg-purple-900 bg-opacity-40 rounded p-4">
                <h3 className="text-lg font-bold text-white mb-2">{plan.title}</h3>
                <div className="text-sm text-gray-300">비용: {plan.cost}</div>
                <div className="text-sm text-gray-300">기간: {plan.duration}</div>
                <div className="text-green-400 font-bold mt-2">{plan.expected_improvement}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
