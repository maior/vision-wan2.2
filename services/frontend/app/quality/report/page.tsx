'use client'

import { useEffect, useRef } from 'react'
import Layout from '@/components/Layout'
import * as d3 from 'd3'

export default function QualityReportPage() {
  const radarChartRef = useRef<HTMLDivElement>(null)
  const progressChartRef = useRef<HTMLDivElement>(null)
  const validationChartRef = useRef<HTMLDivElement>(null)
  const preprocessingChartRef = useRef<HTMLDivElement>(null)
  const timelineChartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (radarChartRef.current) {
      createRadarChart(radarChartRef.current)
    }

    if (progressChartRef.current) {
      createProgressChart(progressChartRef.current)
    }

    if (validationChartRef.current) {
      createValidationChart(validationChartRef.current)
    }

    if (preprocessingChartRef.current) {
      createPreprocessingChart(preprocessingChartRef.current)
    }

    if (timelineChartRef.current) {
      createTimelineChart(timelineChartRef.current)
    }
  }, [])

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3">📊 데이터셋 품질 평가 리포트</h1>
        <p className="text-gray-200 text-lg">학습 전 데이터셋 검증 현황 (RAPA 2025 기준)</p>
      </div>

      {/* 현재 상태 알림 */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-2xl p-8 mb-8 border-2 border-blue-400">
        <div className="text-center mb-4">
          <h2 className="text-white text-2xl mb-4 font-bold">🔍 현재 단계: 데이터셋 검증</h2>
          <div className="text-white text-xl mb-2">학습 전 데이터 품질 평가 진행 중</div>
          <p className="text-blue-100 text-base">총 199,994 샘플 수집 완료</p>
        </div>
        <div className="bg-blue-900 bg-opacity-40 rounded-lg p-4 mt-4">
          <p className="text-white text-sm text-center">
            ⚠️ CLIP Score & FVD는 학습 완료 후에 측정됩니다
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* 레이더 차트 - 6대 품질 특성 */}
        <div className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border border-gray-600">
          <h2 className="text-2xl font-bold text-white mb-3">📈 RAPA 6대 품질 특성</h2>
          <p className="text-gray-300 text-sm mb-6">측정 완료된 항목만 표시</p>
          <div ref={radarChartRef} className="flex justify-center"></div>
        </div>

        {/* 진행률 차트 - 체크리스트 완료도 */}
        <div className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border border-gray-600">
          <h2 className="text-2xl font-bold text-white mb-3">✅ 검증 진행률</h2>
          <p className="text-gray-300 text-sm mb-6">6대 품질 특성별 체크리스트 완료도</p>
          <div ref={progressChartRef}></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* 품질 검증 작업 */}
        <div className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border border-red-600">
          <h2 className="text-2xl font-bold text-white mb-3">🔍 품질 검증 필요 항목</h2>
          <p className="text-gray-300 text-sm mb-6">RAPA 기준 충족 확인 필요</p>
          <div ref={validationChartRef}></div>
        </div>

        {/* 전처리 작업 */}
        <div className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border border-blue-600">
          <h2 className="text-2xl font-bold text-white mb-3">⚙️ 전처리 필요 항목</h2>
          <p className="text-gray-300 text-sm mb-6">모델 요구사항 충족</p>
          <div ref={preprocessingChartRef}></div>
        </div>
      </div>

      {/* 타임라인 - 실행 계획 */}
      <div className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border border-gray-600 mb-8">
        <h2 className="text-2xl font-bold text-white mb-3">🗓️ 우선순위별 실행 계획</h2>
        <p className="text-gray-300 text-sm mb-6">Week 1-8 로드맵</p>
        <div ref={timelineChartRef}></div>
      </div>

      {/* 주요 발견 사항 */}
      <div className="bg-gradient-to-r from-orange-900 to-red-900 rounded-xl p-8 border-2 border-orange-500 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">⚠️ 주요 발견 사항</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-black bg-opacity-30 rounded-lg p-4">
            <h3 className="text-red-300 font-bold mb-2">🔴 Critical</h3>
            <ul className="text-white text-sm space-y-1">
              <li>• 비디오 총 시간: ~650시간 (목표 3,600시간의 18%)</li>
              <li>• 비디오 길이 초과: 14.9% &gt; 2% 목표</li>
              <li>• 형식성, 구문 정확성: 미측정</li>
            </ul>
          </div>
          <div className="bg-black bg-opacity-30 rounded-lg p-4">
            <h3 className="text-yellow-300 font-bold mb-2">🟡 개선 필요</h3>
            <ul className="text-white text-sm space-y-1">
              <li>• 캡션 토큰 수: 많은 샘플이 50토큰 미만</li>
              <li>• 캡션 문장 수: 평균 2-3문장 (목표 5문장)</li>
              <li>• 의미 정확성: 미측정</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 다음 단계 */}
      <div className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border border-green-600 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">🎯 다음 단계</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="text-2xl">1️⃣</div>
            <div>
              <h3 className="text-white font-bold">데이터셋 검증 완료 (4-8주)</h3>
              <p className="text-gray-300 text-sm">형식성, 구문 정확성, 의미 정확성 측정</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-2xl">2️⃣</div>
            <div>
              <h3 className="text-white font-bold">전처리 실행 (1주)</h3>
              <p className="text-gray-300 text-sm">해상도 변환, 비디오 트리밍, 캡션 개선</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-2xl">3️⃣</div>
            <div>
              <h3 className="text-white font-bold">LoRA Fine-tuning</h3>
              <p className="text-gray-300 text-sm">V100 GPU × 2로 학습 시작</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-2xl">4️⃣</div>
            <div>
              <h3 className="text-white font-bold">모델 평가 (학습 후)</h3>
              <p className="text-gray-300 text-sm">CLIP Score & FVD 측정 → RAPA 최종 등급 판정</p>
            </div>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-4">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition"
        >
          🖨️ 리포트 출력
        </button>
        <button
          onClick={() => window.open('/DATASET_QUALITY_CHECKLIST.md')}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl transition"
        >
          📋 전체 체크리스트 보기
        </button>
        <button
          onClick={() => window.history.back()}
          className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-xl transition"
        >
          ← 돌아가기
        </button>
      </div>
    </Layout>
  )
}

