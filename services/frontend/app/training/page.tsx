'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  CpuChipIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7010'

interface GPUStatus {
  active: boolean
  current_step: number
  total_steps: number
  epoch: number
  loss: number
  lr: number
  progress: number
  timestamp: number
}

interface TrainingStatus {
  gpu0: GPUStatus
  gpu1: GPUStatus
}

interface MetricPoint {
  timestamp: number
  gpu_id: number
  epoch: number
  step: number
  total_steps: number
  loss: number
  lr: number
  progress: number
}

export default function TrainingPage() {
  const [status, setStatus] = useState<TrainingStatus | null>(null)
  const [metrics, setMetrics] = useState<{ gpu0: MetricPoint[], gpu1: MetricPoint[] } | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [statusRes, metricsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/training/status`),
        fetch(`${API_BASE_URL}/api/training/metrics`)
      ])

      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setStatus(statusData)
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setMetrics(metricsData)
      }

      setLastUpdate(new Date())
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to fetch training data:', error)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 3000) // Refresh every 3 seconds
    return () => clearInterval(interval)
  }, [])

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('ko-KR')
  }

  const calculateETA = (progress: number) => {
    if (!status) return 'N/A'
    const gpu = status.gpu0.active ? status.gpu0 : status.gpu1.active ? status.gpu1 : null
    if (!gpu || !gpu.active || gpu.current_step === 0) return '계산 중...'

    const stepsRemaining = gpu.total_steps - gpu.current_step
    const timeElapsed = Date.now() / 1000 - (metrics?.gpu0[0]?.timestamp || Date.now() / 1000)
    const timePerStep = timeElapsed / gpu.current_step
    const etaSeconds = stepsRemaining * timePerStep

    const hours = Math.floor(etaSeconds / 3600)
    const minutes = Math.floor((etaSeconds % 3600) / 60)
    return `약 ${hours}시간 ${minutes}분`
  }

  // Prepare chart data
  const prepareChartData = () => {
    if (!metrics) return []

    const combined = [
      ...(metrics.gpu0 || []).map(m => ({ ...m, gpu: 'GPU 0' })),
      ...(metrics.gpu1 || []).map(m => ({ ...m, gpu: 'GPU 1' }))
    ]

    return combined.sort((a, b) => a.step - b.step).slice(-50) // Last 50 points
  }

  const chartData = prepareChartData()

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-slate-600">학습 상태 로드 중...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">LoRA 학습 모니터</h1>
          <p className="text-sm text-slate-600 mt-1">V100 32GB × 2 | Wan2.2-TI2V-5B (Quick Test)</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">마지막 업데이트</p>
          <p className="text-sm text-slate-700 font-mono">{lastUpdate.toLocaleTimeString('ko-KR')}</p>
        </div>
      </div>

      {/* GPU Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* GPU 0 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CpuChipIcon className="w-5 h-5" />
              GPU 0 상태
              {status?.gpu0.active && (
                <Badge variant="success">활성</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status?.gpu0.active ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-slate-600 mb-2">
                    <span>진행률</span>
                    <span>{status.gpu0.progress.toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${status.gpu0.progress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <MetricRow label="Epoch" value={`${status.gpu0.epoch}/3`} />
                  <MetricRow label="Step" value={`${status.gpu0.current_step}/${status.gpu0.total_steps}`} />
                  <MetricRow label="Loss" value={status.gpu0.loss.toFixed(4)} />
                  <MetricRow label="Learning Rate" value={status.gpu0.lr.toExponential(2)} />
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">학습 시작 대기 중...</p>
            )}
          </CardContent>
        </Card>

        {/* GPU 1 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CpuChipIcon className="w-5 h-5" />
              GPU 1 상태
              {status?.gpu1.active && (
                <Badge variant="success">활성</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status?.gpu1.active ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-slate-600 mb-2">
                    <span>진행률</span>
                    <span>{status.gpu1.progress.toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-emerald-600 h-3 rounded-full transition-all"
                      style={{ width: `${status.gpu1.progress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <MetricRow label="Epoch" value={`${status.gpu1.epoch}/3`} />
                  <MetricRow label="Step" value={`${status.gpu1.current_step}/${status.gpu1.total_steps}`} />
                  <MetricRow label="Loss" value={status.gpu1.loss.toFixed(4)} />
                  <MetricRow label="Learning Rate" value={status.gpu1.lr.toExponential(2)} />
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">학습 시작 대기 중...</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Training Summary */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5" />
            학습 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-slate-600 text-sm mb-1">데이터셋</p>
              <p className="text-slate-900 font-bold text-lg">5,000 샘플</p>
              <p className="text-slate-500 text-xs">2,500 per GPU</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm mb-1">Batch Size</p>
              <p className="text-slate-900 font-bold text-lg">2</p>
              <p className="text-slate-500 text-xs">Grad Accum: 2</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm mb-1">예상 시간</p>
              <p className="text-slate-900 font-bold text-lg">{calculateETA(status?.gpu0.progress || 0)}</p>
              <p className="text-slate-500 text-xs">3 epochs</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm mb-1">LoRA 파라미터</p>
              <p className="text-slate-900 font-bold text-lg">47.2M</p>
              <p className="text-slate-500 text-xs">Rank: 32, Alpha: 32</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loss Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Loss 히스토리</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="step"
                  label={{ value: 'Step', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  label={{ value: 'Loss', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="loss"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="Loss"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-slate-500">학습 시작 후 Loss 그래프가 표시됩니다</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Rate Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Learning Rate 스케줄</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="step"
                  label={{ value: 'Step', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  label={{ value: 'Learning Rate', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => value.toExponential(1)}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value: any) => value.toExponential(4)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="lr"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Learning Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-slate-500">학습 시작 후 Learning Rate 그래프가 표시됩니다</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>학습 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ConfigSection
              title="모델"
              items={[
                { label: 'Base Model', value: 'Wan2.2-TI2V-5B' },
                { label: 'Parameters', value: '5B' },
                { label: 'LoRA Rank', value: '32' },
                { label: 'LoRA Alpha', value: '32' },
              ]}
            />
            <ConfigSection
              title="학습 파라미터"
              items={[
                { label: 'Epochs', value: '3' },
                { label: 'Batch Size', value: '2 per GPU' },
                { label: 'Gradient Accum', value: '2' },
                { label: 'Learning Rate', value: '1e-4' },
              ]}
            />
            <ConfigSection
              title="하드웨어"
              items={[
                { label: 'GPUs', value: 'V100 32GB × 2' },
                { label: 'NVLink', value: 'No (Sequential)' },
                { label: 'Memory per GPU', value: '~16GB' },
                { label: 'Training Mode', value: 'Parallel (Split Data)' },
              ]}
            />
          </div>
        </CardContent>
      </Card>
    </Layout>
  )
}

function MetricRow({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <p className="text-slate-600 text-xs mb-1">{label}</p>
      <p className="text-slate-900 font-semibold">{value}</p>
    </div>
  )
}

function ConfigSection({ title, items }: { title: string, items: Array<{ label: string, value: string }> }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="text-slate-600">{item.label}</span>
            <span className="text-slate-900 font-mono text-xs">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
