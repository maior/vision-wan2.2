'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function QualityAnalysisPage() {
  const [activeTab, setActiveTab] = useState('summary')

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">📊 데이터셋 품질 종합 분석</h1>
        <p className="text-gray-200 text-lg">RAPA 2025 공식 품질지표 기준 평가 리포트</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-800 border-b-2 border-gray-600 -mx-6 px-6 mb-8">
        <div className="flex space-x-2 overflow-x-auto">
            {[
              { id: 'summary', label: '📋 요약', icon: '📋' },
              { id: 'criteria', label: '🏛️ 공식 기준', icon: '🏛️' },
              { id: 'detailed', label: '📊 상세 평가', icon: '📊' },
              { id: 'samples', label: '🔍 샘플 분석', icon: '🔍' },
              { id: 'metrics', label: '📈 메트릭 설명', icon: '📈' },
              { id: 'comprehensive', label: '🎯 문제 유형', icon: '🎯' }
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
      {activeTab === 'criteria' && <CriteriaTab />}
      {activeTab === 'detailed' && <DetailedTab />}
      {activeTab === 'samples' && <SamplesTab />}
      {activeTab === 'metrics' && <MetricsTab />}
      {activeTab === 'comprehensive' && <ComprehensiveTab />}
    </Layout>
  )
}