// 레이더 차트 - 6대 품질 특성 (측정 완료된 항목만)
function createRadarChart(container: HTMLElement) {
  const data = [
    { axis: '형식성', value: 0, measured: false },
    { axis: '다양성(통계)', value: 60, measured: true },
    { axis: '다양성(요건)', value: 30, measured: true },
    { axis: '구문 정확성', value: 0, measured: false },
    { axis: '의미 정확성', value: 0, measured: false },
    { axis: '유효성', value: 0, measured: false, note: '학습 후' }
  ]

  const width = 400
  const height = 400
  const margin = 80

  d3.select(container).selectAll('svg').remove()

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const radius = Math.min(width, height) / 2 - margin
  const angleSlice = (Math.PI * 2) / data.length

  const g = svg.append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2})`)

  const rScale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, radius])

  // 원형 그리드
  const levels = 5
  for (let i = 1; i <= levels; i++) {
    g.append('circle')
      .attr('r', radius * (i / levels))
      .attr('fill', 'none')
      .attr('stroke', '#4B5563')
      .attr('stroke-width', 1)
      .attr('opacity', 0.5)
  }

  // 축 선
  data.forEach((d, i) => {
    const angle = angleSlice * i - Math.PI / 2

    g.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', rScale(100) * Math.cos(angle))
      .attr('y2', rScale(100) * Math.sin(angle))
      .attr('stroke', '#6B7280')
      .attr('stroke-width', 1)

    const labelRadius = rScale(100) + 35
    const text = g.append('text')
      .attr('x', labelRadius * Math.cos(angle))
      .attr('y', labelRadius * Math.sin(angle))
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text(d.axis)

    if (!d.measured) {
      text.attr('fill', '#9CA3AF')
        .attr('opacity', 0.5)
    } else {
      text.attr('fill', '#F3F4F6')
    }

    if (d.note) {
      g.append('text')
        .attr('x', labelRadius * Math.cos(angle))
        .attr('y', labelRadius * Math.sin(angle) + 15)
        .attr('text-anchor', 'middle')
        .attr('fill', '#FCD34D')
        .attr('font-size', '10px')
        .text('(' + d.note + ')')
    }
  })

  // 측정 완료된 데이터만 표시
  const measuredData = data.filter(d => d.measured)

  if (measuredData.length > 0) {
    // 데이터 영역을 닫힌 형태로 만들기 위해 첫 번째 항목 추가
    const closedData = [...measuredData, measuredData[0]]

    const lineGenerator = d3.line<typeof data[0]>()
      .x((d, i) => {
        const originalIndex = data.indexOf(d)
        const angle = angleSlice * originalIndex - Math.PI / 2
        return rScale(d.value) * Math.cos(angle)
      })
      .y((d, i) => {
        const originalIndex = data.indexOf(d)
        const angle = angleSlice * originalIndex - Math.PI / 2
        return rScale(d.value) * Math.sin(angle)
      })
      .curve(d3.curveLinearClosed)

    g.append('path')
      .datum(closedData)
      .attr('d', lineGenerator)
      .attr('fill', '#3B82F6')
      .attr('fill-opacity', 0.3)
      .attr('stroke', '#3B82F6')
      .attr('stroke-width', 3)
  }

  // 데이터 포인트
  data.forEach((d, i) => {
    if (!d.measured) return

    const angle = angleSlice * i - Math.PI / 2
    const x = rScale(d.value) * Math.cos(angle)
    const y = rScale(d.value) * Math.sin(angle)

    g.append('circle')
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', 5)
      .attr('fill', '#3B82F6')
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
  })
}

// 진행률 차트 - 체크리스트 완료도
function createProgressChart(container: HTMLElement) {
  const data = [
    { category: '형식성', total: 9, completed: 0, percentage: 0 },
    { category: '다양성(통계)', total: 3, completed: 3, percentage: 100 },
    { category: '다양성(요건)', total: 4, completed: 0, percentage: 0 },
    { category: '구문 정확성', total: 6, completed: 0, percentage: 0 },
    { category: '의미 정확성', total: 3, completed: 0, percentage: 0 },
    { category: '유효성', total: 2, completed: 0, percentage: 0 }
  ]

  const margin = { top: 20, right: 80, bottom: 40, left: 120 }
  const width = 500 - margin.left - margin.right
  const height = 350 - margin.top - margin.bottom

  d3.select(container).selectAll('svg').remove()

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const y = d3.scaleBand()
    .domain(data.map(d => d.category))
    .range([0, height])
    .padding(0.2)

  const x = d3.scaleLinear()
    .domain([0, 100])
    .range([0, width])

  // Y축
  svg.append('g')
    .call(d3.axisLeft(y))
    .attr('color', '#9CA3AF')
    .selectAll('text')
    .attr('fill', '#F3F4F6')
    .attr('font-size', '13px')
    .attr('font-weight', 'bold')

  // 배경 막대 (회색)
  svg.selectAll('.bg-bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bg-bar')
    .attr('x', 0)
    .attr('y', d => y(d.category) || 0)
    .attr('width', width)
    .attr('height', y.bandwidth())
    .attr('fill', '#374151')
    .attr('opacity', 0.3)
    .attr('rx', 4)

  // 완료 막대
  svg.selectAll('.progress-bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'progress-bar')
    .attr('x', 0)
    .attr('y', d => y(d.category) || 0)
    .attr('width', d => x(d.percentage))
    .attr('height', y.bandwidth())
    .attr('fill', d => d.percentage === 100 ? '#10B981' : d.percentage > 0 ? '#3B82F6' : '#EF4444')
    .attr('opacity', 0.8)
    .attr('rx', 4)

  // 레이블
  svg.selectAll('.label')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'label')
    .attr('x', width + 10)
    .attr('y', d => (y(d.category) || 0) + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('fill', '#F3F4F6')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .text(d => `${d.completed}/${d.total}`)
}

// 품질 검증 작업
function createValidationChart(container: HTMLElement) {
  const data = [
    { task: '형식성 검증', items: 9, time: '3일', priority: 'high' },
    { task: '구문 정확성 검증', items: 6, time: '2일', priority: 'high' },
    { task: '의미 정확성 검증', items: 3, time: '2주', priority: 'medium' },
    { task: '캡션 토큰/문장 수', items: 1, time: '1주', priority: 'high' },
    { task: '비디오 총 시간 확인', items: 1, time: '1일', priority: 'critical' }
  ]

  const margin = { top: 20, right: 100, bottom: 40, left: 160 }
  const width = 500 - margin.left - margin.right
  const height = 350 - margin.top - margin.bottom

  d3.select(container).selectAll('svg').remove()

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const y = d3.scaleBand()
    .domain(data.map(d => d.task))
    .range([0, height])
    .padding(0.2)

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.items) || 10])
    .range([0, width])

  const colorMap: Record<string, string> = {
    critical: '#DC2626',
    high: '#EF4444',
    medium: '#F59E0B'
  }

  // Y축
  svg.append('g')
    .call(d3.axisLeft(y))
    .attr('color', '#9CA3AF')
    .selectAll('text')
    .attr('fill', '#F3F4F6')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')

  // 막대
  svg.selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', 0)
    .attr('y', d => y(d.task) || 0)
    .attr('width', d => x(d.items))
    .attr('height', y.bandwidth())
    .attr('fill', d => colorMap[d.priority])
    .attr('opacity', 0.9)
    .attr('rx', 4)

  // 레이블
  svg.selectAll('.label')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'label')
    .attr('x', width + 10)
    .attr('y', d => (y(d.task) || 0) + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('fill', '#F3F4F6')
    .attr('font-size', '11px')
    .attr('font-weight', 'bold')
    .text(d => `${d.items}항목 (${d.time})`)
}

// 전처리 작업
function createPreprocessingChart(container: HTMLElement) {
  const data = [
    { task: '해상도 변환', count: 155505, time: '3일', color: '#3B82F6' },
    { task: '비디오 트리밍', count: 29800, time: '2일', color: '#60A5FA' },
    { task: '캡션 개선', count: 20000, time: '5일', color: '#93C5FD' },
    { task: '키워드 생성', count: 130322, time: '2일', color: '#DBEAFE' }
  ]

  const margin = { top: 20, right: 80, bottom: 40, left: 130 }
  const width = 500 - margin.left - margin.right
  const height = 350 - margin.top - margin.bottom

  d3.select(container).selectAll('svg').remove()

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const y = d3.scaleBand()
    .domain(data.map(d => d.task))
    .range([0, height])
    .padding(0.2)

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.count) || 0])
    .range([0, width])

  // Y축
  svg.append('g')
    .call(d3.axisLeft(y))
    .attr('color', '#9CA3AF')
    .selectAll('text')
    .attr('fill', '#F3F4F6')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')

  // 막대
  svg.selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', 0)
    .attr('y', d => y(d.task) || 0)
    .attr('width', d => x(d.count))
    .attr('height', y.bandwidth())
    .attr('fill', d => d.color)
    .attr('opacity', 0.9)
    .attr('rx', 4)

  // 레이블
  svg.selectAll('.label')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'label')
    .attr('x', d => x(d.count) + 5)
    .attr('y', d => (y(d.task) || 0) + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('fill', '#F3F4F6')
    .attr('font-size', '11px')
    .attr('font-weight', 'bold')
    .text(d => `${d.count.toLocaleString()}개 (${d.time})`)
}

// 타임라인 차트
function createTimelineChart(container: HTMLElement) {
  const data = [
    { week: 'Week 1-2', task: '🔴 비디오 총 시간 확인', priority: 'critical', duration: 14, offset: 0 },
    { week: 'Week 1-2', task: '⚙️ 해상도 변환 + 트리밍', priority: 'preprocessing', duration: 14, offset: 0 },
    { week: 'Week 3-4', task: '🔍 형식성 + 구문 검증', priority: 'high', duration: 14, offset: 14 },
    { week: 'Week 3-4', task: '⚙️ 캡션 개선', priority: 'preprocessing', duration: 14, offset: 14 },
    { week: 'Week 5-8', task: '🔍 의미 정확성 검증', priority: 'medium', duration: 28, offset: 28 },
    { week: 'Week 5-8', task: '⚙️ 키워드/메타데이터', priority: 'preprocessing', duration: 28, offset: 28 }
  ]

  const margin = { top: 20, right: 30, bottom: 40, left: 170 }
  const width = 900 - margin.left - margin.right
  const height = 350 - margin.top - margin.bottom

  d3.select(container).selectAll('svg').remove()

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const x = d3.scaleLinear()
    .domain([0, 56]) // 8주
    .range([0, width])

  const y = d3.scaleBand()
    .domain(data.map(d => d.task))
    .range([0, height])
    .padding(0.2)

  const colorMap: Record<string, string> = {
    critical: '#DC2626',
    high: '#EF4444',
    medium: '#F59E0B',
    preprocessing: '#3B82F6'
  }

  // X축
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(8).tickFormat(d => `W${Math.floor(+d / 7) + 1}`))
    .attr('color', '#9CA3AF')
    .selectAll('text')
    .attr('fill', '#F3F4F6')

  // Y축
  svg.append('g')
    .call(d3.axisLeft(y))
    .attr('color', '#9CA3AF')
    .selectAll('text')
    .attr('fill', '#F3F4F6')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')

  // 타임라인 막대
  svg.selectAll('.timeline')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'timeline')
    .attr('x', d => x(d.offset))
    .attr('y', d => y(d.task) || 0)
    .attr('width', d => x(d.duration))
    .attr('height', y.bandwidth())
    .attr('fill', d => colorMap[d.priority])
    .attr('opacity', 0.8)
    .attr('rx', 4)

  // Week 레이블
  svg.selectAll('.week-label')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'week-label')
    .attr('x', d => x(d.offset + d.duration / 2))
    .attr('y', d => (y(d.task) || 0) + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'middle')
    .attr('fill', 'white')
    .attr('font-size', '11px')
    .attr('font-weight', 'bold')
    .text(d => d.week)
}
