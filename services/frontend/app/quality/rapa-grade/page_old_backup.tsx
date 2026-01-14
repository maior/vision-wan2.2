'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { getQualityAnalysis } from '@/lib/api'
import Link from 'next/link'

interface QualityAnalysis {
  overall_grade: string
  overall_score: number
  technical_score: number
  grade_explanation: string
  score_breakdown: {
    category: string
    weight: number
    current_score: number
    weighted_score: number
    target: string
  }[]
  critical_problems: {
    category: string
    severity: string
    title: string
    description: string
    impact: string
    score_impact: string
  }[]
  recommendations: {
    action: string
    priority: string
    expected_improvement: string
    timeline: string
  }[]
}

export default function RAPAGradePage() {
  const [analysis, setAnalysis] = useState<QualityAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkedItems, setCheckedItems] = useState<boolean[]>([])

  useEffect(() => {
    fetchAnalysis()
  }, [])

  const fetchAnalysis = async () => {
    setLoading(true)
    try {
      const data = await getQualityAnalysis()
      setAnalysis(data)
      // 모든 항목을 기본적으로 체크
      setCheckedItems(new Array(data.score_breakdown.length).fill(true))
    } catch (error) {
      console.error('Failed to fetch quality analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckChange = (index: number) => {
    const newCheckedItems = [...checkedItems]
    newCheckedItems[index] = !newCheckedItems[index]
    setCheckedItems(newCheckedItems)
  }

  const calculateSelectedScore = () => {
    if (!analysis) return 0

    // 체크된 항목들의 가중치 합계 계산
    const totalSelectedWeight = analysis.score_breakdown.reduce((sum, item, idx) => {
      return sum + (checkedItems[idx] ? item.weight : 0)
    }, 0)

    // 가중치가 0이면 점수도 0
    if (totalSelectedWeight === 0) return 0

    // 체크된 항목들의 점수를 재분배된 가중치로 계산
    const score = analysis.score_breakdown.reduce((sum, item, idx) => {
      if (!checkedItems[idx]) return sum
      // 재분배된 가중치 = (원래 가중치 / 선택된 가중치 합) * 100
      const redistributedWeight = (item.weight / totalSelectedWeight)
      // 재분배된 가중 점수 = 현재 점수 * 재분배된 가중치
      return sum + (item.current_score * redistributedWeight)
    }, 0)

    return score
  }

  const getRedistributedWeight = (idx: number) => {
    if (!analysis || !checkedItems[idx]) return 0

    const totalSelectedWeight = analysis.score_breakdown.reduce((sum, item, i) => {
      return sum + (checkedItems[i] ? item.weight : 0)
    }, 0)

    if (totalSelectedWeight === 0) return 0

    return (analysis.score_breakdown[idx].weight / totalSelectedWeight) * 100
  }

  const getRedistributedWeightedScore = (idx: number) => {
    if (!analysis || !checkedItems[idx]) return 0

    const totalSelectedWeight = analysis.score_breakdown.reduce((sum, item, i) => {
      return sum + (checkedItems[i] ? item.weight : 0)
    }, 0)

    if (totalSelectedWeight === 0) return 0

    const item = analysis.score_breakdown[idx]
    const redistributedWeight = item.weight / totalSelectedWeight
    return item.current_score * redistributedWeight
  }

  const getGradeFromScore = (score: number) => {
    if (score >= 90) return "A"
    if (score >= 80) return "B"
    if (score >= 70) return "C"
    if (score >= 60) return "D"
    return "F"
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

  if (!analysis) {
    return (
      <Layout>
        <div className="text-center text-white">분석 데이터를 불러올 수 없습니다.</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3">🎯 RAPA 2025 품질 등급 분석</h1>
        <p className="text-gray-200 text-lg">데이터셋 품질 등급 및 개선 방향</p>
      </div>

      {/* RAPA 2025 Standards */}
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-6 border-2 border-indigo-400 shadow-lg mb-8">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          📐 RAPA 2025 품질 등급 기준
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* 등급 기준 */}
          <div className="bg-black bg-opacity-30 rounded-lg p-4">
            <h3 className="text-white font-bold mb-3 text-lg">🎯 등급 산정 기준</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 rounded bg-green-900 bg-opacity-30">
                <span className="text-green-300 font-bold">A등급</span>
                <span className="text-green-200">90점 이상</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-blue-900 bg-opacity-30">
                <span className="text-blue-300 font-bold">B등급</span>
                <span className="text-blue-200">80~89점</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-yellow-900 bg-opacity-30">
                <span className="text-yellow-300 font-bold">C등급</span>
                <span className="text-yellow-200">70~79점</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-orange-900 bg-opacity-30">
                <span className="text-orange-300 font-bold">D등급</span>
                <span className="text-orange-200">60~69점</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-red-900 bg-opacity-30">
                <span className="text-red-300 font-bold">F등급</span>
                <span className="text-red-200">60점 미만</span>
              </div>
            </div>
          </div>

          {/* 평가 항목 가중치 */}
          <div className="bg-black bg-opacity-30 rounded-lg p-4">
            <h3 className="text-white font-bold mb-3 text-lg">⚖️ 평가 항목 가중치</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 rounded bg-purple-900 bg-opacity-20">
                <span className="text-white">비디오 총 시간</span>
                <span className="text-purple-300 font-bold">40%</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-purple-900 bg-opacity-20">
                <span className="text-white">구문 정확성</span>
                <span className="text-purple-300 font-bold">20%</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-purple-900 bg-opacity-20">
                <span className="text-white">통계적 다양성</span>
                <span className="text-purple-300 font-bold">15%</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-purple-900 bg-opacity-20">
                <span className="text-white">형식성</span>
                <span className="text-purple-300 font-bold">15%</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-purple-900 bg-opacity-20">
                <span className="text-white">캡션 품질</span>
                <span className="text-purple-300 font-bold">10%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 세부 기준 */}
        <div className="mt-4 bg-black bg-opacity-30 rounded-lg p-4">
          <h3 className="text-white font-bold mb-3 text-lg">📋 항목별 세부 기준</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-purple-300 font-semibold">비디오 총 시간 (40%)</div>
              <div className="text-gray-300">• 목표: 3,600시간</div>
              <div className="text-gray-300">• 최소: 100시간</div>
              <div className="text-gray-400 text-xs">※ 가장 높은 가중치</div>
            </div>
            <div className="space-y-1">
              <div className="text-purple-300 font-semibold">구문 정확성 (20%)</div>
              <div className="text-gray-300">• CSV 스키마 정확성</div>
              <div className="text-gray-300">• JSON 메타데이터 검증</div>
              <div className="text-gray-300">• 목표: 99.5% 이상</div>
            </div>
            <div className="space-y-1">
              <div className="text-purple-300 font-semibold">통계적 다양성 (15%)</div>
              <div className="text-gray-300">• 카테고리 균형</div>
              <div className="text-gray-300">• 키워드 존재율</div>
              <div className="text-gray-300">• 해상도 지원 (1280×720)</div>
            </div>
            <div className="space-y-1">
              <div className="text-purple-300 font-semibold">형식성 (15%)</div>
              <div className="text-gray-300">• 파일 무결성</div>
              <div className="text-gray-300">• 필수 필드 존재</div>
              <div className="text-gray-300">• 목표: 99% 이상</div>
            </div>
            <div className="space-y-1">
              <div className="text-purple-300 font-semibold">캡션 품질 (10%)</div>
              <div className="text-gray-300">• 평균 50토큰 이상</div>
              <div className="text-gray-300">• 평균 5문장 이상</div>
              <div className="text-gray-300">• 의미 있는 설명</div>
            </div>
            <div className="space-y-1">
              <div className="text-purple-300 font-semibold">비디오 길이</div>
              <div className="text-gray-300">• 권장: 15~25초</div>
              <div className="text-gray-300">• 25초 초과: 2% 미만</div>
              <div className="text-gray-400 text-xs">※ 통계적 다양성에 포함</div>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-blue-900 bg-opacity-20 rounded-lg p-3 text-center">
          <span className="text-blue-200 text-sm">
            💡 RAPA 2025는 가중치 기반 평가로 비디오 총 시간(40%)의 영향이 가장 큽니다
          </span>
        </div>
      </div>

      {/* Overall Grade */}
      <div className="bg-gradient-to-r from-red-900 to-orange-900 rounded-2xl p-8 border-4 border-red-500 shadow-2xl mb-8">
        <div className="text-center mb-6">
          <div className="text-red-300 text-xl mb-4">현재 RAPA 2025 등급</div>
          <div className="text-white text-8xl font-bold mb-4">{analysis.overall_grade}</div>
          <div className="text-red-100 text-3xl font-semibold mb-2">{analysis.overall_score}/100점</div>
          <div className="bg-red-900 bg-opacity-50 rounded-lg p-4 mt-6 mx-auto max-w-3xl">
            <p className="text-white text-lg leading-relaxed">
              {analysis.grade_explanation}
            </p>
          </div>
        </div>
      </div>

      {/* Scores Comparison */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-8 shadow-lg">
          <h3 className="text-blue-100 text-lg mb-2">기술적 품질 점수</h3>
          <div className="text-white text-5xl font-bold mb-2">{analysis.technical_score}%</div>
          <p className="text-blue-100 text-sm">파일 무결성, 캡션 품질 등</p>
          <div className="mt-4 bg-green-500 bg-opacity-20 rounded-lg p-3">
            <div className="text-green-300 font-semibold">✅ 우수</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-xl p-8 shadow-lg">
          <h3 className="text-red-100 text-lg mb-2">RAPA 2025 등급 점수</h3>
          <div className="text-white text-5xl font-bold mb-2">{analysis.overall_score}/100</div>
          <p className="text-red-100 text-sm">가중치 기반 종합 평가</p>
          <div className="mt-4 bg-red-500 bg-opacity-20 rounded-lg p-3">
            <div className="text-red-300 font-semibold">❌ 개선 필요</div>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border border-gray-600 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">📊 점수 상세 분석</h2>
          <div className="text-sm text-gray-400">💡 체크 해제된 항목은 평가에서 제외되며, 가중치가 재분배됩니다</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-600 bg-gray-700 bg-opacity-50">
                <th className="text-center p-4 text-white font-bold w-12">선택</th>
                <th className="text-left p-4 text-white font-bold">평가 항목</th>
                <th className="text-center p-4 text-white font-bold">가중치</th>
                <th className="text-center p-4 text-white font-bold">현재 점수</th>
                <th className="text-center p-4 text-white font-bold">가중 점수</th>
                <th className="text-left p-4 text-white font-bold">목표</th>
              </tr>
            </thead>
            <tbody>
              {analysis.score_breakdown.map((item, idx) => (
                <tr key={idx} className={`border-b border-gray-700 hover:bg-gray-700 hover:bg-opacity-30 transition ${
                  !checkedItems[idx] ? 'opacity-40' : ''
                }`}>
                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      checked={checkedItems[idx]}
                      onChange={() => handleCheckChange(idx)}
                      className="w-5 h-5 cursor-pointer accent-blue-500"
                    />
                  </td>
                  <td className="p-4 text-white font-semibold">{item.category}</td>
                  <td className="p-4 text-center">
                    <div className="text-purple-300 font-bold">{(item.weight * 100).toFixed(0)}%</div>
                    {checkedItems[idx] && getRedistributedWeight(idx) !== (item.weight * 100) && (
                      <div className="text-xs text-green-400 mt-1">→ {getRedistributedWeight(idx).toFixed(1)}%</div>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full font-bold ${
                      item.current_score >= 90 ? 'bg-green-500 bg-opacity-20 text-green-300' :
                      item.current_score >= 50 ? 'bg-yellow-500 bg-opacity-20 text-yellow-300' :
                      'bg-red-500 bg-opacity-20 text-red-300'
                    }`}>
                      {item.current_score.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {checkedItems[idx] ? (
                      <div>
                        <div className="text-blue-300 font-bold">{getRedistributedWeightedScore(idx).toFixed(1)}</div>
                        {getRedistributedWeightedScore(idx) !== item.weighted_score && (
                          <div className="text-xs text-gray-400 mt-1 line-through">{item.weighted_score.toFixed(1)}</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500 font-bold">제외</div>
                    )}
                  </td>
                  <td className="p-4 text-gray-300 text-sm">{item.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 space-y-4">
          <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300 text-sm">원래 점수</span>
              <span className="text-gray-400 font-bold text-lg">{analysis.overall_score.toFixed(1)} / 100 ({analysis.overall_grade})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white font-bold text-lg">선택된 항목 점수</span>
              <div className="flex items-center gap-4">
                <span className={`text-3xl font-bold ${
                  getGradeFromScore(calculateSelectedScore()) === 'F' ? 'text-red-400' :
                  getGradeFromScore(calculateSelectedScore()) === 'D' ? 'text-orange-400' :
                  getGradeFromScore(calculateSelectedScore()) === 'C' ? 'text-yellow-400' :
                  getGradeFromScore(calculateSelectedScore()) === 'B' ? 'text-blue-400' :
                  'text-green-400'
                }`}>
                  {getGradeFromScore(calculateSelectedScore())}
                </span>
                <span className="text-white font-bold text-2xl">{calculateSelectedScore().toFixed(1)} / 100</span>
              </div>
            </div>
          </div>
          <div className="bg-blue-900 bg-opacity-30 rounded-lg p-3">
            <div className="text-blue-200 text-sm space-y-1">
              <div>✨ <strong>체크 해제</strong> = 평가에서 제외 (데이터 추가 중인 항목)</div>
              <div>🔄 가중치는 남은 항목들에게 자동으로 재분배됩니다</div>
              <div>📊 녹색 숫자는 재분배된 가중치, 취소선은 원래 가중 점수</div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Problems */}
      <div className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border border-red-600 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">🚨 주요 문제점</h2>
        <div className="space-y-4">
          {analysis.critical_problems.map((problem, idx) => (
            <div key={idx} className={`rounded-lg p-6 border-2 ${
              problem.severity === 'CRITICAL' ? 'bg-red-900 bg-opacity-30 border-red-500' :
              problem.severity === 'HIGH' ? 'bg-orange-900 bg-opacity-30 border-orange-500' :
              'bg-yellow-900 bg-opacity-30 border-yellow-500'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {problem.severity === 'CRITICAL' ? '🔴' : problem.severity === 'HIGH' ? '🟠' : '🟡'}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-gray-300 mb-1">{problem.category}</div>
                    <h3 className="text-xl font-bold text-white">{problem.title}</h3>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  problem.severity === 'CRITICAL' ? 'bg-red-500 text-white' :
                  problem.severity === 'HIGH' ? 'bg-orange-500 text-white' :
                  'bg-yellow-500 text-white'
                }`}>
                  {problem.severity}
                </span>
              </div>
              <p className="text-gray-200 mb-3">{problem.description}</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="bg-black bg-opacity-30 rounded p-3">
                  <div className="text-gray-400 text-xs mb-1">영향</div>
                  <div className="text-white font-semibold text-sm">{problem.impact}</div>
                </div>
                <div className="bg-black bg-opacity-30 rounded p-3">
                  <div className="text-gray-400 text-xs mb-1">점수 영향</div>
                  <div className="text-red-300 font-bold text-sm">{problem.score_impact}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border border-green-600 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">💡 개선 권장사항</h2>
        <div className="space-y-4">
          {analysis.recommendations.map((rec, idx) => (
            <div key={idx} className="bg-gray-700 bg-opacity-50 rounded-lg p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      rec.priority === 'CRITICAL' ? 'bg-red-500 text-white' :
                      rec.priority === 'HIGH' ? 'bg-orange-500 text-white' :
                      'bg-yellow-500 text-white'
                    }`}>
                      {rec.priority}
                    </span>
                    <span className="text-gray-400 text-sm">예상 소요: {rec.timeline}</span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{rec.action}</h3>
                  <div className="bg-green-900 bg-opacity-30 rounded p-3">
                    <div className="text-green-300 text-sm mb-1">예상 개선 효과:</div>
                    <div className="text-white font-semibold">{rec.expected_improvement}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link href="/quality/improvement">
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 shadow-lg cursor-pointer hover:scale-105 transition-transform border-2 border-purple-400">
            <div className="text-4xl mb-3">🔧</div>
            <h3 className="text-white font-bold text-lg mb-2">개선 가이드</h3>
            <p className="text-purple-100 text-sm">상세 개선 방법 및 JSON 예시</p>
          </div>
        </Link>
        <Link href="/quality/samples">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 shadow-lg cursor-pointer hover:scale-105 transition-transform border-2 border-blue-400">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-white font-bold text-lg mb-2">샘플 데이터</h3>
            <p className="text-blue-100 text-sm">데이터셋 샘플 조회</p>
          </div>
        </Link>
        <Link href="/quality">
          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-6 shadow-lg cursor-pointer hover:scale-105 transition-transform border-2 border-green-400">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-white font-bold text-lg mb-2">품질 검증</h3>
            <p className="text-green-100 text-sm">전체 품질 리포트</p>
          </div>
        </Link>
      </div>
    </Layout>
  )
}
