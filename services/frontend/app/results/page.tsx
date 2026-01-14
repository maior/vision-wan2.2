'use client'

import Link from 'next/link'
import Layout from '@/components/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  ChartBarIcon,
  CpuChipIcon,
  ArrowDownTrayIcon,
  RocketLaunchIcon,
  FilmIcon,
  ChartPieIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

export default function ResultsPage() {
  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">학습 결과 및 평가</h1>
        <p className="text-sm text-slate-600 mt-1">모델 성능 분석 및 비교</p>
      </div>

      {/* Training Summary */}
      <Card className="mb-8 border-2 border-emerald-600">
        <CardContent className="pt-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">학습 완료</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-slate-600 text-sm mb-2">총 Epochs</p>
              <p className="text-slate-900 text-3xl font-bold">3</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm mb-2">최종 Loss</p>
              <p className="text-slate-900 text-3xl font-bold">0.032</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm mb-2">소요 시간</p>
              <p className="text-slate-900 text-3xl font-bold">6.2일</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm mb-2">학습 샘플</p>
              <p className="text-slate-900 text-3xl font-bold">179,994</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loss History */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5" />
            Loss 변화
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between text-slate-700 mb-2">
              <span>Epoch 1</span>
              <span>Loss: 0.145</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-red-600 h-2 rounded-full" style={{ width: '90%' }}></div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-slate-700 mb-2">
              <span>Epoch 2</span>
              <span>Loss: 0.067</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-amber-600 h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-slate-700 mb-2">
              <span>Epoch 3</span>
              <span>Loss: 0.032</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '20%' }}></div>
            </div>
          </div>

          <p className="text-emerald-600 mt-4 text-sm">
            Loss가 성공적으로 감소했습니다
          </p>
        </CardContent>
      </Card>

      {/* Model Checkpoints */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>저장된 체크포인트</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <CheckpointCard
              epoch={1}
              loss={0.145}
              size="487 MB"
              date="2025-11-09 14:23:45"
              isBest={false}
            />
            <CheckpointCard
              epoch={2}
              loss={0.067}
              size="487 MB"
              date="2025-11-11 18:45:12"
              isBest={false}
            />
            <CheckpointCard
              epoch={3}
              loss={0.032}
              size="487 MB"
              date="2025-11-13 22:15:33"
              isBest={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* GPU Usage Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CpuChipIcon className="w-5 h-5" />
              GPU 사용 통계
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <MetricRow label="평균 GPU 사용률" value="68%" />
              <MetricRow label="평균 메모리 사용" value="29.2 GB / 32 GB" />
              <MetricRow label="최대 온도" value="76°C" />
              <MetricRow label="전력 소비" value="~285W" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>학습 파라미터</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <MetricRow label="LoRA Rank" value="16" />
              <MetricRow label="Learning Rate" value="1e-4" />
              <MetricRow label="Batch Size" value="32 (effective)" />
              <MetricRow label="Optimizer" value="AdamW 8-bit" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>다음 단계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <NextStepCard
              icon={<FilmIcon className="w-6 h-6" />}
              title="비디오 생성 테스트"
              description="학습된 모델로 비디오 생성"
              command="python generate.py --lora ./lora_checkpoints_v100/checkpoint_epoch_3.pt"
            />
            <NextStepCard
              icon={<ChartPieIcon className="w-6 h-6" />}
              title="정량적 평가"
              description="FVD, IS 등 메트릭 계산"
              command="python evaluate.py --checkpoint epoch_3"
            />
            <NextStepCard
              icon={<ArrowPathIcon className="w-6 h-6" />}
              title="추가 Fine-tuning"
              description="특정 도메인에 대한 추가 학습"
              command="bash train_v100.sh --resume"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Button variant="secondary" className="h-auto py-4">
          <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
          체크포인트 다운로드
        </Button>
        <Link href="/training">
          <Button className="w-full h-auto py-4">
            <RocketLaunchIcon className="w-5 h-5 mr-2" />
            새 학습 시작
          </Button>
        </Link>
      </div>
    </Layout>
  )
}

function CheckpointCard({ epoch, loss, size, date, isBest }: any) {
  return (
    <div className={`bg-slate-50 rounded-lg p-4 border-2 ${
      isBest ? 'border-amber-600' : 'border-slate-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold">
            E{epoch}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-slate-900 font-semibold">Epoch {epoch}</h3>
              {isBest && <Badge variant="warning">Best</Badge>}
            </div>
            <p className="text-slate-600 text-sm">Loss: {loss} | {size}</p>
            <p className="text-slate-500 text-xs">{date}</p>
          </div>
        </div>
        <Button size="sm" variant="secondary">다운로드</Button>
      </div>
    </div>
  )
}

function MetricRow({ label, value }: any) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-600 text-sm">{label}</span>
      <span className="text-slate-900 font-semibold">{value}</span>
    </div>
  )
}

function NextStepCard({ icon, title, description, command }: any) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="text-blue-600 mb-4">{icon}</div>
        <h3 className="text-slate-900 font-bold text-lg mb-2">{title}</h3>
        <p className="text-slate-600 text-sm mb-4">{description}</p>
        <code className="text-xs bg-slate-100 px-2 py-1 rounded text-blue-600 block overflow-x-auto border border-slate-200">
          {command}
        </code>
      </CardContent>
    </Card>
  )
}
