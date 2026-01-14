'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { getSamples } from '@/lib/api'
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

interface Sample {
  clip_id: string
  media_type: string
  file_path: string
  caption: string
  resolution: string
  length: string
  category: string
  keyword: string
}

export default function SamplesPage() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [category, setCategory] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const limit = 20

  useEffect(() => {
    fetchSamples()
  }, [page, category])

  const fetchSamples = async () => {
    setLoading(true)
    try {
      const data = await getSamples({ skip: page * limit, limit, category })
      setSamples(data.samples)
      setTotal(data.total)
    } catch (error) {
      console.error('Failed to fetch samples:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">샘플 데이터 조회</h1>
        <p className="text-sm text-slate-600 mt-1">데이터셋 샘플 검색 및 미리보기</p>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MagnifyingGlassIcon className="w-5 h-5" />
            필터
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => { setCategory(undefined); setPage(0) }}
              variant={category === undefined ? 'primary' : 'ghost'}
              size="sm"
            >
              전체
            </Button>
            {['뉴스', '드라마', '예능', '다큐멘터리', '스포츠'].map((cat) => (
              <Button
                key={cat}
                onClick={() => { setCategory(cat); setPage(0) }}
                variant={category === cat ? 'primary' : 'ghost'}
                size="sm"
              >
                {cat}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card className="mb-8 border-2 border-blue-600">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">총 {total.toLocaleString()}개 샘플</h2>
              <p className="text-slate-600">
                {category ? `카테고리: ${category}` : '전체 데이터'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Samples Table */}
      <Card className="mb-8">
        {loading ? (
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">로딩 중...</p>
            </div>
          </CardContent>
        ) : (
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left p-4 text-slate-900 font-bold">Clip ID</th>
                    <th className="text-left p-4 text-slate-900 font-bold">타입</th>
                    <th className="text-left p-4 text-slate-900 font-bold">캡션 미리보기</th>
                    <th className="text-left p-4 text-slate-900 font-bold">해상도</th>
                    <th className="text-left p-4 text-slate-900 font-bold">길이</th>
                    <th className="text-left p-4 text-slate-900 font-bold">카테고리</th>
                  </tr>
                </thead>
                <tbody>
                  {samples.map((sample, idx) => (
                    <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition">
                      <td className="p-4 text-slate-900 font-mono text-sm">{sample.clip_id}</td>
                      <td className="p-4">
                        <Badge variant={sample.media_type === 'video' ? 'info' : 'success'}>
                          {sample.media_type}
                        </Badge>
                      </td>
                      <td className="p-4 text-slate-700 text-sm max-w-md">
                        <div className="truncate">{sample.caption}</div>
                      </td>
                      <td className="p-4 text-slate-700 font-mono text-sm">{sample.resolution}</td>
                      <td className="p-4 text-slate-700 text-sm">{sample.length}</td>
                      <td className="p-4 text-slate-700 text-sm">{sample.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Pagination */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-slate-700">
              페이지 {page + 1} / {totalPages} (전체 {total.toLocaleString()}개)
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                variant="secondary"
                size="sm"
              >
                <ChevronLeftIcon className="w-4 h-4 mr-1" />
                이전
              </Button>
              <Button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                variant="secondary"
                size="sm"
              >
                다음
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Layout>
  )
}
