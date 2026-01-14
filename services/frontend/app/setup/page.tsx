'use client'

import Link from 'next/link'
import Layout from '@/components/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  CpuChipIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'

export default function SetupPage() {
  const setupSteps = [
    { id: 1, name: 'GPU 확인', command: 'nvidia-smi', status: 'completed' },
    { id: 2, name: '가상환경', command: 'source .venv/bin/activate', status: 'completed' },
    { id: 3, name: 'bitsandbytes 설치', command: 'pip install bitsandbytes', status: 'pending' },
    { id: 4, name: '체크포인트 다운로드', command: 'huggingface-cli download Wan-AI/Wan2.2-T2V-A14B --local-dir ./Wan2.2-T2V-A14B', status: 'pending' },
  ]

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">V100 환경 준비</h1>
        <p className="text-sm text-slate-600 mt-1">학습을 위한 GPU 및 환경 설정</p>
      </div>

      {/* GPU Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CpuChipIcon className="w-5 h-5" />
            GPU 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GPUCard gpu={0} model="Tesla V100-SXM2" memory="32GB" status="idle" />
            <GPUCard gpu={1} model="Tesla V100-SXM2" memory="32GB" status="idle" />
          </div>
        </CardContent>
      </Card>

      {/* Setup Checklist */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>설정 체크리스트</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {setupSteps.map((step) => (
              <SetupStepCard key={step.id} {...step} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* V100 Configuration */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>V100 최적화 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">메모리 최적화</h3>
              <div className="space-y-3">
                <OptimizationItem label="LoRA Rank" from="32" to="16" savings="50%" />
                <OptimizationItem label="Frame Num" from="81" to="49" savings="40%" />
                <OptimizationItem label="Caption Length" from="512" to="256" savings="20%" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">성능 최적화</h3>
              <div className="space-y-3">
                <ConfigItem label="T5 CPU Offload" value="Enabled" color="green" />
                <ConfigItem label="VAE CPU Offload" value="Enabled" color="green" />
                <ConfigItem label="8-bit Optimizer" value="Enabled" color="green" />
                <ConfigItem label="Gradient Accum" value="16" color="blue" />
              </div>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900 text-sm">
              <span className="font-semibold">Effective Batch Size:</span> 1 × 16 × 2 = 32 (A100과 동일)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* System Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <RequirementCard
          title="디스크 공간"
          required="100 GB"
          current="250 GB"
          status="ok"
        />
        <RequirementCard
          title="RAM"
          required="64 GB"
          current="128 GB"
          status="ok"
        />
        <RequirementCard
          title="CUDA"
          required="11.8+"
          current="12.1"
          status="ok"
        />
      </div>

      {/* Quick Commands */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>유용한 명령어</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <CommandCard
              title="GPU 상태 확인"
              command="nvidia-smi"
              description="실시간 GPU 모니터링"
            />
            <CommandCard
              title="실시간 GPU 모니터링"
              command="watch -n 1 nvidia-smi"
              description="1초마다 GPU 상태 업데이트"
            />
            <CommandCard
              title="GPU 초기화"
              command="nvidia-smi --gpu-reset"
              description="GPU 메모리 완전 초기화"
            />
            <CommandCard
              title="Python 환경 확인"
              command="python -c 'import torch; print(torch.cuda.is_available())'"
              description="PyTorch CUDA 가용성 확인"
            />
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Button variant="secondary" className="h-auto py-4">
          <ArrowPathIcon className="w-5 h-5 mr-2" />
          환경 재설정
        </Button>
        <Link href="/training">
          <Button className="w-full h-auto py-4">
            <RocketLaunchIcon className="w-5 h-5 mr-2" />
            학습 시작하기
          </Button>
        </Link>
      </div>
    </Layout>
  )
}

function GPUCard({ gpu, model, memory, status }: any) {
  const statusColors: any = {
    idle: 'bg-emerald-100 text-emerald-800',
    training: 'bg-blue-100 text-blue-800',
    error: 'bg-red-100 text-red-800',
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-slate-900 font-semibold">GPU {gpu}</h3>
        <Badge variant="neutral" className={statusColors[status]}>
          {status}
        </Badge>
      </div>
      <p className="text-slate-700 text-sm">{model}</p>
      <p className="text-slate-600 text-sm">{memory}</p>
    </div>
  )
}

function SetupStepCard({ id, name, command, status }: any) {
  return (
    <div className={`bg-slate-50 rounded-lg p-4 border-l-4 ${
      status === 'completed' ? 'border-emerald-600' : 'border-amber-600'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            status === 'completed' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
          }`}>
            {status === 'completed' ? <CheckCircleIcon className="w-5 h-5" /> : id}
          </div>
          <h3 className="text-slate-900 font-semibold">{name}</h3>
        </div>
        <Badge variant={status === 'completed' ? 'success' : 'warning'}>
          {status === 'completed' ? '완료' : '대기'}
        </Badge>
      </div>
      <code className="text-xs bg-slate-900 text-emerald-400 px-2 py-1 rounded block overflow-x-auto">
        {command}
      </code>
    </div>
  )
}

function OptimizationItem({ label, from, to, savings }: any) {
  return (
    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded p-3">
      <span className="text-slate-700 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-red-600 text-sm line-through">{from}</span>
        <span className="text-slate-900">→</span>
        <span className="text-emerald-600 text-sm font-semibold">{to}</span>
        <Badge variant="success" className="text-xs">
          {savings}
        </Badge>
      </div>
    </div>
  )
}

function ConfigItem({ label, value, color }: any) {
  const colorClasses: any = {
    green: 'text-emerald-600',
    blue: 'text-blue-600',
  }

  return (
    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded p-3">
      <span className="text-slate-700 text-sm">{label}</span>
      <span className={`font-semibold ${colorClasses[color]}`}>{value}</span>
    </div>
  )
}

function RequirementCard({ title, required, current, status }: any) {
  const statusColors: any = {
    ok: 'border-emerald-600',
    warning: 'border-amber-600',
    error: 'border-red-600',
  }

  return (
    <Card className={`border-2 ${statusColors[status]}`}>
      <CardContent className="pt-6">
        <h3 className="text-slate-900 font-semibold mb-3">{title}</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">필요</span>
            <span className="text-slate-900">{required}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">현재</span>
            <span className="text-emerald-600 font-semibold">{current}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CommandCard({ title, command, description }: any) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <h4 className="text-slate-900 font-semibold mb-2">{title}</h4>
      <code className="text-xs bg-slate-900 text-emerald-400 px-3 py-2 rounded block mb-2 overflow-x-auto">
        {command}
      </code>
      <p className="text-slate-600 text-xs">{description}</p>
    </div>
  )
}
