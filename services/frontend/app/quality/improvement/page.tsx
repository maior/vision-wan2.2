'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { getImprovementGuide } from '@/lib/api'

interface Guide {
  issue: string
  current_problem: string
  solution: string
  steps: string[]
  priority: string
  expected_improvement: string
}

export default function ImprovementGuidePage() {
  const [guides, setGuides] = useState<Guide[]>([])
  const [jsonSamples, setJsonSamples] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGuide()
  }, [])

  const fetchGuide = async () => {
    setLoading(true)
    try {
      const data = await getImprovementGuide()
      setGuides(data.guides)
      setJsonSamples(data.json_samples)
    } catch (error) {
      console.error('Failed to fetch improvement guide:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-xl">로딩 중...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3">🔧 데이터 품질 개선 가이드</h1>
        <p className="text-gray-200 text-lg">RAPA 2025 기준 충족을 위한 상세 개선 방법</p>
      </div>

      {/* Overall Info */}
      <div className="bg-gradient-to-r from-orange-900 to-red-900 rounded-xl p-6 border-2 border-red-500 mb-8">
        <div className="flex items-start gap-4">
          <div className="text-4xl">⚠️</div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">현재 RAPA 등급: F (30/100점)</h2>
            <p className="text-red-100 text-base">
              기술적 점수는 93.7%로 우수하나, RAPA 2025 가중치 기준으로 다음 4가지 주요 이슈가 등급을 낮추고 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* Improvement Guides */}
      <div className="space-y-8 mb-8">
        {guides.map((guide, idx) => (
          <div key={idx} className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border border-gray-600">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                  guide.priority === 'CRITICAL' ? 'bg-red-500 text-white' :
                  guide.priority === 'HIGH' ? 'bg-orange-500 text-white' :
                  'bg-yellow-500 text-white'
                }`}>
                  {guide.priority}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">{guide.issue}</h3>
                <div className="bg-red-900 bg-opacity-30 rounded-lg p-4 mb-4">
                  <div className="text-red-300 text-sm mb-1">현재 문제:</div>
                  <div className="text-white font-semibold">{guide.current_problem}</div>
                </div>
                <div className="bg-green-900 bg-opacity-30 rounded-lg p-4 mb-4">
                  <div className="text-green-300 text-sm mb-1">해결 방법:</div>
                  <div className="text-white font-semibold">{guide.solution}</div>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="bg-gray-700 bg-opacity-50 rounded-lg p-6 mb-4">
              <h4 className="text-white font-bold mb-3">📋 상세 단계:</h4>
              <ol className="space-y-2">
                {guide.steps.map((step, stepIdx) => (
                  <li key={stepIdx} className="flex items-start gap-3">
                    <span className="text-blue-400 font-bold">{stepIdx + 1}.</span>
                    <span className="text-gray-200">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Expected Improvement */}
            <div className="bg-purple-900 bg-opacity-30 rounded-lg p-4">
              <div className="text-purple-300 text-sm mb-1">예상 개선 효과:</div>
              <div className="text-white font-semibold">{guide.expected_improvement}</div>
            </div>
          </div>
        ))}
      </div>

      {/* JSON Examples */}
      {jsonSamples && (
        <div className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border border-gray-600">
          <h2 className="text-2xl font-bold text-white mb-6">📝 JSON 구조 예시</h2>

          {/* Bad Example */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">❌</span>
              <h3 className="text-xl font-bold text-red-300">잘못된 예시 (현재 상태)</h3>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-red-300 text-sm font-mono">
                {JSON.stringify(jsonSamples.bad_example, null, 2)}
              </pre>
            </div>
            <div className="mt-2 text-red-200 text-sm">
              문제: resolution, caption_info 필드 누락, keyword 비어있음
            </div>
          </div>

          {/* Good Example */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">✅</span>
              <h3 className="text-xl font-bold text-green-300">올바른 예시 (개선 후)</h3>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-green-300 text-sm font-mono">
                {JSON.stringify(jsonSamples.good_example, null, 2)}
              </pre>
            </div>
            <div className="mt-2 text-green-200 text-sm">
              개선: 모든 필수 필드 포함, keyword 자동 생성됨
            </div>
          </div>

          {/* CSV Example */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">📊</span>
              <h3 className="text-xl font-bold text-blue-300">CSV 형식 예시</h3>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-blue-300 text-sm font-mono">
                {JSON.stringify(jsonSamples.csv_example, null, 2)}
              </pre>
            </div>
            <div className="mt-2 text-blue-200 text-sm">
              CSV 파일에서 사용하는 평탄화된 구조
            </div>
          </div>
        </div>
      )}

      {/* RAPA Criteria Reference */}
      <div className="mt-8 bg-gradient-to-r from-indigo-900 to-purple-900 rounded-xl p-8 border-2 border-purple-500">
        <h2 className="text-2xl font-bold text-white mb-4">📚 RAPA 2025 기준 요약</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-purple-900 bg-opacity-30 rounded-lg p-4">
            <h3 className="text-purple-300 font-bold mb-2">필수 요구사항</h3>
            <ul className="text-gray-200 text-sm space-y-1">
              <li>• 비디오 총 시간: 3,600시간</li>
              <li>• JSON 스키마 준수율: 99.5%</li>
              <li>• 캡션 품질: 50토큰, 5문장</li>
              <li>• 해상도: 지원 해상도만 사용</li>
            </ul>
          </div>
          <div className="bg-purple-900 bg-opacity-30 rounded-lg p-4">
            <h3 className="text-purple-300 font-bold mb-2">가중치</h3>
            <ul className="text-gray-200 text-sm space-y-1">
              <li>• 비디오 총 시간: 40% (최고)</li>
              <li>• 구문 정확성: 20%</li>
              <li>• 다양성(통계): 15%</li>
              <li>• 형식성: 15%</li>
              <li>• 캡션 품질: 10%</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  )
}