// Summary Tab - QUALITY_ASSESSMENT_SUMMARY.md
function SummaryTab() {
  return (
    <div className="space-y-8">
      {/* Overall Grade */}
      <div className="bg-gradient-to-r from-red-900 to-red-800 rounded-xl p-8 border-2 border-red-400 shadow-2xl">
        <h2 className="text-3xl font-bold mb-6 text-white">🎯 종합 평가 결과</h2>
        <div className="bg-black bg-opacity-50 rounded-xl p-8 text-center">
          <div className="text-7xl font-bold text-red-300 mb-4">F</div>
          <div className="text-4xl font-bold text-white mb-3">30/100점</div>
          <div className="text-2xl text-red-200 font-semibold mb-2">❌ 재작업 필요</div>
          <div className="text-xl text-red-100 mt-3">🔴 위험도: HIGH (사업 성공 불확실)</div>
        </div>
      </div>

      {/* Quality Characteristics */}
      <div className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border border-gray-600">
        <h2 className="text-3xl font-bold mb-6 text-white">📋 품질 특성별 평가</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b-2 border-gray-600 bg-gray-700 bg-opacity-50">
                <th className="text-left p-4 text-white font-bold">품질 특성</th>
                <th className="text-left p-4 text-white font-bold">목표</th>
                <th className="text-left p-4 text-white font-bold">현재</th>
                <th className="text-left p-4 text-white font-bold">점수</th>
                <th className="text-left p-4 text-white font-bold">등급</th>
                <th className="text-left p-4 text-white font-bold">조치</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: '1. 형식성', target: '99%', current: '미측정', score: '0/100', grade: 'F', action: '즉시 검증 필요', color: 'red' },
                { name: '2. 다양성(통계)', target: '분포 확인', current: '일부 달성', score: '60/100', grade: 'C', action: '개선 필요', color: 'yellow' },
                { name: '3. 다양성(요건)', target: '최소값 충족', current: '일부 달성', score: '50/100', grade: 'D', action: '개선 필요', color: 'orange' },
                { name: '4. 구문 정확성', target: '99.5%', current: '미측정', score: '0/100', grade: 'F', action: '즉시 검증 필요', color: 'red' },
                { name: '5. 의미 정확성', target: '90%', current: '미측정', score: '0/100', grade: 'F', action: '즉시 검증 필요', color: 'red' },
                { name: '6. ⭐ 유효성', target: 'CLIP/FVD', current: '미측정', score: '0/100', grade: 'F', action: '최우선', color: 'red' }
              ].map((item, idx) => (
                <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700 hover:bg-opacity-50 transition">
                  <td className="p-4 font-bold text-white text-base">{item.name}</td>
                  <td className="p-4 text-gray-100">{item.target}</td>
                  <td className={`p-4 font-bold text-base ${item.current.includes('미측정') ? 'text-red-300' : 'text-yellow-300'}`}>
                    {item.current}
                  </td>
                  <td className="p-4 text-gray-100">{item.score}</td>
                  <td className={`p-4 font-bold text-lg ${
                    item.grade === 'F' ? 'text-red-300' :
                    item.grade === 'D' ? 'text-orange-300' :
                    'text-yellow-300'
                  }`}>{item.grade}</td>
                  <td className={`p-4 font-medium ${item.color === 'red' ? 'text-red-200' : 'text-yellow-200'}`}>
                    {item.action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical Issues */}
      <div className="bg-red-900 bg-opacity-40 rounded-xl p-8 border-2 border-red-400 shadow-xl">
        <h2 className="text-3xl font-bold mb-6 text-red-100">🔴 Critical 이슈 (즉시 해결 필수)</h2>
        <div className="space-y-5">
          {[
            {
              title: '1. CLIP Score & FVD 미측정 (최우선)',
              status: '❌ 미측정',
              target: 'CLIP ≥ 0.3, FVD ≤ 1140',
              risk: '사업 성패를 결정하는 핵심 메트릭',
              action: '1주일 내 측정 완료 필수',
              budget: '$800~$1,500'
            },
            {
              title: '2. 해상도 미지원 (77.8%, 155,505개)',
              status: '❌ 1920×1080 → Wan2.2 미지원',
              target: '1280×720으로 변환',
              risk: '전체의 77.8%가 학습 불가',
              action: '1280×720으로 일괄 변환',
              budget: '3일 소요'
            },
            {
              title: '3. 비디오 길이 초과 (14.9%, 29,800개)',
              status: '❌ 25초 이상 14.9%',
              target: '2% 미만',
              risk: '메모리 부족, 학습 효율 저하',
              action: '25초로 트리밍',
              budget: '2일 소요'
            },
            {
              title: '4. 비디오 시간 부족 (추정 650시간 vs 목표 3,600시간)',
              status: '❌ 82% 부족 (2,950시간)',
              target: '3,600시간 이상',
              risk: '사업 요건 미충족',
              action: 'MBC와 추가 데이터 협의 또는 목표 재조정',
              budget: '협의 필요'
            }
          ].map((issue, idx) => (
            <div key={idx} className="bg-gray-800 bg-opacity-70 rounded-lg p-6 border border-gray-600 hover:border-red-400 transition">
              <h3 className="font-bold text-xl text-white mb-4 leading-relaxed">{issue.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                <div><span className="text-gray-300 font-semibold">상태:</span> <span className="text-red-300 font-bold ml-2">{issue.status}</span></div>
                <div><span className="text-gray-300 font-semibold">목표:</span> <span className="text-green-300 font-bold ml-2">{issue.target}</span></div>
                <div><span className="text-gray-300 font-semibold">위험:</span> <span className="text-orange-200 ml-2">{issue.risk}</span></div>
                <div><span className="text-gray-300 font-semibold">조치:</span> <span className="text-blue-200 ml-2">{issue.action}</span></div>
                <div className="col-span-1 md:col-span-2"><span className="text-gray-300 font-semibold">예산/기간:</span> <span className="text-purple-200 font-medium ml-2">{issue.budget}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Improvement Roadmap */}
      <div className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border border-gray-600">
        <h2 className="text-3xl font-bold mb-6 text-white">🎯 우선순위별 개선 로드맵</h2>

        <div className="space-y-6">
          {/* Week 1 */}
          <div className="border-l-4 border-red-400 pl-6 bg-red-900 bg-opacity-20 rounded-r-xl py-4">
            <h3 className="text-2xl font-bold text-red-200 mb-4">🔴 Week 1 (Critical - 즉시 실행)</h3>
            <div className="space-y-4">
              <div className="bg-gray-700 bg-opacity-70 rounded-lg p-5 border border-gray-600">
                <div className="font-bold text-lg text-white mb-2">1. CLIP Score 측정 (3일, GPU 48시간)</div>
                <div className="text-base text-gray-100 mb-3">예산: $200~$400 | 목표: 현재 CLIP Score 파악 | 예상: 0.25~0.30</div>
                <pre className="bg-gray-900 text-green-300 p-4 rounded-lg text-sm overflow-x-auto leading-relaxed border border-gray-700">
{`python scripts/calculate_clip_score_batch.py \\
  --input_csv all_train.csv \\
  --sample_size 5000 \\
  --model ViT-B/32 \\
  --output clip_scores.csv`}
                </pre>
              </div>
              <div className="bg-gray-700 bg-opacity-70 rounded-lg p-5 border border-gray-600">
                <div className="font-bold text-lg text-white mb-2">2. FVD 측정 (4일, GPU 32시간)</div>
                <div className="text-base text-gray-100 mb-3">예산: $300~$600 | 목표: 현재 FVD 파악 | 예상: 800~1500</div>
                <pre className="bg-gray-900 text-green-300 p-4 rounded-lg text-sm overflow-x-auto leading-relaxed border border-gray-700">
{`python scripts/calculate_fvd_batch.py \\
  --dataset_csv all_train.csv \\
  --reference_dir ./kinetics_reference \\
  --sample_size 2000 \\
  --output fvd_score.json`}
                </pre>
              </div>
            </div>
          </div>

          {/* Week 2-3 */}
          <div className="border-l-4 border-orange-400 pl-6 bg-orange-900 bg-opacity-20 rounded-r-xl py-4">
            <h3 className="text-2xl font-bold text-orange-200 mb-4">🟠 Week 2-3 (High Priority)</h3>
            <div className="space-y-4">
              <div className="bg-gray-700 bg-opacity-70 rounded-lg p-5 border border-gray-600">
                <div className="font-bold text-lg text-white mb-2">3. 해상도 일괄 변환 (3일)</div>
                <div className="text-base text-gray-100 mb-3">영향: 77.8% (155,505개) 해결 | 예산: 스토리지 200GB ($10)</div>
                <pre className="bg-gray-900 text-green-300 p-4 rounded-lg text-sm overflow-x-auto leading-relaxed border border-gray-700">
{`python scripts/batch_resize.py \\
  --input_csv all_train.csv \\
  --target_resolution 1280 720 \\
  --output_dir ./resized \\
  --workers 16`}
                </pre>
              </div>
              <div className="bg-gray-700 bg-opacity-70 rounded-lg p-5 border border-gray-600">
                <div className="font-bold text-lg text-white mb-2">4. 비디오 트리밍 (2일)</div>
                <div className="text-base text-gray-100 mb-3">영향: 14.9% (29,800개) → 2% 미만 | 예산: GPU 16시간 ($80)</div>
                <pre className="bg-gray-900 text-green-300 p-4 rounded-lg text-sm overflow-x-auto leading-relaxed border border-gray-700">
{`python scripts/batch_trim_videos.py \\
  --input_csv all_train.csv \\
  --max_duration 25.0 \\
  --output_dir ./trimmed`}
                </pre>
              </div>
              <div className="bg-gray-700 bg-opacity-70 rounded-lg p-5 border border-gray-600">
                <div className="font-bold text-lg text-white mb-2">5. 캡션 개선 (5일)</div>
                <div className="text-base text-gray-100 mb-3">영향: CLIP Score +0.05~0.08 예상 | 예산: 인력 비용</div>
                <pre className="bg-gray-900 text-green-300 p-4 rounded-lg text-sm overflow-x-auto leading-relaxed border border-gray-700">
{`python scripts/batch_improve_captions.py \\
  --input_csv all_train.csv \\
  --fix_duplicates \\
  --fix_media_type \\
  --make_concrete \\
  --output_csv all_train_improved.csv`}
                </pre>
              </div>
            </div>
          </div>

          {/* Week 4-8 */}
          <div className="border-l-4 border-yellow-400 pl-6 bg-yellow-900 bg-opacity-20 rounded-r-xl py-4">
            <h3 className="text-2xl font-bold text-yellow-200 mb-4">🟡 Week 4-8 (Medium Priority)</h3>
            <ul className="list-disc list-inside space-y-3 text-gray-100 text-base ml-4">
              <li>6. JSON 스키마 검증 (1주)</li>
              <li>7. 파일 유효성 전수 검사 (1주)</li>
              <li>8. 의미 정확성 수동 검증 (2주)</li>
              <li>9. 비디오 시간 확보 협의 (협의)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Budget */}
      <div className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border border-gray-600">
        <h2 className="text-3xl font-bold mb-6 text-white">💰 총 소요 비용</h2>
        <table className="w-full text-base">
          <thead>
            <tr className="border-b-2 border-gray-600 bg-gray-700 bg-opacity-50">
              <th className="text-left p-4 text-white font-bold">항목</th>
              <th className="text-left p-4 text-white font-bold">비용</th>
              <th className="text-left p-4 text-white font-bold">기간</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-700 hover:bg-gray-700 hover:bg-opacity-30">
              <td className="p-4 text-gray-100">GPU (V100 × 2, 96시간)</td>
              <td className="p-4 text-green-300 font-bold">$800~$1,500</td>
              <td className="p-4 text-gray-100">1~2주</td>
            </tr>
            <tr className="border-b border-gray-700 hover:bg-gray-700 hover:bg-opacity-30">
              <td className="p-4 text-gray-100">스토리지 (200GB)</td>
              <td className="p-4 text-green-300 font-bold">$50</td>
              <td className="p-4 text-gray-100">즉시</td>
            </tr>
            <tr className="border-b border-gray-700 hover:bg-gray-700 hover:bg-opacity-30">
              <td className="p-4 text-gray-100">인력 (검토자 2명)</td>
              <td className="p-4 text-green-300 font-bold">$2,000~$4,000</td>
              <td className="p-4 text-gray-100">2주</td>
            </tr>
            <tr className="border-t-2 border-purple-400 bg-purple-900 bg-opacity-20">
              <td className="p-4 font-bold text-white text-lg">총계</td>
              <td className="p-4 font-bold text-purple-300 text-lg">$3,000~$6,000</td>
              <td className="p-4 font-bold text-white text-lg">2~3개월</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Expected Improvement */}
      <div className="bg-gradient-to-r from-green-900 to-blue-900 rounded-xl p-8 border-2 border-green-600 shadow-xl">
        <h2 className="text-3xl font-bold mb-6 text-white">📈 예상 개선 효과</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b-2 border-gray-600 bg-black bg-opacity-30">
                <th className="text-left p-4 text-white font-bold">항목</th>
                <th className="text-left p-4 text-white font-bold">Before</th>
                <th className="text-left p-4 text-white font-bold">After</th>
                <th className="text-left p-4 text-white font-bold">개선</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-700 hover:bg-black hover:bg-opacity-20">
                <td className="p-4 text-gray-100 font-medium">해상도 미지원</td>
                <td className="p-4 text-red-300 font-bold">77.8%</td>
                <td className="p-4 text-green-300 font-bold">0%</td>
                <td className="p-4 text-green-300 font-semibold">✅ 100% 해결</td>
              </tr>
              <tr className="border-b border-gray-700 hover:bg-black hover:bg-opacity-20">
                <td className="p-4 text-gray-100 font-medium">25초 초과 비디오</td>
                <td className="p-4 text-red-300 font-bold">14.9%</td>
                <td className="p-4 text-green-300 font-bold">1.5%</td>
                <td className="p-4 text-green-300 font-semibold">✅ 90% 개선</td>
              </tr>
              <tr className="border-b border-gray-700 hover:bg-black hover:bg-opacity-20">
                <td className="p-4 text-gray-100 font-medium">키워드 누락</td>
                <td className="p-4 text-red-300 font-bold">65.2%</td>
                <td className="p-4 text-green-300 font-bold">0%</td>
                <td className="p-4 text-green-300 font-semibold">✅ 100% 해결</td>
              </tr>
              <tr className="border-b border-gray-700 hover:bg-black hover:bg-opacity-20">
                <td className="p-4 text-gray-100 font-medium">캡션 오류</td>
                <td className="p-4 text-red-300 font-bold">~10%</td>
                <td className="p-4 text-green-300 font-bold">&lt;1%</td>
                <td className="p-4 text-green-300 font-semibold">✅ 90% 개선</td>
              </tr>
              <tr className="border-b border-gray-700 hover:bg-black hover:bg-opacity-20">
                <td className="p-4 text-white font-bold">CLIP Score</td>
                <td className="p-4 text-yellow-300 font-bold">?</td>
                <td className="p-4 text-blue-300 font-bold">0.30~0.32</td>
                <td className="p-4 text-yellow-300 font-semibold">⚠️ 경계선</td>
              </tr>
              <tr className="border-b border-gray-700 hover:bg-black hover:bg-opacity-20">
                <td className="p-4 text-white font-bold">FVD</td>
                <td className="p-4 text-yellow-300 font-bold">?</td>
                <td className="p-4 text-blue-300 font-bold">1000~1400</td>
                <td className="p-4 text-yellow-300 font-semibold">⚠️ 불확실</td>
              </tr>
              <tr className="border-t-2 border-purple-400 bg-purple-900 bg-opacity-30">
                <td className="p-4 text-white font-bold text-lg">종합 점수</td>
                <td className="p-4 text-red-300 font-bold text-lg">30점 (F)</td>
                <td className="p-4 text-green-300 font-bold text-lg">75점 (C)</td>
                <td className="p-4 text-green-300 font-bold text-lg">⬆️ +45점</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Criteria Tab - OFFICIAL_QUALITY_CRITERIA.md
function CriteriaTab() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-8 border-2 border-blue-500">
        <h2 className="text-3xl font-bold mb-4 text-white">🏛️ 공식 품질지표 기준서 (RAPA 2025)</h2>
        <div className="text-gray-100 text-base space-y-2">
          <div><strong className="text-white">사업명:</strong> 한국전파진흥협회(RAPA) 「2025년 방송영상 AI 학습용 데이터 구축」</div>
          <div><strong className="text-white">데이터명:</strong> 방송영상 AI 학습용 비디오 캡셔닝 데이터셋</div>
          <div><strong className="text-white">모델 임무:</strong> Text-to-Video Generation</div>
          <div><strong className="text-white">주관기관:</strong> MBC충북 | <strong className="text-white">수행기업:</strong> 도스트11 | <strong className="text-white">품질검증:</strong> 염규현</div>
        </div>
      </div>

      {/* 6 Quality Characteristics */}
      <div className="space-y-4">
        {/* 1. Formality */}
        <div className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border-l-4 border-blue-500 border border-gray-600">
          <h3 className="text-2xl font-bold mb-5 text-white">1. 형식성 (Formality)</h3>
          <table className="w-full text-base">
            <thead>
              <tr className="border-b-2 border-gray-600 bg-gray-700 bg-opacity-50">
                <th className="text-left p-3 text-white font-bold">항목명</th>
                <th className="text-left p-3 text-white font-bold">측정 지표</th>
                <th className="text-left p-3 text-white font-bold">정량 목표</th>
                <th className="text-left p-3 text-white font-bold">근거</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-700 hover:bg-gray-700 hover:bg-opacity-30">
                <td className="p-3 text-gray-100">파일 유효성</td>
                <td className="p-3 text-blue-300">정확도</td>
                <td className="p-3 text-green-300 font-bold">99% 이상</td>
                <td className="p-3 text-gray-100 text-sm">NIA AI 데이터 품질관리 가이드라인 v3.5</td>
              </tr>
              <tr className="border-b border-gray-700 hover:bg-gray-700 hover:bg-opacity-30">
                <td className="p-3 text-gray-100">파일 포맷 적합성</td>
                <td className="p-3 text-blue-300">정확도</td>
                <td className="p-3 text-green-300 font-bold">99% 이상</td>
                <td className="p-3 text-gray-100 text-sm">NIA AI 데이터 품질관리 가이드라인 v3.5</td>
              </tr>
              <tr>
                <td className="p-3 text-gray-100">파일 속성 적합성</td>
                <td className="p-3 text-blue-300">정확도</td>
                <td className="p-3 text-green-300 font-bold">99% 이상</td>
                <td className="p-3 text-gray-100 text-sm">NIA AI 데이터 품질관리 가이드라인 v3.5</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-4 text-base text-gray-100">
            <strong className="text-white">평가 내용:</strong> 파일 손상 여부, mp4/json 포맷 준수, 해상도/프레임레이트 메타데이터 정확성
          </div>
        </div>

        {/* 2. Diversity (Statistical) */}
        <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border-l-4 border-green-500">
          <h3 className="text-xl font-bold mb-3">2. 다양성(통계) (Diversity - Statistical)</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-2">항목명</th>
                <th className="text-left p-2">측정 지표</th>
                <th className="text-left p-2">정량 목표</th>
                <th className="text-left p-2">근거</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-700">
                <td className="p-2">장르별 분포</td>
                <td className="p-2 text-blue-400">구성비</td>
                <td className="p-2 text-green-400 font-bold">분포 확인</td>
                <td className="p-2 text-gray-400 text-xs">사업수행계획서 p.43</td>
              </tr>
              <tr className="border-b border-gray-700">
                <td className="p-2">비디오 영상 길이 분포</td>
                <td className="p-2 text-blue-400">구성비</td>
                <td className="p-2 text-green-400 font-bold">평균 20초, 25초 이상 2% 미만</td>
                <td className="p-2 text-gray-400 text-xs">사업수행계획서 p.113</td>
              </tr>
              <tr>
                <td className="p-2">카테고리별 분포</td>
                <td className="p-2 text-blue-400">구성비</td>
                <td className="p-2 text-green-400 font-bold">분포 확인</td>
                <td className="p-2 text-gray-400 text-xs">사업수행계획서 p.43</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-3 text-sm text-gray-300">
            <strong>평가 내용:</strong> 장르 균형(예능/드라마/뉴스/다큐), 비디오 15~25초 권장, 8개 중분류 균형
          </div>
        </div>

        {/* 3. Diversity (Requirements) */}
        <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border-l-4 border-yellow-500">
          <h3 className="text-xl font-bold mb-3">3. 다양성(요건) (Diversity - Requirements)</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-2">항목명</th>
                <th className="text-left p-2">측정 지표</th>
                <th className="text-left p-2">정량 목표</th>
                <th className="text-left p-2">근거</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-700">
                <td className="p-2">비디오 데이터 시간</td>
                <td className="p-2 text-blue-400">최소 시간</td>
                <td className="p-2 text-green-400 font-bold">3,600시간 이상</td>
                <td className="p-2 text-gray-400 text-xs">사업수행계획서 p.21, 24</td>
              </tr>
              <tr className="border-b border-gray-700">
                <td className="p-2">비디오 영상 평균 길이</td>
                <td className="p-2 text-blue-400">최소 시간</td>
                <td className="p-2 text-green-400 font-bold">20초 이상</td>
                <td className="p-2 text-gray-400 text-xs">사업공모안내서 p.5</td>
              </tr>
              <tr className="border-b border-gray-700">
                <td className="p-2">가공데이터 설명문 최소 토큰 수</td>
                <td className="p-2 text-blue-400">최소 수량</td>
                <td className="p-2 text-green-400 font-bold">50토큰 이상</td>
                <td className="p-2 text-gray-400 text-xs">사업공모안내서 p.6</td>
              </tr>
              <tr>
                <td className="p-2">가공데이터 설명문 최소 문장 수</td>
                <td className="p-2 text-blue-400">최소 수량</td>
                <td className="p-2 text-green-400 font-bold">5문장 이상</td>
                <td className="p-2 text-gray-400 text-xs">사업수행계획서 p.43</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-3 text-sm text-gray-300">
            <strong>평가 내용:</strong> 전체 데이터셋 3,600시간, 평균 20초 이상, 캡션 50토큰·5문장 이상
          </div>
        </div>

        {/* 4. Syntactic Accuracy */}
        <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border-l-4 border-purple-500">
          <h3 className="text-xl font-bold mb-3">4. 구문 정확성 (Syntactic Accuracy)</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-2">항목명</th>
                <th className="text-left p-2">측정 지표</th>
                <th className="text-left p-2">정량 목표</th>
                <th className="text-left p-2">근거</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-700">
                <td className="p-2">구조 정확성</td>
                <td className="p-2 text-blue-400">정확도</td>
                <td className="p-2 text-green-400 font-bold">99.5% 이상</td>
                <td className="p-2 text-gray-400 text-xs">TTA 권고</td>
              </tr>
              <tr>
                <td className="p-2">형식 정확성</td>
                <td className="p-2 text-blue-400">정확도</td>
                <td className="p-2 text-green-400 font-bold">99.5% 이상</td>
                <td className="p-2 text-gray-400 text-xs">TTA 권고</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-3 text-sm text-gray-300">
            <strong>평가 내용:</strong> JSON 스키마 준수, 필수 필드 존재, 타임코드/날짜/ID 형식 정확성
          </div>
        </div>

        {/* 5. Semantic Accuracy */}
        <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border-l-4 border-pink-500">
          <h3 className="text-xl font-bold mb-3">5. 의미 정확성 (Semantic Accuracy)</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-2">항목명</th>
                <th className="text-left p-2">측정 지표</th>
                <th className="text-left p-2">정량 목표</th>
                <th className="text-left p-2">근거</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-700">
                <td className="p-2">표현 적절성</td>
                <td className="p-2 text-blue-400">정확도</td>
                <td className="p-2 text-green-400 font-bold">90% 이상</td>
                <td className="p-2 text-gray-400 text-xs">사업수행계획서 p.186</td>
              </tr>
              <tr>
                <td className="p-2">영상-설명문 일치성</td>
                <td className="p-2 text-blue-400">정확도</td>
                <td className="p-2 text-green-400 font-bold">90% 이상</td>
                <td className="p-2 text-gray-400 text-xs">사업수행계획서 p.186</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-3 text-sm text-gray-300">
            <strong>평가 내용:</strong> 캡션이 영상 내용을 적절히 표현하는지, 캡션과 실제 영상 내용 일치 여부
          </div>
        </div>

        {/* 6. Validity - MOST IMPORTANT */}
        <div className="bg-gradient-to-r from-red-900 to-orange-900 rounded-lg p-6 border-4 border-red-500">
          <h3 className="text-2xl font-bold mb-3">⭐ 6. 유효성 (Validity) - 핵심 메트릭</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-2">항목명</th>
                <th className="text-left p-2">측정 지표</th>
                <th className="text-left p-2">정량 목표</th>
                <th className="text-left p-2">근거</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-700">
                <td className="p-2 font-bold">영상 생성 적정성</td>
                <td className="p-2 text-orange-400 font-bold">FVD</td>
                <td className="p-2 text-green-400 font-bold text-lg">≤ 1140</td>
                <td className="p-2 text-gray-400 text-xs">사업수행계획서 p.34</td>
              </tr>
              <tr>
                <td className="p-2 font-bold">텍스트-영상 정렬</td>
                <td className="p-2 text-blue-400 font-bold">CLIP Score</td>
                <td className="p-2 text-green-400 font-bold text-lg">≥ 0.3</td>
                <td className="p-2 text-gray-400 text-xs">사업수행계획서 p.34</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-4 space-y-3">
            <div className="bg-black bg-opacity-40 rounded p-3">
              <div className="font-bold text-orange-400 mb-1">📐 FVD (Fréchet Video Distance)</div>
              <div className="text-sm text-gray-300">
                생성/데이터셋 비디오의 품질이 실사 수준인지 측정. 낮을수록 우수 (≤1140 목표). I3D 특징 추출 후 Fréchet Distance 계산.
              </div>
            </div>
            <div className="bg-black bg-opacity-40 rounded p-3">
              <div className="font-bold text-blue-400 mb-1">🎯 CLIP Score</div>
              <div className="text-sm text-gray-300">
                텍스트 캡션과 비디오 프레임 간 의미적 일치도 측정. 높을수록 우수 (≥0.3 목표). OpenAI CLIP 모델로 코사인 유사도 계산.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Grades */}
      <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">📈 품질 등급 기준</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left p-3">등급</th>
              <th className="text-left p-3">조건</th>
              <th className="text-left p-3">판정</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-700 bg-purple-900 bg-opacity-30">
              <td className="p-3 font-bold text-purple-400">A+</td>
              <td className="p-3">모든 항목 목표 달성 + CLIP ≥0.35 + FVD ≤1000</td>
              <td className="p-3 text-purple-300">우수</td>
            </tr>
            <tr className="border-b border-gray-700 bg-green-900 bg-opacity-30">
              <td className="p-3 font-bold text-green-400">A</td>
              <td className="p-3">모든 항목 목표 달성</td>
              <td className="p-3 text-green-300">양호</td>
            </tr>
            <tr className="border-b border-gray-700 bg-blue-900 bg-opacity-30">
              <td className="p-3 font-bold text-blue-400">B</td>
              <td className="p-3">1-2개 항목 목표 미달성 (경미)</td>
              <td className="p-3 text-blue-300">보완 필요</td>
            </tr>
            <tr className="border-b border-gray-700 bg-yellow-900 bg-opacity-30">
              <td className="p-3 font-bold text-yellow-400">C</td>
              <td className="p-3">3개 이상 항목 목표 미달성</td>
              <td className="p-3 text-yellow-300">상당한 개선 필요</td>
            </tr>
            <tr className="bg-red-900 bg-opacity-30">
              <td className="p-3 font-bold text-red-400">F</td>
              <td className="p-3">CLIP &lt;0.3 또는 FVD &gt;1140</td>
              <td className="p-3 text-red-300">재작업 필요</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Detailed Tab - Placeholder for QUALITY_ASSESSMENT_REPORT.md
function DetailedTab() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/quality-report')
      .then(res => res.json())
      .then(data => {
        setContent(data.content)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">리포트를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900 bg-opacity-30 rounded-lg p-6 border border-red-500">
        <h2 className="text-2xl font-bold mb-4 text-red-300">오류 발생</h2>
        <p className="text-red-200">리포트를 불러올 수 없습니다: {error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-none">
      <div className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border border-gray-600">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({node, ...props}) => <h1 className="text-4xl font-bold text-white mb-6 mt-8 border-b-2 border-purple-500 pb-4" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-3xl font-bold text-white mb-5 mt-8" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-2xl font-bold text-blue-300 mb-4 mt-6" {...props} />,
            h4: ({node, ...props}) => <h4 className="text-xl font-bold text-green-300 mb-3 mt-5" {...props} />,
            p: ({node, ...props}) => <p className="text-gray-100 text-lg leading-relaxed mb-4" {...props} />,
            strong: ({node, ...props}) => <strong className="text-white font-bold" {...props} />,
            em: ({node, ...props}) => <em className="text-blue-300" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc list-outside text-gray-100 mb-4 space-y-2 ml-6" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal list-outside text-gray-100 mb-4 space-y-2 ml-6" {...props} />,
            li: ({node, ...props}) => <li className="text-gray-100 text-lg leading-relaxed" {...props} />,
            code: ({node, inline, ...props}: any) =>
              inline
                ? <code className="bg-purple-900 bg-opacity-50 text-purple-200 px-2 py-1 rounded font-mono text-base" {...props} />
                : <code className="block bg-gray-900 text-green-300 p-6 rounded-lg overflow-x-auto font-mono text-base leading-relaxed my-4 border border-gray-700" {...props} />,
            pre: ({node, ...props}) => <pre className="bg-gray-900 p-0 rounded-xl overflow-x-auto my-6 border border-gray-700" {...props} />,
            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-200 my-4 bg-blue-900 bg-opacity-20 py-2 rounded-r" {...props} />,
            table: ({node, ...props}) => (
              <div className="overflow-x-auto my-6">
                <table className="w-full text-base border-collapse border border-gray-600" {...props} />
              </div>
            ),
            thead: ({node, ...props}) => <thead className="bg-gray-700" {...props} />,
            tbody: ({node, ...props}) => <tbody className="bg-gray-800 bg-opacity-50" {...props} />,
            tr: ({node, ...props}) => <tr className="border-b border-gray-600 hover:bg-gray-700 hover:bg-opacity-50 transition" {...props} />,
            th: ({node, ...props}) => <th className="text-left p-4 text-white font-bold border-b-2 border-gray-500 text-base" {...props} />,
            td: ({node, ...props}) => <td className="p-4 text-gray-100 text-base" {...props} />,
            a: ({node, ...props}) => <a className="text-blue-400 hover:text-blue-300 underline font-medium" {...props} />,
            hr: ({node, ...props}) => <hr className="border-gray-600 my-8" {...props} />,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}

// Samples Tab - SAMPLE_QUALITY_IMPROVEMENT_GUIDE.md
function SamplesTab() {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-xl p-8 border-2 border-purple-500">
        <h2 className="text-3xl font-bold mb-3 text-white">🔍 실전 샘플 분석 및 개선 가이드</h2>
        <p className="text-gray-100 text-lg">실제 JSON 데이터 분석을 통한 Before/After 비교</p>
      </div>

      {/* Sample 1: Video */}
      <div className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border-l-4 border-red-500 border border-gray-600">
        <h3 className="text-2xl font-bold mb-5 text-white">📹 샘플 #1: 비디오 (Clip ID: 2115307)</h3>

        <div className="mb-6">
          <h4 className="font-bold text-xl text-red-300 mb-3">❌ 문제점:</h4>
          <ul className="list-disc list-outside space-y-2 text-base text-gray-100 ml-6">
            <li>길이: 26.06초 (목표: 25초 이하)</li>
            <li>해상도: 720×486 (Wan2.2 미지원)</li>
            <li>캡션: "이미지입니다" ← 비디오인데 이미지라고 표현</li>
            <li>캡션 중복: 첫 문장 2번 반복</li>
            <li>토큰 수 부족: 16토큰 (목표: 50토큰 이상)</li>
          </ul>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-red-900 bg-opacity-30 rounded-lg p-5 border border-red-700">
            <h4 className="font-bold text-lg text-red-200 mb-3">Before:</h4>
            <pre className="text-sm bg-gray-900 text-green-300 p-4 rounded-lg overflow-x-auto border border-gray-700">
{`{
  "resolution": "720, 486",
  "length": "00:00:26.06",
  "scene_description_auto": [{
    "description": "짝짓기하는 수서곤충의 모습을
                   클로즈업으로 촬영한 이미지입니다."
  }],
  "caption_info": {
    "object_level": [
      {
        "text": "붉은색 줄무늬가 있는
                벌레의 몸체가 틈새에 끼어 있다.",
        "token": 9
      },
      {
        "text": "물방울이 물 표면에 떨어져
                파문을 일으킨다.",
        "token": 7
      }
    ]
  }
}`}
            </pre>
          </div>

          <div className="bg-green-900 bg-opacity-30 rounded-lg p-5 border border-green-700">
            <h4 className="font-bold text-lg text-green-200 mb-3">After:</h4>
            <pre className="text-sm bg-gray-900 text-green-300 p-4 rounded-lg overflow-x-auto border border-gray-700">
{`{
  "resolution": "1280, 720",
  "length": "00:00:25.00",
  "scene_description_auto": [{
    "description": "수서곤충들이 물 위에서 짝짓기하는
                   장면을 클로즈업으로 촬영한 영상입니다."
  }],
  "caption_info": {
    "object_level": [
      {
        "text": "붉은색과 검은색 줄무늬가 있는
                소금쟁이 같은 수서곤충의 몸체가
                물 위 틈새에 끼어 있으며,
                다리가 물 표면에 닿아 있다.",
        "token": 22
      },
      {
        "text": "물방울이 맑은 물 표면에 떨어져
                동심원 모양의 파문을 일으키고,
                수면 아래로 기포가 생성된다.",
        "token": 18
      }
    ]
  }
}`}
            </pre>
          </div>
        </div>

        <div className="bg-green-900 bg-opacity-30 rounded-lg p-6 border border-green-700">
          <h4 className="font-bold text-xl text-green-200 mb-4">✅ 개선 효과:</h4>
          <div className="grid md:grid-cols-2 gap-4 text-base">
            <div>
              <div className="text-gray-200 font-semibold">길이:</div>
              <div className="text-white">26.06초 → 25.00초 (트리밍)</div>
            </div>
            <div>
              <div className="text-gray-400">해상도:</div>
              <div className="text-white">720×486 → 1280×720 (리사이징)</div>
            </div>
            <div>
              <div className="text-gray-400">미디어 타입 오류:</div>
              <div className="text-white">"이미지" → "영상" 수정</div>
            </div>
            <div>
              <div className="text-gray-400">토큰 수:</div>
              <div className="text-white">16토큰 → 40토큰 (+150%)</div>
            </div>
            <div>
              <div className="text-gray-400">예상 CLIP Score:</div>
              <div className="text-green-400 font-bold">0.20 → 0.35 (+75%)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sample 2: Image */}
      <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border-l-4 border-yellow-500">
        <h3 className="text-xl font-bold mb-3">🖼️ 샘플 #2: 이미지 (Clip ID: 2392760)</h3>

        <div className="mb-4">
          <h4 className="font-semibold text-red-400 mb-2">❌ 문제점:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
            <li>해상도: 1920×1080 (Wan2.2 미지원, 전체의 77.8%)</li>
            <li>키워드: null (누락)</li>
            <li>추상적 표현 과다: "평온한 분위기", "자연스러운 조화"</li>
            <li>OCR 텍스트 미활용: 자막이 추출되었으나 캡션에 미반영</li>
          </ul>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-red-900 bg-opacity-30 rounded-lg p-5 border border-red-700">
            <h4 className="font-bold text-lg text-red-200 mb-3">Before:</h4>
            <pre className="text-sm bg-gray-900 text-green-300 p-4 rounded-lg overflow-x-auto border border-gray-700">
{`{
  "resolution": "1920, 1080",
  "keyword": null,
  "ocr": [
    "\"학업성취도 평가 거부 교사 징계 적법\"",
    "섬지역 수협 수산물"
  ],
  "caption_info": {
    "semantic_level": [{
      "text": "바다 위에 떠 있는 여객선이
              평온한 분위기를 자아낸다.",
      "token": 9
    }]
  }
}`}
            </pre>
          </div>

          <div className="bg-green-900 bg-opacity-30 rounded-lg p-5 border border-green-700">
            <h4 className="font-bold text-lg text-green-200 mb-3">After:</h4>
            <pre className="text-sm bg-gray-900 text-green-300 p-4 rounded-lg overflow-x-auto border border-gray-700">
{`{
  "resolution": "1280, 720",
  "keyword": "페리, 선박, 해양교통, 정박,
            항구, 바다, 여객선, 해운",
  "ocr": [
    "\"학업성취도 평가 거부 교사 징계 적법\"",
    "섬지역 수협 수산물"
  ],
  "caption_info": {
    "semantic_level": [{
      "text": "흰색과 파란색으로 칠해진
              중형 여객선이 잔잔한 청록색 바다 위에
              정박해 있으며, 선체에는 한글 자막과
              회사명이 표시되어 있다.
              배경에는 구름 낀 하늘이 보인다.",
      "token": 35
    }]
  }
}`}
            </pre>
          </div>
        </div>

        <div className="bg-green-900 bg-opacity-30 rounded-lg p-6 border border-green-700">
          <h4 className="font-bold text-xl text-green-200 mb-4">✅ 개선 효과:</h4>
          <div className="grid md:grid-cols-2 gap-4 text-base">
            <div>
              <div className="text-gray-200 font-semibold">해상도:</div>
              <div className="text-white">1920×1080 → 1280×720 (리사이징)</div>
            </div>
            <div>
              <div className="text-gray-400">키워드:</div>
              <div className="text-white">null → 8개 생성</div>
            </div>
            <div>
              <div className="text-gray-400">표현 방식:</div>
              <div className="text-white">추상적 → 구체적 (색상, 크기, 위치 명시)</div>
            </div>
            <div>
              <div className="text-gray-400">토큰 수:</div>
              <div className="text-white">9토큰 → 35토큰 (+289%)</div>
            </div>
            <div>
              <div className="text-gray-400">예상 CLIP Score:</div>
              <div className="text-green-400 font-bold">0.28 → 0.34 (+21%)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Improvement Scripts */}
      <div className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border border-gray-600">
        <h2 className="text-2xl font-bold mb-6 text-white">🛠️ 개선 스크립트</h2>
        <div className="space-y-5">
          <div className="bg-gray-700 bg-opacity-70 rounded-lg p-5 border border-gray-600">
            <div className="font-bold text-lg text-white mb-3">1. 해상도 변환</div>
            <pre className="text-sm bg-gray-900 text-green-300 p-4 rounded-lg overflow-x-auto border border-gray-700">
{`python scripts/batch_resize.py --input_csv all_train.csv --target 1280 720`}
            </pre>
          </div>
          <div className="bg-gray-700 bg-opacity-70 rounded-lg p-5 border border-gray-600">
            <div className="font-bold text-lg text-white mb-3">2. 비디오 트리밍</div>
            <pre className="text-sm bg-gray-900 text-green-300 p-4 rounded-lg overflow-x-auto border border-gray-700">
{`python scripts/batch_trim_videos.py --input_csv all_train.csv --max_duration 25.0`}
            </pre>
          </div>
          <div className="bg-gray-700 bg-opacity-70 rounded-lg p-5 border border-gray-600">
            <div className="font-bold text-lg text-white mb-3">3. 캡션 개선</div>
            <pre className="text-sm bg-gray-900 text-green-300 p-4 rounded-lg overflow-x-auto border border-gray-700">
{`python scripts/batch_improve_captions.py --input_csv all_train.csv --fix_all`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

// Metrics Tab - QUALITY_METRICS_EXPLAINED.md
function MetricsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900 to-cyan-900 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">📈 CLIP Score & FVD 메트릭 상세 설명</h2>
        <p className="text-gray-300">Text-to-Video 생성 모델의 핵심 평가 지표</p>
      </div>

      {/* CLIP Score */}
      <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border-l-4 border-blue-500">
        <h3 className="text-2xl font-bold mb-4">🎯 CLIP Score (텍스트-영상 정렬도)</h3>

        <div className="space-y-4">
          <div className="bg-blue-900 bg-opacity-20 rounded p-4">
            <h4 className="font-semibold mb-2">📖 정의</h4>
            <p className="text-sm text-gray-300">
              CLIP (Contrastive Language-Image Pre-training) Score는 OpenAI의 CLIP 모델을 사용하여
              텍스트 캡션과 이미지/비디오 간의 의미적 일치도를 측정하는 메트릭입니다.
            </p>
          </div>

          <div className="bg-gray-700 bg-opacity-70 rounded-lg p-5 border border-gray-600">
            <h4 className="font-bold text-lg text-white mb-3">🔢 수식</h4>
            <pre className="text-base bg-gray-900 text-green-300 p-4 rounded-lg overflow-x-auto border border-gray-700">
{`CLIP Score = cos_sim(CLIP_text(caption), CLIP_image(frame))

범위: -1 ~ 1 (일반적으로 0 ~ 1 사이)
목표: ≥ 0.3 (RAPA 2025 기준)`}
            </pre>
          </div>

          <div className="bg-gray-700 bg-opacity-50 rounded p-4">
            <h4 className="font-semibold mb-2">📊 점수 해석</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-green-900 bg-opacity-30 rounded">
                <span>0.35 이상</span>
                <span className="text-green-400 font-bold">우수 - 캡션과 영상이 매우 잘 일치</span>
              </div>
              <div className="flex justify-between p-2 bg-blue-900 bg-opacity-30 rounded">
                <span>0.30 ~ 0.35</span>
                <span className="text-blue-400 font-bold">양호 - 목표치 달성</span>
              </div>
              <div className="flex justify-between p-2 bg-yellow-900 bg-opacity-30 rounded">
                <span>0.25 ~ 0.30</span>
                <span className="text-yellow-400 font-bold">경계선 - 개선 필요</span>
              </div>
              <div className="flex justify-between p-2 bg-red-900 bg-opacity-30 rounded">
                <span>0.25 미만</span>
                <span className="text-red-400 font-bold">불량 - 재작업 필요</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-700 bg-opacity-70 rounded-lg p-5 border border-gray-600">
            <h4 className="font-bold text-lg text-white mb-3">💡 측정 방법</h4>
            <ol className="list-decimal list-outside space-y-2 text-base text-gray-100 ml-6">
              <li>비디오에서 균등하게 N개 프레임 샘플링 (예: 8프레임)</li>
              <li>각 프레임을 CLIP 이미지 인코더로 임베딩</li>
              <li>캡션을 CLIP 텍스트 인코더로 임베딩</li>
              <li>코사인 유사도 계산 후 평균</li>
            </ol>
            <pre className="text-sm bg-gray-900 text-green-300 p-4 rounded-lg mt-4 overflow-x-auto border border-gray-700">
{`from PIL import Image
import clip
import torch

model, preprocess = clip.load("ViT-B/32")
image = preprocess(Image.open("frame.jpg")).unsqueeze(0)
text = clip.tokenize(["A caption describing the video"])

with torch.no_grad():
    image_features = model.encode_image(image)
    text_features = model.encode_text(text)

    clip_score = torch.cosine_similarity(
        image_features, text_features
    ).item()

print(f"CLIP Score: {clip_score:.4f}")`}
            </pre>
          </div>

          <div className="bg-orange-900 bg-opacity-20 rounded p-4 border border-orange-500">
            <h4 className="font-semibold mb-2 text-orange-400">⚠️ 현재 상태</h4>
            <div className="text-sm text-gray-300 space-y-1">
              <div><strong>측정 여부:</strong> <span className="text-red-400">미측정</span></div>
              <div><strong>예상 범위:</strong> 0.25 ~ 0.32</div>
              <div><strong>우선순위:</strong> <span className="text-red-400 font-bold">최우선 (Week 1)</span></div>
              <div><strong>소요 시간:</strong> 3일 (GPU 48시간)</div>
              <div><strong>예산:</strong> $200~$400</div>
            </div>
          </div>
        </div>
      </div>

      {/* FVD */}
      <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border-l-4 border-orange-500">
        <h3 className="text-2xl font-bold mb-4">📐 FVD (비디오 품질 메트릭)</h3>

        <div className="space-y-4">
          <div className="bg-orange-900 bg-opacity-20 rounded p-4">
            <h4 className="font-semibold mb-2">📖 정의</h4>
            <p className="text-sm text-gray-300">
              FVD (Fréchet Video Distance)는 생성된 비디오의 품질을 실제 비디오와 비교하여 측정하는 메트릭입니다.
              Inception-3D (I3D) 네트워크로 추출한 특징 벡터의 분포 거리를 계산합니다.
            </p>
          </div>

          <div className="bg-gray-700 bg-opacity-70 rounded-lg p-5 border border-gray-600">
            <h4 className="font-bold text-lg text-white mb-3">🔢 수식</h4>
            <pre className="text-base bg-gray-900 text-green-300 p-4 rounded-lg overflow-x-auto border border-gray-700">
{`FVD = ||μ_real - μ_gen||² +
      Tr(Σ_real + Σ_gen - 2(Σ_real · Σ_gen)^(1/2))

범위: 0 ~ ∞ (낮을수록 좋음)
목표: ≤ 1140 (RAPA 2025 기준)`}
            </pre>
            <p className="text-sm text-gray-100 mt-3">
              μ: 평균, Σ: 공분산 행렬, Tr: 행렬의 대각합
            </p>
          </div>

          <div className="bg-gray-700 bg-opacity-50 rounded p-4">
            <h4 className="font-semibold mb-2">📊 점수 해석</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-purple-900 bg-opacity-30 rounded">
                <span>1000 이하</span>
                <span className="text-purple-400 font-bold">최우수 - 실사 수준</span>
              </div>
              <div className="flex justify-between p-2 bg-green-900 bg-opacity-30 rounded">
                <span>1000 ~ 1140</span>
                <span className="text-green-400 font-bold">우수 - 목표치 달성</span>
              </div>
              <div className="flex justify-between p-2 bg-yellow-900 bg-opacity-30 rounded">
                <span>1140 ~ 1500</span>
                <span className="text-yellow-400 font-bold">경계선 - 개선 필요</span>
              </div>
              <div className="flex justify-between p-2 bg-red-900 bg-opacity-30 rounded">
                <span>1500 이상</span>
                <span className="text-red-400 font-bold">불량 - 품질 문제</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-700 bg-opacity-70 rounded-lg p-5 border border-gray-600">
            <h4 className="font-bold text-lg text-white mb-3">💡 측정 방법</h4>
            <ol className="list-decimal list-outside space-y-2 text-base text-gray-100 ml-6">
              <li>Reference dataset 준비 (Kinetics-700 또는 WebVid-10M 2,000개)</li>
              <li>모든 비디오를 I3D 네트워크로 특징 추출 (2048-dim)</li>
              <li>Real/Generated 각각의 평균과 공분산 계산</li>
              <li>Fréchet Distance 공식으로 거리 계산</li>
            </ol>
            <pre className="text-sm bg-gray-900 text-green-300 p-4 rounded-lg mt-4 overflow-x-auto border border-gray-700">
{`import numpy as np
from scipy.linalg import sqrtm

def calculate_fvd(mu1, sigma1, mu2, sigma2):
    diff = mu1 - mu2

    # 공분산 행렬의 제곱근
    covmean = sqrtm(sigma1.dot(sigma2))

    # 허수 부분 제거
    if np.iscomplexobj(covmean):
        covmean = covmean.real

    fvd = diff.dot(diff) + np.trace(
        sigma1 + sigma2 - 2 * covmean
    )
    return fvd

fvd_score = calculate_fvd(
    mu_real, sigma_real,
    mu_generated, sigma_generated
)
print(f"FVD: {fvd_score:.2f}")`}
            </pre>
          </div>

          <div className="bg-orange-900 bg-opacity-20 rounded p-4 border border-orange-500">
            <h4 className="font-semibold mb-2 text-orange-400">⚠️ 현재 상태</h4>
            <div className="text-sm text-gray-300 space-y-1">
              <div><strong>측정 여부:</strong> <span className="text-red-400">미측정</span></div>
              <div><strong>예상 범위:</strong> 800 ~ 1500</div>
              <div><strong>우선순위:</strong> <span className="text-red-400 font-bold">최우선 (Week 1)</span></div>
              <div><strong>소요 시간:</strong> 4일 (GPU 32시간)</div>
              <div><strong>예산:</strong> $300~$600</div>
              <div><strong>필요사항:</strong> Reference dataset (Kinetics-700 다운로드 필요)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison */}
      <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">⚖️ CLIP Score vs FVD 비교</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left p-3">특성</th>
              <th className="text-left p-3">CLIP Score</th>
              <th className="text-left p-3">FVD</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-700">
              <td className="p-3 font-semibold">측정 대상</td>
              <td className="p-3">텍스트-영상 정렬도</td>
              <td className="p-3">비디오 품질 (실사 유사성)</td>
            </tr>
            <tr className="border-b border-gray-700">
              <td className="p-3 font-semibold">사용 모델</td>
              <td className="p-3">CLIP (ViT-B/32)</td>
              <td className="p-3">I3D (Inception-3D)</td>
            </tr>
            <tr className="border-b border-gray-700">
              <td className="p-3 font-semibold">점수 방향</td>
              <td className="p-3 text-green-400">높을수록 좋음 (↑)</td>
              <td className="p-3 text-blue-400">낮을수록 좋음 (↓)</td>
            </tr>
            <tr className="border-b border-gray-700">
              <td className="p-3 font-semibold">목표값</td>
              <td className="p-3 text-green-400">≥ 0.3</td>
              <td className="p-3 text-orange-400">≤ 1140</td>
            </tr>
            <tr className="border-b border-gray-700">
              <td className="p-3 font-semibold">계산 시간</td>
              <td className="p-3">3일 (GPU 48h)</td>
              <td className="p-3">4일 (GPU 32h)</td>
            </tr>
            <tr className="border-b border-gray-700">
              <td className="p-3 font-semibold">예산</td>
              <td className="p-3">$200~$400</td>
              <td className="p-3">$300~$600</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold">중요도</td>
              <td className="p-3 text-red-400">최우선 (캡션 품질)</td>
              <td className="p-3 text-red-400">최우선 (영상 품질)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Comprehensive Tab - COMPREHENSIVE_QUALITY_ANALYSIS.md
function ComprehensiveTab() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">🎯 실제 JSON 분석: 10가지 문제 유형</h2>
        <p className="text-gray-300">실제 데이터에서 발견된 구체적 문제 패턴 및 개선 방안</p>
      </div>

      {/* Problem Types */}
      <div className="grid gap-4">
        {[
          {
            id: 1,
            title: '토큰 수 부족',
            severity: '🔴 Critical',
            color: 'red',
            example: '2115307 (video)',
            issue: 'object_level 토큰: 9+7=16 (목표: 50+)',
            impact: 'CLIP Score 저하 (-0.10)',
            fix: '구체적 묘사 추가 (색상, 크기, 동작)'
          },
          {
            id: 2,
            title: '자동 캡션 중복',
            severity: '🔴 Critical',
            color: 'red',
            example: '2115307 (video)',
            issue: '"이미지입니다" 중복, 비디오인데 "이미지"',
            impact: 'CLIP Score -0.15, 학습 혼란',
            fix: '중복 제거, "영상입니다"로 수정'
          },
          {
            id: 3,
            title: '미지원 해상도',
            severity: '🔴 Critical',
            color: 'red',
            example: '77.8% (155,505개)',
            issue: '1920×1080 → Wan2.2 미지원',
            impact: '학습 불가능',
            fix: '1280×720으로 일괄 변환'
          },
          {
            id: 4,
            title: '비디오 길이 초과',
            severity: '🟠 High',
            color: 'orange',
            example: '14.9% (29,800개)',
            issue: '26.06초 (목표: 25초 이하)',
            impact: '메모리 부족, 학습 효율 저하',
            fix: '25초로 트리밍'
          },
          {
            id: 5,
            title: 'STT-캡션 불일치',
            severity: '🟠 High',
            color: 'orange',
            example: '다수 비디오',
            issue: 'STT 스크립트와 캡션 내용 불일치',
            impact: '의미 정확성 저하',
            fix: 'STT 검증 파이프라인 구축'
          },
          {
            id: 6,
            title: 'OCR 정보 미활용',
            severity: '🟡 Medium',
            color: 'yellow',
            example: '2392760 (image)',
            issue: '자막 추출했으나 캡션에 미반영',
            impact: 'CLIP Score -0.05',
            fix: 'OCR 텍스트를 캡션에 통합'
          },
          {
            id: 7,
            title: '키워드 누락',
            severity: '🟡 Medium',
            color: 'yellow',
            example: '65.2% (130,322개)',
            issue: 'keyword 필드가 null 또는 빈 문자열',
            impact: '검색성 저하',
            fix: '자동 키워드 생성 (TF-IDF 또는 LLM)'
          },
          {
            id: 8,
            title: 'auto_tags 누락',
            severity: '🟡 Medium',
            color: 'yellow',
            example: '다수 샘플',
            issue: 'objects, persons 필드 비어있음',
            impact: '메타데이터 품질 저하',
            fix: 'YOLO/DeepFace로 자동 태깅'
          },
          {
            id: 9,
            title: '추상적 표현 과다',
            severity: '🟢 Low',
            color: 'green',
            example: '2392760 (image)',
            issue: '"평온한 분위기" 같은 추상적 표현',
            impact: 'CLIP Score -0.03',
            fix: '구체적 표현으로 변경 (색상, 위치, 크기)'
          },
          {
            id: 10,
            title: 'object_level 부족',
            severity: '🔴 Critical',
            color: 'red',
            example: '다수 샘플',
            issue: 'object_level 설명이 너무 짧음',
            impact: 'Token 수 부족, CLIP Score 저하',
            fix: '객체별 상세 설명 추가'
          }
        ].map(problem => (
          <div key={problem.id} className={`bg-gray-800 bg-opacity-50 rounded-lg p-4 border-l-4 border-${problem.color}-500`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold">{problem.id}. {problem.title}</h3>
                <div className="text-sm text-gray-400">예시: {problem.example}</div>
              </div>
              <div className={`px-3 py-1 rounded text-sm font-bold ${
                problem.color === 'red' ? 'bg-red-900 bg-opacity-50 text-red-300' :
                problem.color === 'orange' ? 'bg-orange-900 bg-opacity-50 text-orange-300' :
                problem.color === 'yellow' ? 'bg-yellow-900 bg-opacity-50 text-yellow-300' :
                'bg-green-900 bg-opacity-50 text-green-300'
              }`}>
                {problem.severity}
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-gray-400 text-xs">문제</div>
                <div className="text-white">{problem.issue}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">영향</div>
                <div className={`${
                  problem.color === 'red' ? 'text-red-400' :
                  problem.color === 'orange' ? 'text-orange-400' :
                  problem.color === 'yellow' ? 'text-yellow-400' :
                  'text-green-400'
                }`}>{problem.impact}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">해결 방법</div>
                <div className="text-blue-300">{problem.fix}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Impact Summary */}
      <div className="bg-gradient-to-r from-red-900 to-orange-900 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">📊 문제 유형별 영향도</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between p-2 bg-black bg-opacity-40 rounded">
            <span>🔴 Critical (4개)</span>
            <span className="text-red-400 font-bold">즉시 조치 필수 - CLIP Score 직접 영향</span>
          </div>
          <div className="flex justify-between p-2 bg-black bg-opacity-40 rounded">
            <span>🟠 High (2개)</span>
            <span className="text-orange-400 font-bold">1-2주 내 조치 - 학습 효율 영향</span>
          </div>
          <div className="flex justify-between p-2 bg-black bg-opacity-40 rounded">
            <span>🟡 Medium (3개)</span>
            <span className="text-yellow-400 font-bold">1개월 내 조치 - 품질 개선 효과</span>
          </div>
          <div className="flex justify-between p-2 bg-black bg-opacity-40 rounded">
            <span>🟢 Low (1개)</span>
            <span className="text-green-400 font-bold">장기 개선 - 미세 조정</span>
          </div>
        </div>
      </div>

      {/* Implementation Priority */}
      <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">🚀 구현 우선순위</h2>
        <div className="space-y-3">
          <div className="bg-red-900 bg-opacity-20 rounded p-3 border border-red-500">
            <h3 className="font-semibold text-red-400 mb-2">Week 1: Critical 문제 해결</h3>
            <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
              <li>#3: 해상도 일괄 변환 (155,505개 → 1280×720)</li>
              <li>#1, #2, #10: 캡션 개선 스크립트 실행</li>
            </ul>
          </div>
          <div className="bg-orange-900 bg-opacity-20 rounded p-3 border border-orange-500">
            <h3 className="font-semibold text-orange-400 mb-2">Week 2-3: High 문제 해결</h3>
            <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
              <li>#4: 비디오 트리밍 (29,800개 → 25초 이하)</li>
              <li>#5: STT 검증 파이프라인 구축</li>
            </ul>
          </div>
          <div className="bg-yellow-900 bg-opacity-20 rounded p-3 border border-yellow-500">
            <h3 className="font-semibold text-yellow-400 mb-2">Week 4-6: Medium 문제 해결</h3>
            <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
              <li>#6: OCR 텍스트 통합</li>
              <li>#7: 키워드 자동 생성 (130,322개)</li>
              <li>#8: auto_tags 자동 태깅</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
