'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'

interface JSONError {
  clip_id: string
  missing_fields?: string[]
  error?: string
}

interface JSONContent {
  clip_id: string
  file_path: string
  json_path: string
  content?: any
  raw_content?: string
  error?: string
}

export default function JSONErrorsPage() {
  const [schemaErrors, setSchemaErrors] = useState<JSONError[]>([])
  const [parseErrors, setParseErrors] = useState<JSONError[]>([])
  const [totalSchemaErrors, setTotalSchemaErrors] = useState(0)
  const [totalParseErrors, setTotalParseErrors] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null)
  const [jsonContent, setJsonContent] = useState<JSONContent | null>(null)
  const [loadingContent, setLoadingContent] = useState(false)

  // JSON 오류 목록 로드
  useEffect(() => {
    const fetchErrors = async () => {
      try {
        const response = await fetch('http://localhost:7010/api/validation/json-errors?limit=100')
        const data = await response.json()

        setSchemaErrors(data.schema_errors || [])
        setParseErrors(data.parse_errors || [])
        setTotalSchemaErrors(data.total_schema_errors || 0)
        setTotalParseErrors(data.total_parse_errors || 0)
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch JSON errors:', error)
        setLoading(false)
      }
    }

    fetchErrors()
  }, [])

  // JSON 파일 내용 로드
  const loadJsonContent = async (clipId: string) => {
    setSelectedClipId(clipId)
    setLoadingContent(true)

    try {
      const response = await fetch(`http://localhost:7010/api/validation/json-content/${clipId}`)
      const data = await response.json()

      setJsonContent(data)
      setLoadingContent(false)
    } catch (error) {
      console.error('Failed to fetch JSON content:', error)
      setJsonContent(null)
      setLoadingContent(false)
    }
  }

  // 팝업 닫기
  const closePopup = () => {
    setSelectedClipId(null)
    setJsonContent(null)
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-white text-xl">로딩 중...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">❌ JSON 오류 파일 목록</h1>
        <p className="text-gray-200 text-lg">구문 정확성 검증에서 발견된 JSON 오류</p>
      </div>

      {/* 통계 */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-r from-red-900 to-red-800 rounded-xl p-6 border-2 border-red-500">
          <h3 className="text-red-200 text-sm font-semibold mb-2">JSON 스키마 오류</h3>
          <div className="text-white text-4xl font-bold">{totalSchemaErrors.toLocaleString()}개</div>
          <p className="text-red-100 text-sm mt-2">필수 필드 누락 (resolution, caption_info 등)</p>
        </div>
        <div className="bg-gradient-to-r from-orange-900 to-orange-800 rounded-xl p-6 border-2 border-orange-500">
          <h3 className="text-orange-200 text-sm font-semibold mb-2">JSON 파싱 오류</h3>
          <div className="text-white text-4xl font-bold">{totalParseErrors.toLocaleString()}개</div>
          <p className="text-orange-100 text-sm mt-2">JSON 형식 불량</p>
        </div>
      </div>

      {/* 스키마 오류 목록 */}
      {schemaErrors.length > 0 && (
        <div className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border border-gray-600 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            📋 JSON 스키마 오류 (처음 100개)
          </h2>
          <p className="text-gray-300 text-sm mb-6">
            클립 ID를 클릭하면 JSON 파일 내용을 확인할 수 있습니다.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-600 bg-gray-700 bg-opacity-50">
                  <th className="text-left p-4 text-white font-bold">번호</th>
                  <th className="text-left p-4 text-white font-bold">Clip ID</th>
                  <th className="text-left p-4 text-white font-bold">누락된 필드</th>
                  <th className="text-left p-4 text-white font-bold">액션</th>
                </tr>
              </thead>
              <tbody>
                {schemaErrors.map((error, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-700 hover:bg-gray-700 hover:bg-opacity-30 transition"
                  >
                    <td className="p-4 text-gray-300">{idx + 1}</td>
                    <td className="p-4 font-mono text-blue-300">{error.clip_id}</td>
                    <td className="p-4 text-gray-100">
                      {error.missing_fields?.join(', ') || 'N/A'}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => loadJsonContent(error.clip_id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                      >
                        📄 파일 보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {schemaErrors.length < totalSchemaErrors && (
            <div className="mt-6 text-center text-gray-400 text-sm">
              ... 외 {(totalSchemaErrors - schemaErrors.length).toLocaleString()}개 더 있음
            </div>
          )}
        </div>
      )}

      {/* 파싱 오류 목록 */}
      {parseErrors.length > 0 && (
        <div className="bg-gray-800 bg-opacity-70 rounded-xl p-8 border border-orange-600 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            🚨 JSON 파싱 오류 (처음 100개)
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-600 bg-gray-700 bg-opacity-50">
                  <th className="text-left p-4 text-white font-bold">번호</th>
                  <th className="text-left p-4 text-white font-bold">Clip ID</th>
                  <th className="text-left p-4 text-white font-bold">오류 내용</th>
                  <th className="text-left p-4 text-white font-bold">액션</th>
                </tr>
              </thead>
              <tbody>
                {parseErrors.map((error, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-700 hover:bg-gray-700 hover:bg-opacity-30 transition"
                  >
                    <td className="p-4 text-gray-300">{idx + 1}</td>
                    <td className="p-4 font-mono text-orange-300">{error.clip_id}</td>
                    <td className="p-4 text-gray-100 text-xs">{error.error || 'Unknown error'}</td>
                    <td className="p-4">
                      <button
                        onClick={() => loadJsonContent(error.clip_id)}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                      >
                        📄 파일 보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* JSON 내용 팝업 */}
      {selectedClipId && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-8">
          <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-2 border-gray-600">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white">JSON 파일 내용</h3>
                  <p className="text-gray-300 text-sm mt-1">Clip ID: {selectedClipId}</p>
                </div>
                <button
                  onClick={closePopup}
                  className="text-white hover:text-red-400 text-3xl font-bold transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 내용 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {loadingContent ? (
                <div className="text-center text-gray-400 py-12">
                  <div className="text-4xl mb-4">⏳</div>
                  <div>로딩 중...</div>
                </div>
              ) : jsonContent ? (
                <div className="space-y-4">
                  {/* 파일 경로 */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="text-gray-400 text-xs mb-2">비디오 파일</div>
                    <div className="text-white font-mono text-sm break-all">{jsonContent.file_path}</div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="text-gray-400 text-xs mb-2">JSON 파일</div>
                    <div className="text-white font-mono text-sm break-all">{jsonContent.json_path}</div>
                  </div>

                  {/* 오류 메시지 */}
                  {jsonContent.error && (
                    <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-4">
                      <div className="text-red-300 font-bold mb-2">⚠️ 오류</div>
                      <div className="text-red-100 text-sm">{jsonContent.error}</div>
                    </div>
                  )}

                  {/* JSON 내용 */}
                  {jsonContent.content ? (
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-gray-400 text-xs mb-3">JSON 내용</div>
                      <pre className="text-green-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(jsonContent.content, null, 2)}
                      </pre>
                    </div>
                  ) : jsonContent.raw_content ? (
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-gray-400 text-xs mb-3">원본 텍스트 (파싱 불가)</div>
                      <pre className="text-red-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                        {jsonContent.raw_content}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-center py-8">내용이 없습니다.</div>
                  )}
                </div>
              ) : (
                <div className="text-gray-400 text-center py-12">
                  데이터를 불러올 수 없습니다.
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="bg-gray-800 p-4 border-t border-gray-700 flex justify-end">
              <button
                onClick={closePopup}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
