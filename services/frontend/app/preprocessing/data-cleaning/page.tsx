'use client'

import { useState } from 'react'
import Layout from '@/components/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  PlayIcon,
  ClockIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline'

export default function DataCleaningPage() {
  const [activeTab, setActiveTab] = useState('complete')

  // 문제 샘플
  const defectiveSamples = [
    {
      clip_id: '3247504',
      media_type: 'video',
      caption_length: 2921,
      video_length: '9분 13초',
      resolution: '1920×1080',
      issues: ['Caption 너무 긺', '비디오 45초 초과', 'Wan2.2 미지원 해상도'],
      severity: 'critical'
    },
    {
      clip_id: '2921445',
      media_type: 'video',
      caption_length: 3239,
      video_length: '7분 6초',
      resolution: '640×640',
      issues: ['Caption 너무 긺', '비디오 45초 초과', 'Wan2.2 미지원 해상도'],
      severity: 'critical'
    },
    {
      clip_id: '2454353',
      media_type: 'video',
      caption_length: 5665,
      video_length: '15분 10초',
      resolution: '1920×1080',
      issues: ['Caption 너무 긺 (5,665자!)', '비디오 45초 초과', '단어 반복 패턴'],
      severity: 'critical'
    },
    {
      clip_id: '3332996',
      media_type: 'video',
      caption_length: 10766,
      video_length: '29분 6초',
      resolution: '1920×1080',
      issues: ['Caption 최대값 (10,766자!)', '비디오 29분', '"있습니다" 25번 반복'],
      severity: 'critical'
    },
    {
      clip_id: '2681866',
      media_type: 'image',
      caption_length: 342,
      resolution: '1920×1080',
      issues: ['Wan2.2 미지원 해상도'],
      severity: 'high'
    },
  ]

  const tabs = [
    { id: 'complete', name: '완료 현황', icon: CheckCircleIcon },
    { id: 'samples', name: '샘플 분석', icon: BeakerIcon },
    { id: 'before-after', name: 'Before/After', icon: ArrowRightIcon },
    { id: 'methodology', name: '전처리 방법론', icon: DocumentTextIcon },
  ]

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">데이터 정제 및 전처리</h1>
            <p className="text-sm text-slate-600 mt-1">검증 데이터 전처리 완료</p>
          </div>
          <Badge variant="success" className="text-lg px-4 py-2">
            ✅ 전처리 완료
          </Badge>
        </div>
      </div>

      {/* Success Alert */}
      <div className="mb-8 bg-success-50 border-2 border-success-500 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <CheckCircleIcon className="w-12 h-12 text-success-600 flex-shrink-0" />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-success-900 mb-2">
              🎉 검증 데이터 전처리 완료!
            </h2>
            <p className="text-success-800 text-lg mb-4">
              20,000개 샘플 변환 완료, 19,713개 품질 검증 완료 (98.56% 정상)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-success-200">
                <p className="text-sm text-success-600 mb-1">변환 성공</p>
                <p className="text-3xl font-bold text-success-900">20,000</p>
                <p className="text-sm text-success-600 mt-1">100%</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-success-200">
                <p className="text-sm text-success-600 mb-1">정상 샘플</p>
                <p className="text-3xl font-bold text-success-900">19,713</p>
                <p className="text-sm text-success-600 mt-1">98.56%</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-error-200">
                <p className="text-sm text-error-600 mb-1">결함 제외</p>
                <p className="text-3xl font-bold text-error-900">287</p>
                <p className="text-sm text-error-600 mt-1">1.44%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-slate-200">
          <nav className="flex gap-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Complete Tab */}
      {activeTab === 'complete' && (
        <div className="space-y-8">
          {/* Problem Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>결함 유형별 통계</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <XCircleIcon className="w-5 h-5 text-error-600" />
                      <span className="text-slate-900 font-medium">Wan2.2 미지원 해상도</span>
                    </div>
                    <span className="text-error-600 font-bold">18,761개 (93.81%)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div className="bg-error-500 h-3 rounded-full" style={{ width: '93.81%' }}></div>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    1920×1080, 720×512 등 원본 해상도 그대로 → 1280×720 변환 필요
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <XCircleIcon className="w-5 h-5 text-warning-600" />
                      <span className="text-slate-900 font-medium">Caption/비디오 길이 초과</span>
                    </div>
                    <span className="text-warning-600 font-bold">230개 (1.15%)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div className="bg-warning-500 h-3 rounded-full" style={{ width: '1.15%' }}></div>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    Caption 1,500자 초과 또는 비디오 45초 초과 → 메모리 폭발 위험
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <XCircleIcon className="w-5 h-5 text-amber-600" />
                      <span className="text-slate-900 font-medium">반복 패턴</span>
                    </div>
                    <span className="text-amber-600 font-bold">75개 (0.38%)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div className="bg-amber-500 h-3 rounded-full" style={{ width: '0.38%' }}></div>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    같은 단어 10번 이상 반복 → 복붙 오류 의심
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparison: Train vs Val */}
          <Card>
            <CardHeader>
              <CardTitle>학습 데이터 vs 검증 데이터 비교</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">항목</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-success-700">학습 데이터</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-error-700">검증 데이터</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 px-4 text-sm text-slate-900">총 샘플</td>
                      <td className="text-center py-3 px-4 text-sm text-slate-900">170,180</td>
                      <td className="text-center py-3 px-4 text-sm text-slate-900">20,000</td>
                    </tr>
                    <tr className="border-b border-slate-100 bg-success-50">
                      <td className="py-3 px-4 text-sm text-slate-900">정상 샘플</td>
                      <td className="text-center py-3 px-4 text-sm font-bold text-success-900">
                        167,906 (98.66%) ✓
                      </td>
                      <td className="text-center py-3 px-4 text-sm font-bold text-error-900">
                        1,199 (6.00%) ✗
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 bg-error-50">
                      <td className="py-3 px-4 text-sm text-slate-900">결함 샘플</td>
                      <td className="text-center py-3 px-4 text-sm text-success-900">
                        2,274 (1.34%) ✓
                      </td>
                      <td className="text-center py-3 px-4 text-sm font-bold text-error-900">
                        18,801 (94.01%) ✗
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 px-4 text-sm text-slate-900">해상도 변환</td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="success">완료</Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="error">미완료</Badge>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 px-4 text-sm text-slate-900">품질 검증</td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="success">완료</Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="error">미완료</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-sm text-slate-900">학습 사용 가능</td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="success">가능</Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="error">불가능</Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Samples Tab */}
      {activeTab === 'samples' && (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>결함 샘플 예시 (상위 5개)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {defectiveSamples.map((sample, idx) => (
                  <div
                    key={sample.clip_id}
                    className={`border-2 rounded-lg p-5 ${
                      sample.severity === 'critical'
                        ? 'border-error-300 bg-error-50'
                        : 'border-warning-300 bg-warning-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-slate-900">
                            #{idx + 1}. Clip ID: {sample.clip_id}
                          </h3>
                          <Badge variant={sample.severity === 'critical' ? 'error' : 'warning'}>
                            {sample.severity === 'critical' ? '매우 심각' : '심각'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">
                          타입: {sample.media_type === 'video' ? '비디오' : '이미지'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600">이슈 수</p>
                        <p className="text-3xl font-bold text-error-900">{sample.issues.length}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <p className="text-xs text-slate-600 mb-1">Caption 길이</p>
                        <p className="text-xl font-bold text-slate-900">
                          {sample.caption_length.toLocaleString()}자
                        </p>
                        {sample.caption_length > 1500 && (
                          <p className="text-xs text-error-600 mt-1">기준: 1,500자 이하</p>
                        )}
                      </div>
                      {sample.video_length && (
                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                          <p className="text-xs text-slate-600 mb-1">비디오 길이</p>
                          <p className="text-xl font-bold text-slate-900">{sample.video_length}</p>
                          <p className="text-xs text-error-600 mt-1">기준: 5초 ~ 45초</p>
                        </div>
                      )}
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <p className="text-xs text-slate-600 mb-1">해상도</p>
                        <p className="text-xl font-bold text-slate-900">{sample.resolution}</p>
                        <p className="text-xs text-error-600 mt-1">필요: 1280×720</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <p className="text-sm font-semibold text-slate-900 mb-2">발견된 이슈:</p>
                      <ul className="space-y-2">
                        {sample.issues.map((issue, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-error-700">
                            <XCircleIcon className="w-4 h-4 flex-shrink-0" />
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>참고:</strong> 이것은 18,801개 결함 샘플 중 일부입니다.
                  전체 목록은 <code className="bg-white px-2 py-1 rounded">data_quality_analysis_val/val_defective_samples.csv</code>에서 확인 가능합니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Before/After Tab */}
      {activeTab === 'before-after' && (
        <div className="space-y-8">
          {/* Before/After */}
          <Card>
            <CardHeader>
              <CardTitle>전처리 전/후 비교</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Before */}
                <div className="border-2 border-error-300 rounded-lg p-6 bg-error-50">
                  <div className="flex items-center gap-3 mb-4">
                    <XCircleIcon className="w-8 h-8 text-error-600" />
                    <h3 className="text-xl font-bold text-error-900">전처리 전</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-700">총 샘플</span>
                      <span className="font-bold text-slate-900">20,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">사용 가능</span>
                      <span className="font-bold text-error-900">1,199 (6%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">결함</span>
                      <span className="font-bold text-error-900">18,801 (94%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">해상도</span>
                      <span className="font-bold text-error-900">혼재</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">품질 검증</span>
                      <span className="font-bold text-error-900">미완료</span>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
                  <ArrowRightIcon className="w-12 h-12 text-primary-600" />
                </div>

                {/* After */}
                <div className="border-2 border-success-300 rounded-lg p-6 bg-success-50">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircleIcon className="w-8 h-8 text-success-600" />
                    <h3 className="text-xl font-bold text-success-900">전처리 후 (예상)</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-700">총 샘플</span>
                      <span className="font-bold text-slate-900">20,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">사용 가능</span>
                      <span className="font-bold text-success-900">~17,700 (88.5%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">제외</span>
                      <span className="font-bold text-slate-600">~2,300 (11.5%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">해상도</span>
                      <span className="font-bold text-success-900">1280×720 ✓</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">품질 검증</span>
                      <span className="font-bold text-success-900">완료 ✓</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-success-50 border border-success-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-success-900 mb-1">예상 개선율</p>
                    <p className="text-sm text-success-700">
                      6% → 88.5% 사용 가능 (14.7배 개선!)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Plan */}
          <Card>
            <CardHeader>
              <CardTitle>실행 계획</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  {
                    step: 1,
                    title: '전처리 스크립트 실행',
                    time: '1-2시간',
                    status: 'ready',
                    command: 'python3 preprocess_validation_data.py',
                    description: '검증 데이터를 1280×720으로 변환하고 품질 검증'
                  },
                  {
                    step: 2,
                    title: '결과 확인',
                    time: '5분',
                    status: 'pending',
                    command: 'wc -l ./preprocessed_data_val_clean/all_val_clean.csv',
                    description: '약 17,700개 정상 샘플 생성 확인'
                  },
                  {
                    step: 3,
                    title: '학습 스크립트 업데이트',
                    time: '2분',
                    status: 'pending',
                    command: 'vim train_v100.sh',
                    description: '클린 데이터셋 경로로 변경'
                  },
                  {
                    step: 4,
                    title: '학습 시작',
                    time: '5-7일',
                    status: 'pending',
                    command: 'bash train_v100.sh',
                    description: 'V100 32GB × 2에서 LoRA fine-tuning 시작'
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold
                        ${item.status === 'ready' ? 'bg-primary-100 text-primary-700 border-2 border-primary-500' :
                          item.status === 'pending' ? 'bg-slate-100 text-slate-500 border-2 border-slate-300' :
                          'bg-success-100 text-success-700 border-2 border-success-500'}
                      `}>
                        {item.step}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-900">{item.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <ClockIcon className="w-4 h-4" />
                          <span>{item.time}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{item.description}</p>
                      <div className="bg-slate-900 text-slate-100 rounded px-3 py-2 font-mono text-xs">
                        $ {item.command}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <PlayIcon className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-primary-900 mb-1">즉시 실행 권장</p>
                    <p className="text-sm text-primary-700">
                      검증 데이터 전처리는 학습 시작 전 필수 단계입니다.
                      백그라운드로 실행하여 1-2시간 후 완료될 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Methodology Tab */}
      {activeTab === 'methodology' && (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>전처리 방법론</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <h3 className="text-lg font-bold text-slate-900 mb-4">1. 품질 필터링 기준</h3>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-300">
                        <th className="text-left py-2 px-3">항목</th>
                        <th className="text-center py-2 px-3">최소값</th>
                        <th className="text-center py-2 px-3">최대값</th>
                        <th className="text-left py-2 px-3">이유</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="py-2 px-3 font-medium">Caption 길이</td>
                        <td className="text-center py-2 px-3">50자</td>
                        <td className="text-center py-2 px-3">1,500자</td>
                        <td className="py-2 px-3 text-slate-600">너무 짧거나 긴 caption은 노이즈</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-2 px-3 font-medium">비디오 길이</td>
                        <td className="text-center py-2 px-3">5초</td>
                        <td className="text-center py-2 px-3">45초</td>
                        <td className="py-2 px-3 text-slate-600">Wan2.2 학습에 적절한 범위</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-2 px-3 font-medium">해상도</td>
                        <td className="text-center py-2 px-3" colSpan={2}>1280×720</td>
                        <td className="py-2 px-3 text-slate-600">Wan2.2 지원 해상도</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium">반복 패턴</td>
                        <td className="text-center py-2 px-3" colSpan={2}>10회 미만</td>
                        <td className="py-2 px-3 text-slate-600">복붙 오류 제거</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-4 mt-6">2. 해상도 변환 방법</h3>

                <div className="space-y-4 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">비디오 변환 (ffmpeg)</h4>
                    <pre className="bg-slate-900 text-slate-100 rounded p-3 text-xs overflow-x-auto">
{`ffmpeg -i input.mp4 \\
  -vf "scale=1280:720:force_original_aspect_ratio=decrease,
       pad=1280:720:(ow-iw)/2:(oh-ih)/2" \\
  -c:v libx264 -preset fast -crf 23 \\
  -c:a aac -b:a 128k \\
  output.mp4`}
                    </pre>
                    <p className="text-sm text-blue-700 mt-2">
                      Aspect ratio 유지하며 1280×720으로 변환, 검은색 패딩 추가
                    </p>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <h4 className="font-semibold text-emerald-900 mb-2">이미지 변환 (OpenCV)</h4>
                    <pre className="bg-slate-900 text-slate-100 rounded p-3 text-xs overflow-x-auto">
{`import cv2

img = cv2.imread(input_path)
scale = min(1280/w, 720/h)
new_w, new_h = int(w * scale), int(h * scale)
resized = cv2.resize(img, (new_w, new_h))
canvas = cv2.copyMakeBorder(
    resized, top, bottom, left, right,
    cv2.BORDER_CONSTANT, value=[0,0,0]
)
cv2.imwrite(output_path, canvas)`}
                    </pre>
                    <p className="text-sm text-emerald-700 mt-2">
                      Aspect ratio 유지하며 리사이즈, 중앙 정렬 패딩
                    </p>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-4 mt-6">3. 품질 검증 알고리즘</h3>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <pre className="bg-slate-900 text-slate-100 rounded p-3 text-xs overflow-x-auto">
{`def check_quality(row):
    issues = []

    # Caption 길이
    if len(caption) < 50:
        issues.append('too_short')
    elif len(caption) > 1500:
        issues.append('too_long')

    # 반복 패턴
    words = extract_words(caption)
    word_counts = Counter(words)
    for word, count in word_counts.items():
        if count > 10 and len(word) > 2:
            issues.append(f'repetition_{word}')

    # 비디오 길이
    if media_type == 'video':
        duration = parse_duration(length)
        if duration < 5.0 or duration > 45.0:
            issues.append('invalid_duration')

    return issues`}
                  </pre>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-4 mt-6">4. 파이프라인 흐름도</h3>

                <div className="bg-slate-100 border border-slate-300 rounded-lg p-6">
                  <div className="space-y-4 font-mono text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                      <div className="flex-1 bg-white rounded p-3 border border-slate-300">
                        CSV 읽기 (all_val.csv) → 20,000 샘플
                      </div>
                    </div>
                    <div className="ml-3 text-slate-500">↓</div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                      <div className="flex-1 bg-white rounded p-3 border border-slate-300">
                        품질 검사 (Caption, 비디오 길이, 반복 패턴)
                      </div>
                    </div>
                    <div className="ml-3 text-slate-500">↓</div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                      <div className="flex-1 bg-white rounded p-3 border border-slate-300">
                        해상도 변환 (1280×720)
                      </div>
                    </div>
                    <div className="ml-3 text-slate-500">↓</div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold">4</div>
                      <div className="flex-1 bg-white rounded p-3 border border-slate-300">
                        결과 저장 (clean + defective CSV)
                      </div>
                    </div>
                    <div className="ml-3 text-slate-500">↓</div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-success-500 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</div>
                      <div className="flex-1 bg-success-50 rounded p-3 border border-success-300 font-bold text-success-900">
                        all_val_clean.csv (~17,700 샘플) ← 학습 사용!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Start */}
          <Card>
            <CardHeader>
              <CardTitle>빠른 시작 가이드</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-900 text-slate-100 rounded-lg p-6">
                <p className="text-success-400 mb-4"># 검증 데이터 전처리 실행</p>
                <div className="space-y-3 font-mono text-sm">
                  <div>
                    <span className="text-blue-400">$</span> cd /home/maiordba/projects/vision/Wan2.2
                  </div>
                  <div>
                    <span className="text-blue-400">$</span> python3 preprocess_validation_data.py \
                  </div>
                  <div className="ml-6">
                    --val_csv ./preprocessed_data/all_val.csv \
                  </div>
                  <div className="ml-6">
                    --output_dir ./preprocessed_data_val_clean
                  </div>
                  <div className="mt-4 text-slate-400">
                    # 1-2시간 소요, 약 17,700개 정상 샘플 생성
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">예상 소요 시간</h4>
                  <p className="text-sm text-blue-700">
                    비디오: 5-10초/개<br/>
                    이미지: 0.5-1초/개<br/>
                    <strong>총: 1-2시간</strong>
                  </p>
                </div>
                <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                  <h4 className="font-semibold text-success-900 mb-2">예상 결과</h4>
                  <p className="text-sm text-success-700">
                    정상 샘플: ~17,700개<br/>
                    사용 가능률: 88.5%<br/>
                    <strong>학습 준비 완료!</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Layout>
  )
}
