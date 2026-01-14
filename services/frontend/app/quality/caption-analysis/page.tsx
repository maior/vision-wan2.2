'use client'

import { useState, useEffect } from 'react'
import { getCaptionQualityAnalysis } from '@/lib/api'
import Layout from '@/components/Layout'

export default function CaptionAnalysisPage() {
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedExampleIndex, setSelectedExampleIndex] = useState(0)

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

  if (!analysis || !analysis.real_examples) {
    return (
      <Layout>
        <div className="text-white p-8">데이터를 불러올 수 없습니다.</div>
      </Layout>
    )
  }

  const currentExample = analysis.real_examples[selectedExampleIndex]

  return (
    <Layout>
      <div className="max-w-[1800px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Caption 품질 분석 v2.0
          </h1>
          <p className="text-gray-400">
            분석일: {analysis.analysis_date} | 분석 샘플: {analysis.total_samples_analyzed}개 |
            전체 데이터셋: {analysis.dataset_size?.toLocaleString()}개
          </p>
        </div>

        {/* COT 상태 */}
        <div className="bg-green-900 bg-opacity-40 rounded-xl p-6 mb-6 border border-green-700">
          <h2 className="text-2xl font-bold text-white mb-3">
            ✅ COT 구조 100% 존재
          </h2>
          <div className="bg-black bg-opacity-40 rounded p-4 font-mono text-sm">
            <div className="text-green-400 mb-2">
              {analysis.cot_status.structure}
            </div>
            <div className="text-gray-400 text-xs">
              존재율: {analysis.cot_status.existence_rate}% |
              품질 점수: {analysis.cot_status.quality_score}/100
            </div>
          </div>
        </div>

        {/* 문제 통계 */}
        <div className="bg-red-900 bg-opacity-30 rounded-xl p-6 mb-6 border border-red-700">
          <h2 className="text-2xl font-bold text-white mb-4">
            ⚠️ COT 품질 문제
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Semantic Shallow */}
            <div className="bg-red-800 bg-opacity-40 rounded-lg p-4 border border-red-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-red-200 font-semibold">Semantic 피상적</span>
                <span className="text-2xl font-bold text-white">
                  {analysis.issues_summary.semantic_shallow.percentage}%
                </span>
              </div>
              <p className="text-sm text-red-300 mb-2">
                {analysis.issues_summary.semantic_shallow.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {analysis.issues_summary.semantic_shallow.examples.map((ex: string, i: number) => (
                  <span key={i} className="text-xs bg-red-900 px-2 py-1 rounded text-red-200">
                    {ex}
                  </span>
                ))}
              </div>
            </div>

            {/* Application Generic */}
            <div className="bg-orange-800 bg-opacity-40 rounded-lg p-4 border border-orange-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-orange-200 font-semibold">Application 획일적</span>
                <span className="text-2xl font-bold text-white">
                  {analysis.issues_summary.application_generic.percentage}%
                </span>
              </div>
              <p className="text-sm text-orange-300 mb-2">
                {analysis.issues_summary.application_generic.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {analysis.issues_summary.application_generic.examples.map((ex: string, i: number) => (
                  <span key={i} className="text-xs bg-orange-900 px-2 py-1 rounded text-orange-200">
                    {ex}
                  </span>
                ))}
              </div>
            </div>

            {/* Token Count Insufficient */}
            <div className="bg-purple-800 bg-opacity-40 rounded-lg p-4 border border-purple-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-200 font-semibold">RAPA 토큰 미달</span>
                <span className="text-2xl font-bold text-white">
                  {analysis.issues_summary.token_count_insufficient.percentage}%
                </span>
              </div>
              <p className="text-sm text-purple-300 mb-2">
                {analysis.issues_summary.token_count_insufficient.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {analysis.issues_summary.token_count_insufficient.examples.map((ex: string, i: number) => (
                  <span key={i} className="text-xs bg-purple-900 px-2 py-1 rounded text-purple-200">
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 품질 비교 차트 */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">품질 점수 비교</h2>
          <div className="grid grid-cols-2 gap-6">
            {/* Before */}
            <div className="bg-red-900 bg-opacity-30 rounded-lg p-6 border border-red-700">
              <div className="text-center mb-4">
                <div className="text-6xl font-bold text-red-400 mb-2">
                  {analysis.quality_comparison.before.overall}
                </div>
                <div className="text-2xl font-bold text-red-300">
                  {analysis.quality_comparison.before.grade}등급
                </div>
                <div className="text-sm text-gray-400 mt-1">개선 전</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Semantic Depth</span>
                  <span className="text-red-400">{analysis.quality_comparison.before.semantic_depth}/100</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Application Diversity</span>
                  <span className="text-red-400">{analysis.quality_comparison.before.application_diversity}/100</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Structure Clarity</span>
                  <span className="text-red-400">{analysis.quality_comparison.before.structure_clarity}/100</span>
                </div>
              </div>
            </div>

            {/* After */}
            <div className="bg-green-900 bg-opacity-30 rounded-lg p-6 border border-green-700">
              <div className="text-center mb-4">
                <div className="text-6xl font-bold text-green-400 mb-2">
                  {analysis.quality_comparison.after.overall}
                </div>
                <div className="text-2xl font-bold text-green-300">
                  {analysis.quality_comparison.after.grade}등급
                </div>
                <div className="text-sm text-gray-400 mt-1">개선 후</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Semantic Depth</span>
                  <span className="text-green-400">{analysis.quality_comparison.after.semantic_depth}/100</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Application Diversity</span>
                  <span className="text-green-400">{analysis.quality_comparison.after.application_diversity}/100</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Structure Clarity</span>
                  <span className="text-green-400">{analysis.quality_comparison.after.structure_clarity}/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 실제 JSON 예시 */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">실제 JSON 예시</h2>
            <div className="flex gap-2">
              {analysis.real_examples.map((ex: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedExampleIndex(idx)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    selectedExampleIndex === idx
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  예시 {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {currentExample && (
            <div>
              {/* Example Info */}
              <div className="bg-gray-900 rounded-lg p-4 mb-4 border border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Clip ID:</span>{' '}
                    <span className="text-white font-mono">{currentExample.clip_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">카테고리:</span>{' '}
                    <span className="text-white">{currentExample.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">키워드:</span>{' '}
                    <span className="text-white">{currentExample.keyword}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">제목:</span>{' '}
                    <span className="text-white">{currentExample.title}</span>
                  </div>
                </div>
              </div>

              {/* Before/After Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* BEFORE */}
                <div className="bg-red-900 bg-opacity-20 rounded-lg p-4 border border-red-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-red-300">개선 전</h3>
                    <span className="px-3 py-1 bg-red-700 rounded-full text-white font-bold">
                      {currentExample.before.quality_score}/100
                    </span>
                  </div>

                  {/* Object Level */}
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-gray-400 mb-1">Object Level:</div>
                    {currentExample.before.object_level.map((obj: any, i: number) => (
                      <div key={i} className="bg-gray-900 rounded p-3 mb-2">
                        <p className="text-sm text-gray-300">{obj.text}</p>
                        <div className="text-xs text-gray-500 mt-1">
                          {obj.tc_in} - {obj.tc_out} | {obj.token} tokens
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Semantic Level */}
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-red-400 mb-1">Semantic Level:</div>
                    {currentExample.before.semantic_level.map((sem: any, i: number) => (
                      <div key={i} className="bg-red-900 bg-opacity-30 rounded p-3 mb-2 border border-red-800">
                        <p className="text-sm text-red-200">{sem.text}</p>
                        <div className="text-xs text-red-400 mt-1">{sem.token} tokens</div>
                      </div>
                    ))}
                  </div>

                  {/* Application Level */}
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-orange-400 mb-1">Application Level:</div>
                    {currentExample.before.application_level.map((app: any, i: number) => (
                      <div key={i} className="bg-orange-900 bg-opacity-30 rounded p-3 mb-2 border border-orange-800">
                        <p className="text-sm text-orange-200">{app.text}</p>
                        <div className="text-xs text-orange-400 mt-1">{app.token} tokens</div>
                      </div>
                    ))}
                  </div>

                  {/* Problems */}
                  <div>
                    <div className="text-sm font-semibold text-red-400 mb-2">문제점:</div>
                    <ul className="space-y-1">
                      {currentExample.before.problems.map((problem: string, i: number) => (
                        <li key={i} className="text-xs text-red-300 flex items-start">
                          <span className="mr-2">❌</span>
                          <span>{problem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* AFTER */}
                <div className="bg-green-900 bg-opacity-20 rounded-lg p-4 border border-green-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-green-300">개선 후</h3>
                    <span className="px-3 py-1 bg-green-700 rounded-full text-white font-bold">
                      {currentExample.after.quality_score}/100
                    </span>
                  </div>

                  {/* Object Level */}
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-gray-400 mb-1">Object Level:</div>
                    {currentExample.after.object_level.map((obj: any, i: number) => (
                      <div key={i} className="bg-gray-900 rounded p-3 mb-2">
                        <p className="text-sm text-gray-300">{obj.text}</p>
                        <div className="text-xs text-gray-500 mt-1">
                          {obj.tc_in} - {obj.tc_out} | {obj.token} tokens
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Semantic Level */}
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-green-400 mb-1">Semantic Level:</div>
                    {currentExample.after.semantic_level.map((sem: any, i: number) => (
                      <div key={i} className="bg-green-900 bg-opacity-30 rounded p-3 mb-2 border border-green-800">
                        <p className="text-sm text-green-200">{sem.text}</p>
                        <div className="text-xs text-green-400 mt-1">{sem.token} tokens</div>
                      </div>
                    ))}
                  </div>

                  {/* Application Level */}
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-blue-400 mb-1">Application Level:</div>
                    {currentExample.after.application_level.map((app: any, i: number) => (
                      <div key={i} className="bg-blue-900 bg-opacity-30 rounded p-3 mb-2 border border-blue-800">
                        <p className="text-sm text-blue-200">{app.text}</p>
                        <div className="text-xs text-blue-400 mt-1">{app.token} tokens</div>
                      </div>
                    ))}
                  </div>

                  {/* Improvements */}
                  <div>
                    <div className="text-sm font-semibold text-green-400 mb-2">개선사항:</div>
                    <ul className="space-y-1">
                      {currentExample.after.improvements.map((improvement: string, i: number) => (
                        <li key={i} className="text-xs text-green-300 flex items-start">
                          <span className="mr-2">✅</span>
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Improvement Delta */}
              <div className="mt-4 text-center">
                <span className="inline-block px-6 py-3 bg-green-600 rounded-lg text-white font-bold text-lg">
                  품질 개선: {currentExample.improvement_delta}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 개선 방안 */}
        <div className="bg-purple-900 bg-opacity-30 rounded-xl p-6 mb-6 border border-purple-700">
          <h2 className="text-2xl font-bold text-white mb-4">💡 개선 방안</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-purple-800 bg-opacity-40 rounded-lg p-4">
              <div className="text-sm text-purple-300 mb-1">방법</div>
              <div className="text-lg font-bold text-white">{analysis.improvement_plan.method}</div>
            </div>
            <div className="bg-blue-800 bg-opacity-40 rounded-lg p-4">
              <div className="text-sm text-blue-300 mb-1">처리 데이터</div>
              <div className="text-lg font-bold text-white">
                {analysis.improvement_plan.target_data?.toLocaleString()}개
              </div>
            </div>
            <div className="bg-orange-800 bg-opacity-40 rounded-lg p-4">
              <div className="text-sm text-orange-300 mb-1">예상 비용</div>
              <div className="text-lg font-bold text-white">{analysis.improvement_plan.cost}</div>
            </div>
            <div className="bg-green-800 bg-opacity-40 rounded-lg p-4">
              <div className="text-sm text-green-300 mb-1">예상 품질</div>
              <div className="text-lg font-bold text-white">{analysis.improvement_plan.expected_quality}</div>
            </div>
          </div>
        </div>

        {/* 실행 단계 */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">🚀 실행 단계</h2>
          <div className="space-y-4">
            {analysis.execution_steps.map((step: any, idx: number) => (
              <div key={idx} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center mb-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold mr-3">
                    {step.step}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{step.title}</h3>
                    <div className="text-sm text-gray-400">
                      소요시간: {step.duration}
                      {step.cost && ` | 비용: ${step.cost}`}
                      {step.files && ` | 파일: ${step.files?.toLocaleString()}개`}
                    </div>
                  </div>
                </div>
                {step.commands && (
                  <div className="mt-2">
                    {step.commands.map((cmd: string, i: number) => (
                      <div key={i} className="bg-black bg-opacity-50 rounded p-2 mb-1 font-mono text-xs text-green-400">
                        {cmd}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
