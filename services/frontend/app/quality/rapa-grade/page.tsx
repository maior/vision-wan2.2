'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  DocumentChartBarIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline'
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
  video_metrics?: {
    clip_score: number
    fvd_score: number
    note?: string
  }
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

    const totalSelectedWeight = analysis.score_breakdown.reduce((sum, item, idx) => {
      return sum + (checkedItems[idx] ? item.weight : 0)
    }, 0)

    if (totalSelectedWeight === 0) return 0

    const score = analysis.score_breakdown.reduce((sum, item, idx) => {
      if (!checkedItems[idx]) return sum
      const redistributedWeight = (item.weight / totalSelectedWeight)
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
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-600">Loading analysis...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!analysis) {
    return (
      <Layout>
        <div className="text-center text-slate-900">Unable to load analysis data.</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">RAPA 2025 Quality Grade Analysis</h1>
        <p className="text-sm text-slate-600 mt-1">Dataset quality grade and improvement recommendations</p>
      </div>

      {/* RAPA 2025 Standards */}
      <Card className="mb-8 border-primary-200 bg-primary-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DocumentChartBarIcon className="w-6 h-6 text-primary-600" />
            RAPA 2025 Quality Grade Standards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Grade Standards */}
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-3">Grade Criteria</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 rounded bg-success-50">
                  <span className="font-semibold text-success-700">A Grade</span>
                  <span className="text-success-600">90+ points</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-primary-50">
                  <span className="font-semibold text-primary-700">B Grade</span>
                  <span className="text-primary-600">80-89 points</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-warning-50">
                  <span className="font-semibold text-warning-700">C Grade</span>
                  <span className="text-warning-600">70-79 points</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-orange-50">
                  <span className="font-semibold text-orange-700">D Grade</span>
                  <span className="text-orange-600">60-69 points</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-error-50">
                  <span className="font-semibold text-error-700">F Grade</span>
                  <span className="text-error-600">Below 60</span>
                </div>
              </div>
            </div>

            {/* Weight Distribution */}
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-3">Evaluation Weights</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 rounded bg-slate-50">
                  <span className="text-slate-700">Total Video Duration</span>
                  <span className="font-bold text-primary-600">40%</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-slate-50">
                  <span className="text-slate-700">Syntactic Accuracy</span>
                  <span className="font-bold text-primary-600">20%</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-slate-50">
                  <span className="text-slate-700">Statistical Diversity</span>
                  <span className="font-bold text-primary-600">15%</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-slate-50">
                  <span className="text-slate-700">Formality</span>
                  <span className="font-bold text-primary-600">15%</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-slate-50">
                  <span className="text-slate-700">Caption Quality</span>
                  <span className="font-bold text-primary-600">10%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-primary-100 rounded-lg p-3 text-center border border-primary-200">
            <span className="text-primary-800 text-sm">
              RAPA 2025 uses weighted evaluation with Total Video Duration (40%) having the highest impact
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Overall Grade */}
      <Card className="mb-8 border-error-300 bg-error-50">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <div className="text-error-700 text-lg mb-4">Current RAPA 2025 Grade</div>
            <div className="text-error-900 text-8xl font-bold mb-4">{analysis.overall_grade}</div>
            <div className="text-error-800 text-3xl font-semibold mb-2">{analysis.overall_score}/100</div>
            <div className="bg-white rounded-lg p-4 mt-6 mx-auto max-w-3xl border border-error-200">
              <p className="text-slate-700 leading-relaxed">
                {analysis.grade_explanation}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scores Comparison */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className="border-primary-200 bg-primary-50">
          <CardContent className="p-8">
            <h3 className="text-primary-700 text-lg mb-2">Technical Quality Score</h3>
            <div className="text-primary-900 text-5xl font-bold mb-2">{analysis.technical_score}%</div>
            <p className="text-primary-700 text-sm mb-4">File integrity, caption quality, etc.</p>
            <Badge variant="success">Excellent</Badge>
          </CardContent>
        </Card>
        <Card className="border-error-200 bg-error-50">
          <CardContent className="p-8">
            <h3 className="text-error-700 text-lg mb-2">RAPA 2025 Grade Score</h3>
            <div className="text-error-900 text-5xl font-bold mb-2">{analysis.overall_score}/100</div>
            <p className="text-error-700 text-sm mb-4">Weighted comprehensive evaluation</p>
            <Badge variant="error">Needs Improvement</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Video Quality Metrics */}
      {analysis.video_metrics && (
        <Card className="mb-8 border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DocumentChartBarIcon className="w-6 h-6 text-slate-700" />
              Video Generation Quality Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* CLIP Score */}
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-slate-600 text-sm font-semibold uppercase">CLIP Score</h3>
                  <Badge variant="info">Text-Video</Badge>
                </div>
                <div className="text-slate-900 text-4xl font-bold mb-3">{analysis.video_metrics.clip_score.toFixed(2)}</div>
                <p className="text-slate-600 text-sm mb-2">텍스트-비디오 정렬 점수</p>
                <div className="bg-slate-50 rounded p-2 text-xs text-slate-600">
                  <strong>CLIP</strong> (Contrastive Language-Image Pre-training)은 생성된 비디오가 텍스트 프롬프트와 얼마나 잘 일치하는지 평가합니다.
                </div>
              </div>

              {/* FVD Score */}
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-slate-600 text-sm font-semibold uppercase">FVD Score</h3>
                  <Badge variant="warning">Distance</Badge>
                </div>
                <div className="text-slate-900 text-4xl font-bold mb-3">{analysis.video_metrics.fvd_score.toFixed(1)}</div>
                <p className="text-slate-600 text-sm mb-2">비디오 품질 거리 점수</p>
                <div className="bg-slate-50 rounded p-2 text-xs text-slate-600">
                  <strong>FVD</strong> (Fréchet Video Distance)는 생성된 비디오와 실제 비디오 분포 간의 거리를 측정합니다. 낮을수록 좋습니다.
                </div>
              </div>
            </div>

            {analysis.video_metrics.note && (
              <div className="mt-4 bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800 text-sm">
                  <ExclamationCircleIcon className="w-5 h-5" />
                  <span>{analysis.video_metrics.note}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Score Breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Score Breakdown</CardTitle>
            <span className="text-sm text-slate-600">Unchecked items are excluded; weights are redistributed</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-50">
                  <th className="text-center p-4 font-bold text-slate-900 w-12">Select</th>
                  <th className="text-left p-4 font-bold text-slate-900">Category</th>
                  <th className="text-center p-4 font-bold text-slate-900">Weight</th>
                  <th className="text-center p-4 font-bold text-slate-900">Current Score</th>
                  <th className="text-center p-4 font-bold text-slate-900">Weighted Score</th>
                  <th className="text-left p-4 font-bold text-slate-900">Target</th>
                </tr>
              </thead>
              <tbody>
                {analysis.score_breakdown.map((item, idx) => (
                  <tr key={idx} className={`border-b border-slate-200 hover:bg-slate-50 transition ${
                    !checkedItems[idx] ? 'opacity-40' : ''
                  }`}>
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={checkedItems[idx]}
                        onChange={() => handleCheckChange(idx)}
                        className="w-5 h-5 cursor-pointer accent-primary-500"
                      />
                    </td>
                    <td className="p-4 font-semibold text-slate-900">{item.category}</td>
                    <td className="p-4 text-center">
                      <div className="font-bold text-primary-600">{(item.weight * 100).toFixed(0)}%</div>
                      {checkedItems[idx] && getRedistributedWeight(idx) !== (item.weight * 100) && (
                        <div className="text-xs text-success-600 mt-1">→ {getRedistributedWeight(idx).toFixed(1)}%</div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant={
                        item.current_score >= 90 ? 'success' :
                        item.current_score >= 50 ? 'warning' : 'error'
                      }>
                        {item.current_score.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      {checkedItems[idx] ? (
                        <div>
                          <div className="font-bold text-primary-600">{getRedistributedWeightedScore(idx).toFixed(1)}</div>
                          {getRedistributedWeightedScore(idx) !== item.weighted_score && (
                            <div className="text-xs text-slate-400 mt-1 line-through">{item.weighted_score.toFixed(1)}</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-slate-400 font-bold">Excluded</div>
                      )}
                    </td>
                    <td className="p-4 text-slate-600 text-sm">{item.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 space-y-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600 text-sm">Original Score</span>
                <span className="text-slate-700 font-bold text-lg">{analysis.overall_score.toFixed(1)} / 100 ({analysis.overall_grade})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg text-slate-900">Selected Items Score</span>
                <div className="flex items-center gap-4">
                  <span className={`text-3xl font-bold ${
                    getGradeFromScore(calculateSelectedScore()) === 'F' ? 'text-error-600' :
                    getGradeFromScore(calculateSelectedScore()) === 'D' ? 'text-orange-600' :
                    getGradeFromScore(calculateSelectedScore()) === 'C' ? 'text-warning-600' :
                    getGradeFromScore(calculateSelectedScore()) === 'B' ? 'text-primary-600' :
                    'text-success-600'
                  }`}>
                    {getGradeFromScore(calculateSelectedScore())}
                  </span>
                  <span className="font-bold text-2xl text-slate-900">{calculateSelectedScore().toFixed(1)} / 100</span>
                </div>
              </div>
            </div>
            <div className="bg-primary-50 rounded-lg p-3 border border-primary-200">
              <div className="text-primary-800 text-sm space-y-1">
                <div><strong>Uncheck</strong> = Excluded from evaluation (items being added)</div>
                <div>Weights are automatically redistributed to remaining items</div>
                <div>Green numbers show redistributed weights, strikethrough shows original weighted scores</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Problems */}
      <Card className="mb-8 border-error-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-error-700">
            <ExclamationCircleIcon className="w-6 h-6" />
            Critical Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.critical_problems.map((problem, idx) => (
              <div key={idx} className={`rounded-lg p-6 border-2 ${
                problem.severity === 'CRITICAL' ? 'bg-error-50 border-error-300' :
                problem.severity === 'HIGH' ? 'bg-orange-50 border-orange-300' :
                'bg-warning-50 border-warning-300'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-600 mb-1">{problem.category}</div>
                      <h3 className="text-xl font-bold text-slate-900">{problem.title}</h3>
                    </div>
                  </div>
                  <Badge variant={
                    problem.severity === 'CRITICAL' ? 'error' :
                    problem.severity === 'HIGH' ? 'warning' : 'warning'
                  }>
                    {problem.severity}
                  </Badge>
                </div>
                <p className="text-slate-700 mb-3">{problem.description}</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="bg-white rounded p-3 border border-slate-200">
                    <div className="text-slate-600 text-xs mb-1">Impact</div>
                    <div className="text-slate-900 font-semibold text-sm">{problem.impact}</div>
                  </div>
                  <div className="bg-white rounded p-3 border border-slate-200">
                    <div className="text-slate-600 text-xs mb-1">Score Impact</div>
                    <div className="text-error-600 font-bold text-sm">{problem.score_impact}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="mb-8 border-success-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-success-700">
            <LightBulbIcon className="w-6 h-6" />
            Improvement Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.recommendations.map((rec, idx) => (
              <div key={idx} className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={
                        rec.priority === 'CRITICAL' ? 'error' :
                        rec.priority === 'HIGH' ? 'warning' : 'warning'
                      }>
                        {rec.priority}
                      </Badge>
                      <span className="text-slate-600 text-sm">Expected duration: {rec.timeline}</span>
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">{rec.action}</h3>
                    <div className="bg-success-50 rounded p-3 border border-success-200">
                      <div className="text-success-700 text-sm mb-1">Expected Improvement:</div>
                      <div className="font-semibold text-success-900">{rec.expected_improvement}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link href="/quality/improvement">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-primary-300">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-primary-100 rounded-full mb-3">
                  <WrenchScrewdriverIcon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-slate-900">Improvement Guide</h3>
                <p className="text-sm text-slate-600">Detailed improvement methods and JSON examples</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/quality/samples">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-primary-300">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-primary-100 rounded-full mb-3">
                  <DocumentTextIcon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-slate-900">Sample Data</h3>
                <p className="text-sm text-slate-600">View dataset samples</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/quality">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-primary-300">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-primary-100 rounded-full mb-3">
                  <MagnifyingGlassIcon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-slate-900">Quality Validation</h3>
                <p className="text-sm text-slate-600">Full quality report</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </Layout>
  )
}
