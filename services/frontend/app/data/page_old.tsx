'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function DataPage() {
  const [dataStats, setDataStats] = useState({
    total: 199994,
    videos: 100000,
    images: 99994,
    preprocessed: 199994,
    trainSplit: 179994,
    valSplit: 20000,
    testSplit: 100
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <header className="bg-black bg-opacity-50 backdrop-blur-lg border-b border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-white transition">
              ← 돌아가기
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">📦 데이터 관리</h1>
              <p className="text-gray-400 mt-1">MBC Dataset - 원본 및 전처리 데이터</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Data Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <DataCard
            title="전체 데이터"
            value={dataStats.total.toLocaleString()}
            subtitle="MBC 원본 데이터"
            icon="📦"
            color="blue"
          />
          <DataCard
            title="비디오"
            value={dataStats.videos.toLocaleString()}
            subtitle="MP4 파일"
            icon="🎬"
            color="purple"
          />
          <DataCard
            title="이미지"
            value={dataStats.images.toLocaleString()}
            subtitle="JPG/PNG 파일"
            icon="🖼️"
            color="green"
          />
        </div>

        {/* Dataset Split */}
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">데이터셋 분할</h2>

          <div className="space-y-6">
            <SplitRow
              label="학습 데이터 (90%)"
              count={dataStats.trainSplit}
              total={dataStats.total}
              color="blue"
            />
            <SplitRow
              label="검증 데이터 (10%)"
              count={dataStats.valSplit}
              total={dataStats.total}
              color="green"
            />
            <SplitRow
              label="오버피팅 테스트 데이터"
              count={dataStats.testSplit}
              total={dataStats.total}
              color="yellow"
            />
          </div>
        </div>

        {/* File Locations */}
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">파일 위치</h2>

          <div className="space-y-4">
            <FileLocation
              label="원본 데이터"
              path="/home/devfit2/mbc_json/"
              description="JSON 메타데이터 + 미디어 파일"
              icon="📁"
            />
            <FileLocation
              label="전처리된 데이터"
              path="./preprocessed_data/"
              description="CSV 형식 메타데이터"
              icon="📄"
            />
            <FileLocation
              label="학습 데이터"
              path="./preprocessed_data/all_train.csv"
              description="179,994 samples"
              icon="🎯"
            />
            <FileLocation
              label="검증 데이터"
              path="./preprocessed_data/all_val.csv"
              description="20,000 samples"
              icon="✓"
            />
            <FileLocation
              label="테스트 데이터"
              path="./preprocessed_data/test_100.csv"
              description="100 samples (균형 샘플링)"
              icon="🧪"
            />
          </div>
        </div>

        {/* Data Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700 p-8">
            <h3 className="text-xl font-bold text-white mb-4">해상도 분포</h3>
            <div className="space-y-3">
              <ResolutionBar label="1920×1080" percentage={77.78} color="blue" />
              <ResolutionBar label="1280×720" percentage={5.86} color="green" />
              <ResolutionBar label="기타" percentage={16.36} color="gray" />
            </div>
            <p className="text-yellow-400 text-sm mt-4">
              ⚠️ 77.78%는 1920×1080 (Wan2.2 미지원) - 전처리 필요
            </p>
          </div>

          <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700 p-8">
            <h3 className="text-xl font-bold text-white mb-4">카테고리 분포</h3>
            <div className="space-y-3">
              <CategoryBar label="드라마" count={45231} color="purple" />
              <CategoryBar label="예능" count={38492} color="pink" />
              <CategoryBar label="뉴스" count={32441} color="blue" />
              <CategoryBar label="다큐" count={28330} color="green" />
              <CategoryBar label="기타" count={55500} color="gray" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/preprocessing">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition shadow-lg">
              ⚙️ 전처리 시작하기
            </button>
          </Link>
          <Link href="/quality">
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl transition shadow-lg">
              🔍 품질 검증하기
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function DataCard({ title, value, subtitle, icon, color }: any) {
  const colorClasses: any = {
    blue: 'from-blue-600 to-blue-800',
    green: 'from-green-600 to-green-800',
    purple: 'from-purple-600 to-purple-800',
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl shadow-lg p-6`}>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-white text-sm font-medium mb-2">{title}</h3>
      <p className="text-white text-3xl font-bold mb-1">{value}</p>
      <p className="text-white text-opacity-70 text-xs">{subtitle}</p>
    </div>
  )
}

function SplitRow({ label, count, total, color }: any) {
  const percentage = (count / total * 100).toFixed(2)
  const colorClasses: any = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
  }

  return (
    <div>
      <div className="flex justify-between text-white mb-2">
        <span>{label}</span>
        <span className="font-mono">{count.toLocaleString()} ({percentage}%)</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3">
        <div
          className={`${colorClasses[color]} h-3 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}

function FileLocation({ label, path, description, icon }: any) {
  return (
    <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4">
      <div className="flex items-start gap-4">
        <div className="text-3xl">{icon}</div>
        <div className="flex-1">
          <h4 className="text-white font-semibold mb-1">{label}</h4>
          <code className="text-blue-400 text-sm bg-gray-900 px-2 py-1 rounded">{path}</code>
          <p className="text-gray-400 text-sm mt-2">{description}</p>
        </div>
      </div>
    </div>
  )
}

function ResolutionBar({ label, percentage, color }: any) {
  const colorClasses: any = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    gray: 'bg-gray-500',
  }

  return (
    <div>
      <div className="flex justify-between text-gray-300 text-sm mb-1">
        <span>{label}</span>
        <span>{percentage.toFixed(2)}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className={`${colorClasses[color]} h-2 rounded-full`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}

function CategoryBar({ label, count, color }: any) {
  const colorClasses: any = {
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    gray: 'bg-gray-500',
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1">
        <div className={`w-3 h-3 rounded-full ${colorClasses[color]}`}></div>
        <span className="text-gray-300 text-sm">{label}</span>
      </div>
      <span className="text-white font-semibold">{count.toLocaleString()}</span>
    </div>
  )
}
