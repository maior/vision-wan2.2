'use client'

import { useState } from 'react'
import Layout from '@/components/Layout'

export default function QualityAnalysisPage() {
  const [activeTab, setActiveTab] = useState('summary')

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">📊 데이터셋 품질 종합 분석</h1>
        <p className="text-gray-200 text-lg">학습 전 데이터셋 검증 현황 (RAPA 2025 기준)</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-800 border-b-2 border-gray-600 -mx-6 px-6 mb-8">
        <div className="flex space-x-2 overflow-x-auto">
            {[
              { id: 'summary', label: '📋 현황 요약' },
              { id: 'checklist', label: '✅ 체크리스트' },
              { id: 'validation', label: '🔍 검증 작업' },
              { id: 'preprocessing', label: '⚙️ 전처리' },
              { id: 'posttraining', label: '🎯 학습 후 평가' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-bold text-base transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white border-b-4 border-purple-400 shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700 hover:border-b-4 hover:border-gray-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'summary' && <SummaryTab />}
      {activeTab === 'checklist' && <ChecklistTab />}
      {activeTab === 'validation' && <ValidationTab />}
      {activeTab === 'preprocessing' && <PreprocessingTab />}
      {activeTab === 'posttraining' && <PostTrainingTab />}
    </Layout>
  )
}

// 현황 요약
function SummaryTab() {
  return (
    <div className="space-y-8">
      {/* 현재 단계 */}
      <div className="bg-gradient-to-r from-green-900 to-teal-900 rounded-xl p-8 border-2 border-green-500 shadow-2xl">
        <h2 className="text-3xl font-bold mb-6 text-white">🔍 현재 단계: 데이터셋 검증 일부 완료</h2>
        <div className="bg-green-900 bg-opacity-40 rounded-xl p-6">
          <div className="text-center mb-4">
            <div className="text-white text-4xl font-bold mb-3">2개 항목 검증 완료</div>
            <div className="text-green-100 text-lg mb-2">총 179,994 샘플 (비디오 89,920개 + 이미지 90,074개)</div>
            <div className="text-green-200 text-base">✅ 형식성, 다양성(요건) 측정 완료</div>
          </div>
        </div>
        <div className="mt-4 bg-yellow-900 bg-opacity-30 rounded-lg p-4 border border-yellow-600">
          <p className="text-yellow-100 text-sm text-center">
            ⚠️ Critical: 비디오 총 시간 577시간 (목표 3,600시간의 16%) - 추가 데이터 필요
          </p>
        </div>
        <div className="mt-3 bg-blue-900 bg-opacity-30 rounded-lg p-4">
          <p className="text-white text-sm text-center">
            ℹ️ 최종 품질 등급은 학습 완료 후 CLIP Score & FVD 측정 시 결정됩니다
          </p>
        </div>
      </div>

      {/* 데이터셋 품질 특성 (5개 - 유효성 제외) */}
      <div className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border border-gray-600">
        <h2 className="text-3xl font-bold mb-3 text-white">📋 데이터셋 품질 특성 평가</h2>
        <p className="text-gray-300 text-sm mb-6">학습 전 측정 가능한 5개 특성</p>
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b-2 border-gray-600 bg-gray-700 bg-opacity-50">
                <th className="text-left p-4 text-white font-bold">품질 특성</th>
                <th className="text-left p-4 text-white font-bold">목표</th>
                <th className="text-left p-4 text-white font-bold">측정 상태</th>
                <th className="text-left p-4 text-white font-bold">필요 조치</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  name: '1. 형식성',
                  target: '파일 유효성·포맷·속성 99%',
                  status: '✅ 측정 완료',
                  action: '비디오 100% 존재, JSON 100% 파싱 가능',
                  statusColor: 'green',
                  detail: '파일 존재율 100%'
                },
                {
                  name: '2. 다양성(통계)',
                  target: '장르·길이·카테고리 분포',
                  status: '일부 확인',
                  action: '비디오 길이 분포 개선 필요',
                  statusColor: 'yellow',
                  detail: '평균 23.12초 (25초+ 15.2%)'
                },
                {
                  name: '3. 다양성(요건)',
                  target: '총 3,600시간, 토큰 50+',
                  status: '✅ 측정 완료',
                  action: '❌ 총 시간 577시간 (84% 부족), ✅ 토큰·문장 충족',
                  statusColor: 'red',
                  detail: '3/4 항목 달성'
                },
                {
                  name: '4. 구문 정확성',
                  target: 'JSON 스키마·형식 99.5%',
                  status: '미측정',
                  action: 'JSON 스키마 전수 검사 필요',
                  statusColor: 'gray',
                  detail: '검증 예정'
                },
                {
                  name: '5. 의미 정확성',
                  target: '영상-캡션 일치 90%',
                  status: '미측정',
                  action: '수동 샘플링 검증 필요 (500개+)',
                  statusColor: 'gray',
                  detail: '검증 예정'
                }
              ].map((item, idx) => (
                <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700 hover:bg-opacity-30 transition">
                  <td className="p-4 font-bold text-white text-base">
                    {item.name}
                    {item.detail && (
                      <div className="text-xs text-gray-400 font-normal mt-1">
                        {item.detail}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-gray-100">{item.target}</td>
                  <td className={`p-4 font-bold text-base ${
                    item.statusColor === 'green' ? 'text-green-300' :
                    item.statusColor === 'red' ? 'text-red-300' :
                    item.statusColor === 'yellow' ? 'text-yellow-300' :
                    'text-gray-400'
                  }`}>
                    {item.status}
                  </td>
                  <td className="p-4 text-gray-100 text-sm">{item.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 학습 후 평가 항목 */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl p-8 border-2 border-purple-400">
        <h2 className="text-3xl font-bold mb-3 text-white">⏳ 학습 후 평가 (유효성)</h2>
        <p className="text-purple-100 text-base mb-6">현재 측정 불가 - LoRA Fine-tuning 완료 후 측정</p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-purple-900 bg-opacity-40 rounded-lg p-6 border border-purple-500">
            <h3 className="text-white font-bold text-xl mb-3">🎯 CLIP Score</h3>
            <div className="text-purple-100 text-sm mb-3">
              사용자 프롬프트 vs Wan2.2 생성 비디오
            </div>
            <div className="bg-black bg-opacity-30 rounded p-3">
              <div className="text-gray-300 text-sm">목표: ≥ 0.3</div>
              <div className="text-gray-300 text-sm">측정 시점: 학습 완료 후</div>
              <div className="text-yellow-300 text-sm font-bold">⏳ 대기 중</div>
            </div>
          </div>
          <div className="bg-purple-900 bg-opacity-40 rounded-lg p-6 border border-purple-500">
            <h3 className="text-white font-bold text-xl mb-3">📐 FVD</h3>
            <div className="text-purple-100 text-sm mb-3">
              실제 비디오 vs Wan2.2 생성 비디오
            </div>
            <div className="bg-black bg-opacity-30 rounded p-3">
              <div className="text-gray-300 text-sm">목표: ≤ 1140</div>
              <div className="text-gray-300 text-sm">측정 시점: 학습 완료 후</div>
              <div className="text-yellow-300 text-sm font-bold">⏳ 대기 중</div>
            </div>
          </div>
        </div>
      </div>

      {/* 주요 발견 사항 - 실측값 반영 */}
      <div className="bg-gradient-to-r from-orange-900 to-red-900 rounded-xl p-8 border-2 border-orange-500">
        <h2 className="text-3xl font-bold mb-6 text-white">⚠️ 주요 발견 사항 (실측)</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-black bg-opacity-30 rounded-lg p-5">
            <h3 className="text-red-300 font-bold text-lg mb-3">🔴 Critical</h3>
            <ul className="text-white text-sm space-y-2">
              <li>• <strong>비디오 총 시간 심각 부족</strong><br/><span className="text-red-200">577시간 / 목표 3,600시간 (84% 부족)</span></li>
              <li>• 구문 정확성 미측정<br/><span className="text-red-200">JSON 스키마 검증 필요</span></li>
              <li>• 의미 정확성 미측정<br/><span className="text-red-200">수동 샘플링 검증 필요</span></li>
            </ul>
          </div>
          <div className="bg-black bg-opacity-30 rounded-lg p-5">
            <h3 className="text-yellow-300 font-bold text-lg mb-3">🟡 Warning</h3>
            <ul className="text-white text-sm space-y-2">
              <li>• 비디오 길이 25초 초과<br/><span className="text-yellow-200">15.2% &gt; 목표 2% 미만</span></li>
              <li>• 다양성(통계) 완전 검증 필요<br/><span className="text-yellow-200">장르/카테고리 상세 분석</span></li>
            </ul>
          </div>
          <div className="bg-black bg-opacity-30 rounded-lg p-5">
            <h3 className="text-green-300 font-bold text-lg mb-3">✅ 양호</h3>
            <ul className="text-white text-sm space-y-2">
              <li>• <strong>파일 존재율 100%</strong><br/><span className="text-green-200">89,920개 비디오 모두 존재</span></li>
              <li>• <strong>평균 길이 23.12초</strong><br/><span className="text-green-200">목표 20초 초과 달성 ✅</span></li>
              <li>• <strong>캡션 품질 우수</strong><br/><span className="text-green-200">평균 227.9토큰, 14.9문장 ✅</span></li>
            </ul>
          </div>
        </div>
      </div>

      {/* 다음 단계 */}
      <div className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border border-green-600">
        <h2 className="text-3xl font-bold mb-6 text-white">🎯 다음 단계</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-gray-700 bg-opacity-50 rounded-lg">
            <div className="text-3xl">1️⃣</div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-2">데이터셋 검증 완료 (4-8주)</h3>
              <div className="text-gray-300 text-sm">
                • 형식성: 파일 유효성, 포맷, 속성 검사<br/>
                • 구문 정확성: JSON 스키마, 형식 검증<br/>
                • 의미 정확성: 수동 샘플링 검증 (500개 이상)
              </div>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-gray-700 bg-opacity-50 rounded-lg">
            <div className="text-3xl">2️⃣</div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-2">전처리 실행 (1주)</h3>
              <div className="text-gray-300 text-sm">
                • 해상도 1280×720 변환, 비디오 트리밍<br/>
                • 캡션 품질 개선 (토큰/문장 수 증가)
              </div>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-gray-700 bg-opacity-50 rounded-lg">
            <div className="text-3xl">3️⃣</div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-2">LoRA Fine-tuning</h3>
              <div className="text-gray-300 text-sm">
                V100 GPU × 2로 학습 시작
              </div>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-500">
            <div className="text-3xl">4️⃣</div>
            <div className="flex-1">
              <h3 className="text-blue-200 font-bold text-lg mb-2">모델 평가 (학습 후)</h3>
              <div className="text-blue-100 text-sm">
                • CLIP Score 측정 (텍스트-영상 정렬도)<br/>
                • FVD 측정 (비디오 품질)<br/>
                • <span className="text-yellow-300 font-bold">→ RAPA 최종 품질 등급 판정</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 체크리스트
function ChecklistTab() {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-xl p-8 border-2 border-purple-500">
        <h2 className="text-3xl font-bold mb-3 text-white">✅ 데이터셋 품질 체크리스트</h2>
        <p className="text-purple-100 text-lg">RAPA 6대 품질 특성 기준</p>
      </div>

      {/* 5개 특성 체크리스트 */}
      {[
        {
          title: '1. 형식성 (Formality)',
          target: '99% 이상',
          color: 'blue',
          items: [
            { task: '파일 유효성 검사', desc: 'mp4/json 파일 손상 확인', status: 'pending', time: '1일' },
            { task: '파일 포맷 적합성', desc: '비디오 mp4, 메타데이터 JSON 확인', status: 'pending', time: '1일' },
            { task: '파일 속성 정확성', desc: '해상도/프레임레이트/길이 메타 vs 실제', status: 'pending', time: '2일' }
          ]
        },
        {
          title: '2. 다양성(통계) (Diversity - Statistical)',
          target: '분포 확인',
          color: 'green',
          items: [
            { task: '장르별 분포 확인', desc: '예능/드라마/뉴스/다큐 균형', status: 'completed', time: '-' },
            { task: '비디오 길이 분포', desc: '평균 20초, 25초 이상 2% 미만', status: 'completed', time: '-', note: '14.9% 개선 필요' },
            { task: '카테고리별 분포', desc: '8개 중분류 균형', status: 'completed', time: '-' }
          ]
        },
        {
          title: '3. 다양성(요건) (Diversity - Requirements)',
          target: '최소값 충족',
          color: 'yellow',
          items: [
            { task: '비디오 총 시간', desc: '3,600시간 이상', status: 'pending', time: '1일', note: '~650시간 추정' },
            { task: '비디오 평균 길이', desc: '20초 이상', status: 'pending', time: '1일', note: '~13초 추정' },
            { task: '캡션 토큰 수', desc: '50토큰 이상', status: 'pending', time: '1주', note: '많은 샘플 미달' },
            { task: '캡션 문장 수', desc: '5문장 이상', status: 'pending', time: '1주', note: '평균 2-3문장' }
          ]
        },
        {
          title: '4. 구문 정확성 (Syntactic Accuracy)',
          target: '99.5% 이상',
          color: 'purple',
          items: [
            { task: 'JSON 스키마 준수', desc: '필수 필드 존재 확인', status: 'pending', time: '1일' },
            { task: 'JSON 형식 정확성', desc: '타임코드/날짜/ID 형식', status: 'pending', time: '1일' }
          ]
        },
        {
          title: '5. 의미 정확성 (Semantic Accuracy)',
          target: '90% 이상',
          color: 'pink',
          items: [
            { task: '표현 적절성', desc: '캡션이 영상을 적절히 표현', status: 'pending', time: '2주' },
            { task: '영상-설명문 일치성', desc: '캡션 vs 실제 영상 내용 일치', status: 'pending', time: '2주' }
          ]
        }
      ].map((category, idx) => (
        <div key={idx} className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border-l-4 border-${category.color}-500 border border-gray-600">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">{category.title}</h3>
              <p className="text-gray-300">목표: {category.target}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">완료</div>
              <div className="text-2xl font-bold text-white">
                {category.items.filter(i => i.status === 'completed').length}/{category.items.length}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {category.items.map((item, itemIdx) => (
              <div key={itemIdx} className={`p-4 rounded-lg ${
                item.status === 'completed' ? 'bg-green-900 bg-opacity-30 border border-green-700' : 'bg-gray-700 bg-opacity-50'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="text-xl">
                      {item.status === 'completed' ? '✅' : '⏳'}
                    </div>
                    <div>
                      <div className="text-white font-bold">{item.task}</div>
                      <div className="text-gray-300 text-sm">{item.desc}</div>
                      {item.note && (
                        <div className="text-yellow-300 text-sm mt-1">💡 {item.note}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// 검증 작업
function ValidationTab() {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-red-900 to-orange-900 rounded-xl p-8 border-2 border-red-500">
        <h2 className="text-3xl font-bold mb-3 text-white">🔍 품질 검증 필요 항목</h2>
        <p className="text-red-100 text-lg">RAPA 기준 충족 확인</p>
      </div>

      {/* 우선순위별 검증 작업 */}
      <div className="space-y-6">
        <div className="bg-red-900 bg-opacity-30 rounded-xl p-6 border-2 border-red-500">
          <h3 className="text-2xl font-bold text-red-200 mb-4">🔴 Critical (Week 1-2)</h3>
          <div className="space-y-3">
            {[
              { task: '비디오 총 시간 정확히 계산', time: '1일', reason: '현재 추정치 650시간 확인 필요', priority: 'critical' },
              { task: '형식성 검증: 파일 유효성', time: '1일', reason: 'mp4/json 손상 확인', priority: 'critical' },
              { task: '형식성 검증: 파일 포맷', time: '1일', reason: '형식 준수 확인', priority: 'critical' }
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-800 bg-opacity-70 rounded-lg p-4 border border-red-700">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-white font-bold text-lg">{item.task}</div>
                    <div className="text-gray-300 text-sm mt-1">{item.reason}</div>
                  </div>
                  <div className="text-red-300 font-bold">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-orange-900 bg-opacity-30 rounded-xl p-6 border-2 border-orange-500">
          <h3 className="text-2xl font-bold text-orange-200 mb-4">🟠 High (Week 3-4)</h3>
          <div className="space-y-3">
            {[
              { task: '구문 정확성: JSON 스키마 검증', time: '1일', reason: '필수 필드 존재 확인' },
              { task: '구문 정확성: 형식 정확성', time: '1일', reason: '타임코드/날짜 형식' },
              { task: '캡션 토큰/문장 수 확인', time: '1주', reason: '50토큰, 5문장 목표' },
              { task: '형식성: 파일 속성 정확성', time: '2일', reason: '메타데이터 vs 실제 일치' }
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-800 bg-opacity-70 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-white font-bold">{item.task}</div>
                    <div className="text-gray-300 text-sm mt-1">{item.reason}</div>
                  </div>
                  <div className="text-orange-300 font-bold">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-900 bg-opacity-30 rounded-xl p-6 border-2 border-yellow-500">
          <h3 className="text-2xl font-bold text-yellow-200 mb-4">🟡 Medium (Week 5-8)</h3>
          <div className="space-y-3">
            {[
              { task: '의미 정확성: 수동 샘플링 검증', time: '2주', reason: '500개 이상 샘플 확인', detail: '캡션이 영상 내용 적절히 표현하는지' }
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-800 bg-opacity-70 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="text-white font-bold">{item.task}</div>
                    <div className="text-gray-300 text-sm mt-1">{item.reason}</div>
                    {item.detail && <div className="text-gray-400 text-sm mt-1">→ {item.detail}</div>}
                  </div>
                  <div className="text-yellow-300 font-bold">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// 전처리
function PreprocessingTab() {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-900 to-cyan-900 rounded-xl p-8 border-2 border-blue-500">
        <h2 className="text-3xl font-bold mb-3 text-white">⚙️ 전처리 필요 항목</h2>
        <p className="text-blue-100 text-lg">품질 평가 대상 아님 - 모델 요구사항 충족</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {[
          {
            title: '해상도 변환',
            count: 155505,
            percentage: '77.8%',
            time: '3일',
            icon: '📐',
            from: '1920×1080',
            to: '1280×720',
            reason: 'Wan2.2 모델 지원 해상도',
            command: 'python scripts/batch_resize.py --input_csv all_train.csv --target 1280 720'
          },
          {
            title: '비디오 트리밍',
            count: 29800,
            percentage: '14.9%',
            time: '2일',
            icon: '✂️',
            from: '25초 초과',
            to: '25초 이하',
            reason: '메모리 효율 + 다양성(통계) 기준',
            command: 'python scripts/batch_trim_videos.py --input_csv all_train.csv --max_duration 25.0'
          },
          {
            title: '캡션 개선',
            count: 20000,
            percentage: '~10%',
            time: '5일',
            icon: '✍️',
            from: '토큰 부족, 중복',
            to: '50토큰+, 5문장+',
            reason: '다양성(요건) 기준 충족',
            command: 'python scripts/batch_improve_captions.py --fix_duplicates --fix_media_type --make_concrete'
          },
          {
            title: '키워드 자동 생성',
            count: 130322,
            percentage: '65.2%',
            time: '2일',
            icon: '🔖',
            from: 'null',
            to: '자동 생성',
            reason: '검색성 향상 (학습에 영향 없음)',
            command: 'python scripts/generate_keywords.py --method tfidf'
          }
        ].map((item, idx) => (
          <div key={idx} className="bg-gray-800 bg-opacity-70 rounded-xl p-6 border border-blue-600">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">{item.icon}</div>
              <div>
                <h3 className="text-white font-bold text-xl">{item.title}</h3>
                <div className="text-blue-300 text-sm">{item.count.toLocaleString()}개 ({item.percentage})</div>
              </div>
            </div>
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="text-red-300 font-mono text-sm">{item.from}</div>
                <div className="text-gray-400">→</div>
                <div className="text-green-300 font-mono text-sm">{item.to}</div>
              </div>
              <div className="text-gray-300 text-sm">
                <span className="text-gray-400">이유:</span> {item.reason}
              </div>
              <div className="text-gray-300 text-sm">
                <span className="text-gray-400">소요:</span> <span className="text-yellow-300 font-bold">{item.time}</span>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="text-green-400 font-mono text-xs overflow-x-auto">
                {item.command}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 학습 후 평가
function PostTrainingTab() {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl p-8 border-2 border-purple-500">
        <h2 className="text-3xl font-bold mb-3 text-white">🎯 학습 후 평가 (유효성)</h2>
        <p className="text-purple-100 text-lg">LoRA Fine-tuning 완료 후 측정</p>
      </div>

      <div className="bg-yellow-900 bg-opacity-30 rounded-xl p-6 border-2 border-yellow-500">
        <div className="flex items-start gap-4">
          <div className="text-4xl">⏳</div>
          <div>
            <h3 className="text-yellow-200 font-bold text-xl mb-2">현재 상태: 측정 불가</h3>
            <p className="text-yellow-100 text-base">
              CLIP Score와 FVD는 Wan2.2 모델이 비디오를 생성한 후에만 측정할 수 있습니다.<br/>
              학습 전 데이터셋에서는 측정할 수 없습니다.
            </p>
          </div>
        </div>
      </div>

      {/* CLIP Score */}
      <div className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border-l-4 border-blue-500 border border-gray-600">
        <h3 className="text-2xl font-bold text-white mb-4">🎯 CLIP Score (텍스트-영상 정렬도)</h3>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-blue-900 bg-opacity-30 rounded-lg p-5">
            <h4 className="text-blue-300 font-bold mb-3">📖 정의</h4>
            <p className="text-gray-100 text-sm leading-relaxed">
              사용자 프롬프트와 Wan2.2가 생성한 비디오 간의 의미적 일치도를 측정합니다.
            </p>
          </div>
          <div className="bg-blue-900 bg-opacity-30 rounded-lg p-5">
            <h4 className="text-blue-300 font-bold mb-3">🎯 RAPA 기준</h4>
            <div className="text-gray-100 text-sm space-y-1">
              <div>목표: <span className="text-green-300 font-bold">≥ 0.3</span></div>
              <div>출처: 사업수행계획서 p.34</div>
            </div>
          </div>
        </div>

        <div className="bg-purple-900 bg-opacity-20 rounded-lg p-5 mb-6">
          <h4 className="text-purple-300 font-bold mb-3">🔬 측정 방법</h4>
          <ol className="list-decimal list-outside text-gray-100 text-sm space-y-2 ml-6">
            <li>학습 완료 후 테스트 프롬프트 준비 (예: 1,000개)</li>
            <li>각 프롬프트로 Wan2.2가 비디오 생성</li>
            <li>생성된 비디오에서 8프레임 샘플링</li>
            <li>CLIP 모델로 프롬프트-프레임 간 코사인 유사도 계산</li>
            <li>평균 CLIP Score 산출</li>
          </ol>
        </div>

        <div className="bg-gray-900 rounded-lg p-4">
          <div className="text-green-400 font-mono text-sm mb-2">예상 명령어 (학습 후)</div>
          <div className="text-green-300 font-mono text-xs overflow-x-auto">
            python scripts/calculate_clip_score_generated.py --model_path ./finetuned_model --prompts test_prompts.txt --output clip_results.json
          </div>
        </div>
      </div>

      {/* FVD */}
      <div className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border-l-4 border-orange-500 border border-gray-600">
        <h3 className="text-2xl font-bold text-white mb-4">📐 FVD (비디오 품질 메트릭)</h3>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-orange-900 bg-opacity-30 rounded-lg p-5">
            <h4 className="text-orange-300 font-bold mb-3">📖 정의</h4>
            <p className="text-gray-100 text-sm leading-relaxed">
              Wan2.2가 생성한 비디오의 품질이 실제 비디오처럼 자연스러운지 측정합니다.
            </p>
          </div>
          <div className="bg-orange-900 bg-opacity-30 rounded-lg p-5">
            <h4 className="text-orange-300 font-bold mb-3">🎯 RAPA 기준</h4>
            <div className="text-gray-100 text-sm space-y-1">
              <div>목표: <span className="text-green-300 font-bold">≤ 1140</span></div>
              <div>출처: 사업수행계획서 p.34</div>
            </div>
          </div>
        </div>

        <div className="bg-purple-900 bg-opacity-20 rounded-lg p-5 mb-6">
          <h4 className="text-purple-300 font-bold mb-3">🔬 측정 방법</h4>
          <ol className="list-decimal list-outside text-gray-100 text-sm space-y-2 ml-6">
            <li>Reference dataset 준비 (Kinetics-700 또는 WebVid-10M 약 2,000개)</li>
            <li>학습 완료 후 Wan2.2로 비디오 생성 (2,000개)</li>
            <li>I3D 네트워크로 실제 비디오 특징 추출</li>
            <li>I3D 네트워크로 생성 비디오 특징 추출</li>
            <li>Fréchet Distance 계산</li>
          </ol>
        </div>

        <div className="bg-gray-900 rounded-lg p-4">
          <div className="text-green-400 font-mono text-sm mb-2">예상 명령어 (학습 후)</div>
          <div className="text-green-300 font-mono text-xs overflow-x-auto">
            python scripts/calculate_fvd_generated.py --model_path ./finetuned_model --reference_dir ./kinetics --num_videos 2000 --output fvd_result.json
          </div>
        </div>
      </div>

      {/* 최종 등급 판정 */}
      <div className="bg-gradient-to-r from-green-900 to-emerald-900 rounded-xl p-8 border-2 border-green-500">
        <h3 className="text-2xl font-bold text-white mb-4">📊 RAPA 최종 품질 등급 판정</h3>
        <div className="bg-black bg-opacity-30 rounded-lg p-6">
          <div className="text-green-100 text-base mb-4">
            학습 완료 → CLIP Score & FVD 측정 → 최종 등급 결정
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-green-700">
                <th className="text-left p-3 text-green-200">등급</th>
                <th className="text-left p-3 text-green-200">조건</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-green-800">
                <td className="p-3 text-purple-300 font-bold">A+</td>
                <td className="p-3 text-gray-100">모든 항목 목표 달성 + CLIP ≥0.35 + FVD ≤1000</td>
              </tr>
              <tr className="border-b border-green-800">
                <td className="p-3 text-green-300 font-bold">A</td>
                <td className="p-3 text-gray-100">모든 항목 목표 달성 (CLIP ≥0.3, FVD ≤1140)</td>
              </tr>
              <tr className="border-b border-green-800">
                <td className="p-3 text-blue-300 font-bold">B</td>
                <td className="p-3 text-gray-100">1-2개 항목 미달성 (경미)</td>
              </tr>
              <tr className="border-b border-green-800">
                <td className="p-3 text-yellow-300 font-bold">C</td>
                <td className="p-3 text-gray-100">3개 이상 항목 미달성</td>
              </tr>
              <tr>
                <td className="p-3 text-red-300 font-bold">F</td>
                <td className="p-3 text-gray-100">CLIP &lt;0.3 또는 FVD &gt;1140</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
