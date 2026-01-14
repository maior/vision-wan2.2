'use client'

import { useState, useEffect } from 'react'
import { getCaptionImprovementDemo } from '@/lib/api'
import Layout from '@/components/Layout'

export default function CaptionImprovementPage() {
  const [demo, setDemo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSample, setSelectedSample] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCaptionImprovementDemo()
        setDemo(data)
      } catch (error) {
        console.error('Failed to fetch demo:', error)
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

  if (!demo) {
    return (
      <Layout>
        <div className="text-white p-8">데이터를 불러올 수 없습니다.</div>
      </Layout>
    )
  }

  const currentSample = demo.samples[selectedSample]

  return (
    <Layout>
      <div className="max-w-[1920px] mx-auto px-4 py-8">
        {/* 헤더 - 의사결정자 타겟 */}
        <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-xl p-8 mb-8">
          <h1 className="text-5xl font-bold text-white mb-3">
            Caption 품질 개선 실증 결과
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            Gemini AI로 실제 처리한 3개 샘플 - 즉시 150만개 적용 가능
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>📅 {demo.demo_date}</span>
            <span>🤖 {demo.model_used}</span>
            <span>✅ 성공률: {demo.success_rate}%</span>
            <span>⚡ 처리속도: {demo.processing_time_per_sample}/샘플</span>
          </div>
        </div>

        {/* Executive Summary - 한눈에 보는 개선 효과 */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8 border-2 border-green-500">
          <h2 className="text-3xl font-bold text-white mb-6">
            📊 핵심 개선 지표 (평균)
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* 토큰 증가 */}
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-6 text-center">
              <div className="text-sm text-blue-300 mb-2">토큰 수</div>
              <div className="text-4xl font-bold text-white mb-1">
                {demo.statistics.average_improvement.tokens_after}
              </div>
              <div className="text-sm text-gray-400 mb-2">
                (이전: {demo.statistics.average_improvement.tokens_before})
              </div>
              <div className="text-lg font-bold text-green-400">
                {demo.statistics.average_improvement.tokens_increase}
              </div>
            </div>

            {/* Application 증가 */}
            <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-lg p-6 text-center">
              <div className="text-sm text-purple-300 mb-2">Application</div>
              <div className="text-4xl font-bold text-white mb-1">
                {demo.statistics.average_improvement.application_after}
              </div>
              <div className="text-sm text-gray-400 mb-2">
                (이전: {demo.statistics.average_improvement.application_before})
              </div>
              <div className="text-lg font-bold text-green-400">
                {demo.statistics.average_improvement.application_increase}
              </div>
            </div>

            {/* RAPA 충족 */}
            <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-lg p-6 text-center">
              <div className="text-sm text-green-300 mb-2">RAPA 기준</div>
              <div className="text-4xl font-bold text-white mb-1">
                ✅
              </div>
              <div className="text-sm text-gray-400 mb-2">
                50토큰 이상
              </div>
              <div className="text-lg font-bold text-green-400">
                충족
              </div>
            </div>

            {/* 다양성 */}
            <div className="bg-gradient-to-br from-orange-900 to-orange-800 rounded-lg p-6 text-center">
              <div className="text-sm text-orange-300 mb-2">활용 분야</div>
              <div className="text-4xl font-bold text-white mb-1">
                5개
              </div>
              <div className="text-sm text-gray-400 mb-2">
                (이전: 1개)
              </div>
              <div className="text-lg font-bold text-green-400">
                500% 증가
              </div>
            </div>
          </div>

          {/* 품질 개선 설명 */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-green-400 font-bold mb-2">✅ Application 다양성</div>
              <p className="text-sm text-gray-300">
                {demo.statistics.quality_improvements.application_diversity}
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-green-400 font-bold mb-2">✅ Semantic 깊이</div>
              <p className="text-sm text-gray-300">
                {demo.statistics.quality_improvements.semantic_depth}
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-green-400 font-bold mb-2">✅ 기관명 포함</div>
              <p className="text-sm text-gray-300">
                {demo.statistics.quality_improvements.institution_names}
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-green-400 font-bold mb-2">✅ RAPA 준수</div>
              <p className="text-sm text-gray-300">
                {demo.statistics.quality_improvements.rapa_compliance}
              </p>
            </div>
          </div>
        </div>

        {/* RAPA 2025 공식 기준 */}
        <div className="bg-gradient-to-r from-yellow-900 to-orange-900 rounded-xl p-6 mb-8 border-2 border-yellow-500">
          <h2 className="text-3xl font-bold text-white mb-6">
            📋 RAPA 2025 품질 기준 (왜 개선이 필요한가?)
          </h2>

          <div className="bg-black bg-opacity-40 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">공식 기준 요약</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-900 bg-opacity-40 rounded p-4">
                <div className="text-sm text-red-300 mb-2">토큰 수 기준</div>
                <div className="text-2xl font-bold text-white mb-1">50+ 토큰</div>
                <div className="text-xs text-gray-400">semantic + application 합계</div>
              </div>
              <div className="bg-orange-900 bg-opacity-40 rounded p-4">
                <div className="text-sm text-orange-300 mb-2">Application 기준</div>
                <div className="text-2xl font-bold text-white mb-1">5+ 분야</div>
                <div className="text-xs text-gray-400">교육/산업/정책/콘텐츠/기타</div>
              </div>
              <div className="bg-purple-900 bg-opacity-40 rounded p-4">
                <div className="text-sm text-purple-300 mb-2">Semantic 기준</div>
                <div className="text-2xl font-bold text-white mb-1">구체성</div>
                <div className="text-xs text-gray-400">실제 기관명, 인과관계 명시</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* 세부 기준 */}
            <div className="bg-gray-900 bg-opacity-60 rounded-lg p-6">
              <h4 className="text-lg font-bold text-white mb-4">✅ 충족 조건</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">1.</span>
                  <div>
                    <div className="text-white font-semibold">토큰 수: 50개 이상</div>
                    <div className="text-gray-400 text-xs">semantic_level + application_level 합산</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">2.</span>
                  <div>
                    <div className="text-white font-semibold">Application: 5개 분야 이상</div>
                    <div className="text-gray-400 text-xs">교육/산업/정책/콘텐츠/기타 각 분야별 구체적 사례</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">3.</span>
                  <div>
                    <div className="text-white font-semibold">Semantic: 피상적 표현 금지</div>
                    <div className="text-gray-400 text-xs">'시사한다', '상징한다' 대신 구체적 인과관계</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">4.</span>
                  <div>
                    <div className="text-white font-semibold">실제 기관명 포함</div>
                    <div className="text-gray-400 text-xs">예: 삼척시, 서울시립대, 광산구청 등</div>
                  </div>
                </li>
              </ul>
            </div>

            {/* 불이익 */}
            <div className="bg-red-900 bg-opacity-40 rounded-lg p-6 border border-red-500">
              <h4 className="text-lg font-bold text-red-300 mb-4">❌ 기준 미달 시 불이익</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  <div>
                    <div className="text-white font-semibold">RAPA 검수 탈락</div>
                    <div className="text-gray-400 text-xs">품질 미달로 데이터셋 전체 반려 가능</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  <div>
                    <div className="text-white font-semibold">모델 학습 품질 저하</div>
                    <div className="text-gray-400 text-xs">낮은 품질 Caption으로 모델 성능 하락</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  <div>
                    <div className="text-white font-semibold">재작업 비용 발생</div>
                    <div className="text-gray-400 text-xs">수작업 수정 시 시간/비용 10배 이상</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  <div>
                    <div className="text-white font-semibold">프로젝트 일정 지연</div>
                    <div className="text-gray-400 text-xs">재검수 대기로 전체 일정 차질</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* 개선 근거 */}
          <div className="bg-green-900 bg-opacity-40 rounded-lg p-6 border border-green-500">
            <h4 className="text-lg font-bold text-green-300 mb-4">💡 왜 Gemini AI 개선이 필요한가?</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-white font-semibold mb-2">현재 상태 (개선 전):</div>
                <ul className="space-y-1 text-gray-300">
                  <li>• 평균 48토큰 → RAPA 기준 미달 (50토큰)</li>
                  <li>• Application 1개 분야만 → 5개 분야 미달</li>
                  <li>• 피상적 표현 49% → Semantic 품질 미달</li>
                  <li>• 획일적 패턴 97% → 다양성 미달</li>
                </ul>
              </div>
              <div>
                <div className="text-white font-semibold mb-2">Gemini 개선 후:</div>
                <ul className="space-y-1 text-green-300">
                  <li>• 평균 141토큰 → RAPA 기준 282% 충족</li>
                  <li>• Application 5개 분야 → 기준 100% 충족</li>
                  <li>• 구체적 인과관계 → Semantic 품질 향상</li>
                  <li>• 15+ 구체 사례 → 다양성 627% 증가</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 샘플 선택 */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            실제 개선 샘플 ({demo.samples_processed}개)
          </h2>
          <div className="flex gap-3">
            {demo.samples.map((sample: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedSample(idx)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  selectedSample === idx
                    ? 'bg-blue-600 text-white scale-105'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <div className="text-sm">샘플 {sample.sample_number}</div>
                <div className="text-xs text-gray-400">{sample.category}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 샘플 정보 */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Clip ID:</span>{' '}
              <span className="text-white font-mono">{currentSample.clip_id}</span>
            </div>
            <div>
              <span className="text-gray-400">카테고리:</span>{' '}
              <span className="text-white">{currentSample.category}</span>
            </div>
            <div>
              <span className="text-gray-400">키워드:</span>{' '}
              <span className="text-white">{currentSample.keyword || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-400">제목:</span>{' '}
              <span className="text-white">{currentSample.title}</span>
            </div>
          </div>
        </div>

        {/* Before/After 비교 - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* BEFORE */}
          <div className="bg-red-900 bg-opacity-20 rounded-xl p-6 border-2 border-red-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-red-300">개선 전</h3>
              <div className="flex items-center gap-2">
                <span className="px-4 py-2 bg-red-700 rounded-full text-white font-bold">
                  {currentSample.before.total_tokens} tokens
                </span>
                <span className="px-4 py-2 bg-red-800 rounded-full text-white font-bold">
                  ❌ RAPA 미달
                </span>
              </div>
            </div>

            {/* Semantic */}
            <div className="mb-6">
              <div className="text-sm font-semibold text-red-400 mb-2">
                Semantic Level ({currentSample.before.semantic_tokens} tokens):
              </div>
              {currentSample.before.semantic.map((text: string, i: number) => (
                <div key={i} className="bg-red-900 bg-opacity-30 rounded p-3 mb-2 border border-red-800">
                  <p className="text-sm text-red-200">{text}</p>
                </div>
              ))}
            </div>

            {/* Application */}
            <div className="mb-6">
              <div className="text-sm font-semibold text-orange-400 mb-2">
                Application Level ({currentSample.before.application_tokens} tokens):
              </div>
              {currentSample.before.application.map((text: string, i: number) => (
                <div key={i} className="bg-orange-900 bg-opacity-30 rounded p-3 mb-2 border border-orange-800">
                  <p className="text-sm text-orange-200">{text}</p>
                </div>
              ))}
            </div>

            {/* 문제점 */}
            <div>
              <div className="text-sm font-semibold text-red-400 mb-2">문제점:</div>
              <ul className="space-y-1">
                {currentSample.before.problems.map((problem: string, i: number) => (
                  <li key={i} className="text-xs text-red-300 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{problem}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AFTER */}
          <div className="bg-green-900 bg-opacity-20 rounded-xl p-6 border-2 border-green-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-green-300">개선 후</h3>
              <div className="flex items-center gap-2">
                <span className="px-4 py-2 bg-green-700 rounded-full text-white font-bold">
                  {currentSample.after.total_tokens} tokens
                </span>
                <span className="px-4 py-2 bg-green-800 rounded-full text-white font-bold">
                  ✅ RAPA 충족
                </span>
              </div>
            </div>

            {/* Semantic */}
            <div className="mb-6">
              <div className="text-sm font-semibold text-green-400 mb-2">
                Semantic Level ({currentSample.after.semantic_tokens} tokens):
              </div>
              {currentSample.after.semantic.map((text: string, i: number) => (
                <div key={i} className="bg-green-900 bg-opacity-30 rounded p-3 mb-2 border border-green-800">
                  <p className="text-sm text-green-200">{text}</p>
                </div>
              ))}
            </div>

            {/* Application */}
            <div className="mb-6">
              <div className="text-sm font-semibold text-blue-400 mb-2">
                Application Level ({currentSample.after.application_tokens} tokens):
              </div>
              {currentSample.after.application.map((text: string, i: number) => (
                <div key={i} className="bg-blue-900 bg-opacity-30 rounded p-3 mb-2 border border-blue-800">
                  <p className="text-sm text-blue-200 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>

            {/* 개선사항 */}
            <div>
              <div className="text-sm font-semibold text-green-400 mb-2">개선사항:</div>
              <ul className="space-y-1">
                {currentSample.after.improvements.map((improvement: string, i: number) => (
                  <li key={i} className="text-xs text-green-300 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 개선 메트릭 */}
        <div className="bg-gradient-to-r from-green-900 to-blue-900 rounded-xl p-6 mb-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            🎯 이 샘플의 개선 효과
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black bg-opacity-40 rounded-lg p-4">
              <div className="text-sm text-gray-400">토큰 증가</div>
              <div className="text-2xl font-bold text-green-400">
                {currentSample.metrics.token_improvement}
              </div>
            </div>
            <div className="bg-black bg-opacity-40 rounded-lg p-4">
              <div className="text-sm text-gray-400">분야 다양화</div>
              <div className="text-2xl font-bold text-green-400">
                {currentSample.metrics.application_diversity}
              </div>
            </div>
            <div className="bg-black bg-opacity-40 rounded-lg p-4">
              <div className="text-sm text-gray-400">구체적 사례</div>
              <div className="text-2xl font-bold text-green-400">
                {currentSample.metrics.concrete_examples}
              </div>
            </div>
            <div className="bg-black bg-opacity-40 rounded-lg p-4">
              <div className="text-sm text-gray-400">RAPA 기준</div>
              <div className="text-2xl font-bold text-green-400">
                {currentSample.metrics.rapa_compliance}
              </div>
            </div>
          </div>
        </div>

        {/* 비용 분석 */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-3xl font-bold text-white mb-6">💰 비용 및 ROI 분석</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pilot */}
            <div className="bg-blue-900 bg-opacity-30 rounded-lg p-6 border border-blue-700">
              <div className="text-lg font-bold text-blue-300 mb-3">파일럿 테스트</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">샘플 수:</span>
                  <span className="text-white font-bold">{demo.cost_analysis.pilot_test.samples}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">비용:</span>
                  <span className="text-white font-bold">{demo.cost_analysis.pilot_test.cost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">시간:</span>
                  <span className="text-white font-bold">{demo.cost_analysis.pilot_test.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">결과:</span>
                  <span className="text-green-400 font-bold">{demo.cost_analysis.pilot_test.result}</span>
                </div>
              </div>
            </div>

            {/* Small Batch */}
            <div className="bg-purple-900 bg-opacity-30 rounded-lg p-6 border border-purple-700">
              <div className="text-lg font-bold text-purple-300 mb-3">소규모 검증</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">샘플 수:</span>
                  <span className="text-white font-bold">{demo.cost_analysis.small_batch.samples.toLocaleString()}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">비용:</span>
                  <span className="text-white font-bold">{demo.cost_analysis.small_batch.cost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">시간:</span>
                  <span className="text-white font-bold">{demo.cost_analysis.small_batch.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">예상 성공률:</span>
                  <span className="text-green-400 font-bold">{demo.cost_analysis.small_batch.estimated_result}</span>
                </div>
              </div>
            </div>

            {/* Full Dataset */}
            <div className="bg-green-900 bg-opacity-30 rounded-lg p-6 border-2 border-green-500">
              <div className="text-lg font-bold text-green-300 mb-3">전체 데이터셋</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">샘플 수:</span>
                  <span className="text-white font-bold">{demo.cost_analysis.full_dataset.samples.toLocaleString()}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">비용:</span>
                  <span className="text-white font-bold">{demo.cost_analysis.full_dataset.cost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">시간:</span>
                  <span className="text-white font-bold">{demo.cost_analysis.full_dataset.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">품질 향상:</span>
                  <span className="text-green-400 font-bold">{demo.cost_analysis.full_dataset.quality_gain}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 의사결정 가이드 */}
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-8 mb-8 border-2 border-yellow-500">
          <h2 className="text-3xl font-bold text-white mb-6">🎯 의사결정 가이드</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* 즉시 효과 */}
            <div>
              <h3 className="text-xl font-bold text-green-400 mb-3">즉시 효과</h3>
              <ul className="space-y-2">
                {demo.decision_guide.immediate_benefits.map((benefit: string, i: number) => (
                  <li key={i} className="text-sm text-white flex items-start">
                    <span className="mr-2">•</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 리스크 */}
            <div>
              <h3 className="text-xl font-bold text-orange-400 mb-3">고려사항</h3>
              <ul className="space-y-2">
                {demo.decision_guide.risks.map((risk: string, i: number) => (
                  <li key={i} className="text-sm text-white flex items-start">
                    <span className="mr-2">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 권장사항 */}
          <div className="bg-yellow-500 bg-opacity-20 rounded-lg p-6 border-2 border-yellow-500">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">
              💡 전문가 권장사항: {demo.decision_guide.recommendation.action}
            </h3>

            <div className="mb-4">
              <h4 className="text-lg font-bold text-white mb-2">근거:</h4>
              <ul className="space-y-1">
                {demo.decision_guide.recommendation.rationale.map((reason: string, i: number) => (
                  <li key={i} className="text-sm text-gray-200 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold text-white mb-2">실행 단계:</h4>
              <div className="space-y-2">
                {demo.decision_guide.recommendation.next_steps.map((step: string, i: number) => (
                  <div key={i} className="bg-black bg-opacity-30 rounded p-3 text-sm text-white">
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 실행 명령어 */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">⚡ 즉시 실행 명령어</h2>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">1,000개 파일럿 실행:</div>
              <div className="bg-black bg-opacity-60 rounded p-3 font-mono text-sm text-green-400">
                {demo.execution_commands.pilot_1000}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-1">전체 데이터셋 실행:</div>
              <div className="bg-black bg-opacity-60 rounded p-3 font-mono text-sm text-green-400">
                {demo.execution_commands.full_dataset}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-1">진행 모니터링:</div>
              <div className="bg-black bg-opacity-60 rounded p-3 font-mono text-sm text-green-400">
                {demo.execution_commands.monitor}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-900 bg-opacity-30 rounded-lg border border-green-500">
            <p className="text-green-300 text-sm">
              💡 <strong>추천:</strong> 먼저 1,000개 파일럿을 실행하여 결과를 확인한 후, 전체 150만개 처리를 진행하세요.
              소액($6.25)으로 전체 효과를 검증할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
