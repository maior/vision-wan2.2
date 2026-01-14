'use client'

import Link from 'next/link'
import Layout from '@/components/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentChartBarIcon,
  BookOpenIcon,
  BeakerIcon,
  EyeIcon,
  ChartBarIcon,
  FolderIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline'

export default function QualityPage() {
  const qualityMetrics = [
    { name: 'Caption Quality', score: 92.5, status: 'good', issues: 1200 },
    { name: 'Metadata Accuracy', score: 87.3, status: 'warning', issues: 4016 },
    { name: 'File Integrity', score: 99.1, status: 'excellent', issues: 180 },
    { name: 'STT Quality', score: 95.7, status: 'good', issues: 85 },
  ]

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Data Quality Validation</h1>
        <p className="text-sm text-slate-600 mt-1">Automated quality inspection and reports</p>
      </div>

      {/* Overall Quality Score */}
      <Card className="mb-8 border-success-200 bg-success-50">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-success-100 rounded-full mb-4">
              <CheckCircleIcon className="w-12 h-12 text-success-600" />
            </div>
            <h2 className="text-slate-700 text-lg mb-2">Overall Quality Score</h2>
            <div className="text-success-900 text-6xl font-bold mb-2">93.7%</div>
            <p className="text-success-700">199,994 samples validated</p>
          </div>

          <div className="flex justify-center gap-4">
            <Link href="/quality/analysis">
              <Button variant="primary" className="flex items-center gap-2">
                <DocumentChartBarIcon className="w-5 h-5" />
                Quality Analysis Report (RAPA 2025)
              </Button>
            </Link>
            <Link href="/quality/methodology">
              <Button variant="ghost" className="flex items-center gap-2">
                <BookOpenIcon className="w-5 h-5" />
                Quality Evaluation Methodology
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {qualityMetrics.map((metric, idx) => (
          <Card key={idx}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-900">{metric.name}</h3>
                <Badge variant={
                  metric.status === 'excellent' ? 'success' :
                  metric.status === 'good' ? 'info' : 'warning'
                }>
                  {metric.status === 'excellent' ? 'Excellent' : metric.status === 'good' ? 'Good' : 'Warning'}
                </Badge>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-slate-600 text-sm mb-2">
                  <span>Score</span>
                  <span className="font-semibold">{metric.score}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      metric.score >= 95 ? 'bg-success-500' :
                      metric.score >= 90 ? 'bg-primary-500' :
                      'bg-warning-500'
                    }`}
                    style={{ width: `${metric.score}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-slate-600 text-sm">
                Issues found: <span className="font-semibold text-warning-600">{metric.issues.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Validation Tools */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Validation Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-200 rounded-lg p-6">
              <div className="p-3 bg-primary-50 rounded-lg w-fit mb-4">
                <BeakerIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-900">Automated Quality Validation</h3>
              <p className="text-slate-600 text-sm mb-4">Run automated quality checks on all data</p>
              <code className="text-xs bg-slate-100 px-3 py-2 rounded text-primary-600 block overflow-x-auto">
                python validate_data_quality.py --sample_size 10
              </code>
            </div>
            <div className="border border-slate-200 rounded-lg p-6">
              <div className="p-3 bg-primary-50 rounded-lg w-fit mb-4">
                <EyeIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-900">Visual Validation</h3>
              <p className="text-slate-600 text-sm mb-4">Visually inspect sample data and captions</p>
              <code className="text-xs bg-slate-100 px-3 py-2 rounded text-primary-600 block overflow-x-auto">
                python inspect_samples.py --num_samples 50
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Common Issues */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Key Findings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-warning-500 bg-warning-50 rounded-r-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-slate-900">Resolution Mismatch</h4>
                <span className="text-slate-600 text-sm">155,495 cases</span>
              </div>
              <p className="text-slate-600 text-sm mb-2">77.78% of data is 1920×1080 resolution (not supported by Wan2.2)</p>
              <div className="flex items-start gap-2 text-primary-600 text-sm">
                <LightBulbIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Convert to 1280×720 using preprocess_resize.py</span>
              </div>
            </div>

            <div className="border-l-4 border-primary-500 bg-primary-50 rounded-r-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-slate-900">Caption Length Variation</h4>
                <span className="text-slate-600 text-sm">1,200 cases</span>
              </div>
              <p className="text-slate-600 text-sm mb-2">Some captions are outside recommended length (50-200 characters)</p>
              <div className="flex items-start gap-2 text-primary-600 text-sm">
                <LightBulbIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Run caption normalization script recommended</span>
              </div>
            </div>

            <div className="border-l-4 border-warning-500 bg-warning-50 rounded-r-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-slate-900">Missing Metadata</h4>
                <span className="text-slate-600 text-sm">4,016 cases</span>
              </div>
              <p className="text-slate-600 text-sm mb-2">Samples with missing category or keyword information</p>
              <div className="flex items-start gap-2 text-primary-600 text-sm">
                <LightBulbIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Manual review and completion required</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Button variant="primary" className="flex items-center justify-center gap-2">
          <BeakerIcon className="w-5 h-5" />
          Run Auto Validation
        </Button>
        <Link href="/quality/report">
          <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
            <ChartBarIcon className="w-5 h-5" />
            Generate Detailed Report
          </Button>
        </Link>
        <Link href="/data">
          <Button variant="ghost" className="w-full flex items-center justify-center gap-2">
            <FolderIcon className="w-5 h-5" />
            Manage Data
          </Button>
        </Link>
      </div>
    </Layout>
  )
}
