'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { getValidationReport } from '@/lib/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

export default function ValidationReportPage() {
  const [reportContent, setReportContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true)
        const data = await getValidationReport()
        setReportContent(data.content)
      } catch (err) {
        console.error('Failed to fetch validation report:', err)
        setError('보고서를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-600">보고서를 불러오는 중...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-error-500 text-5xl mb-4">⚠️</div>
            <p className="text-slate-900 font-semibold mb-2">오류 발생</p>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">데이터 품질 검증 보고서</h1>
        <p className="text-sm text-slate-600 mt-1">
          bad.pdf에 기록된 불량 케이스의 원본 데이터 분석 결과
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="prose prose-slate max-w-none p-8">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                // 테이블 스타일링
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-6">
                    <table className="min-w-full divide-y divide-slate-300 border border-slate-300" {...props} />
                  </div>
                ),
                thead: ({ node, ...props }) => (
                  <thead className="bg-slate-100" {...props} />
                ),
                th: ({ node, ...props }) => (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-300" {...props} />
                ),
                td: ({ node, ...props }) => (
                  <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-200" {...props} />
                ),
                // 코드 블록 스타일링
                code: ({ node, inline, ...props }: any) =>
                  inline ? (
                    <code className="px-1.5 py-0.5 bg-slate-100 text-slate-900 rounded text-sm font-mono" {...props} />
                  ) : (
                    <code className="block px-4 py-3 bg-slate-900 text-slate-100 rounded-lg text-sm font-mono overflow-x-auto" {...props} />
                  ),
                pre: ({ node, ...props }) => (
                  <pre className="my-4 rounded-lg overflow-hidden" {...props} />
                ),
                // 헤딩 스타일링
                h1: ({ node, ...props }) => (
                  <h1 className="text-3xl font-bold text-slate-900 mt-8 mb-4 pb-2 border-b-2 border-slate-300" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-2xl font-bold text-slate-900 mt-6 mb-3 pb-2 border-b border-slate-200" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-xl font-semibold text-slate-900 mt-5 mb-2" {...props} />
                ),
                h4: ({ node, ...props }) => (
                  <h4 className="text-lg font-semibold text-slate-800 mt-4 mb-2" {...props} />
                ),
                // 리스트 스타일링
                ul: ({ node, ...props }) => (
                  <ul className="my-4 ml-6 list-disc space-y-2 text-slate-700" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="my-4 ml-6 list-decimal space-y-2 text-slate-700" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="text-slate-700" {...props} />
                ),
                // 인용구 스타일링
                blockquote: ({ node, ...props }) => (
                  <blockquote className="my-4 pl-4 border-l-4 border-primary-500 bg-primary-50 py-2 pr-4 italic text-slate-700" {...props} />
                ),
                // 수평선
                hr: ({ node, ...props }) => (
                  <hr className="my-8 border-t-2 border-slate-200" {...props} />
                ),
                // 링크 스타일링
                a: ({ node, ...props }) => (
                  <a className="text-primary-600 hover:text-primary-700 underline" {...props} />
                ),
                // 강조 텍스트
                strong: ({ node, ...props }) => (
                  <strong className="font-bold text-slate-900" {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em className="italic text-slate-700" {...props} />
                ),
                // 체크 아이콘 처리
                p: ({ node, children, ...props }) => {
                  const text = String(children)
                  if (text.includes('✅')) {
                    return <p className="text-success-700 my-2" {...props}>{children}</p>
                  }
                  if (text.includes('❌')) {
                    return <p className="text-error-700 my-2" {...props}>{children}</p>
                  }
                  if (text.includes('⚠️')) {
                    return <p className="text-warning-700 my-2" {...props}>{children}</p>
                  }
                  return <p className="my-3 text-slate-700 leading-relaxed" {...props}>{children}</p>
                },
              }}
            >
              {reportContent}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    </Layout>
  )
}
