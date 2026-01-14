'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const routeNames: { [key: string]: string } = {
  '': '대시보드',
  'data': '데이터',
  'quality': '품질',
  'analysis': '품질 분석',
  'methodology': '평가 방법론',
  'preprocessing': '전처리',
  'setup': 'V100 설정',
  'training': '학습',
  'results': '결과'
}

export default function Breadcrumb() {
  const pathname = usePathname()
  const pathSegments = pathname.split('/').filter(segment => segment)

  if (pathname === '/') {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="text-blue-400">📊 대시보드</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Link href="/" className="text-gray-400 hover:text-blue-400 transition">
        📊 대시보드
      </Link>

      {pathSegments.map((segment, index) => {
        const path = '/' + pathSegments.slice(0, index + 1).join('/')
        const isLast = index === pathSegments.length - 1
        const name = routeNames[segment] || segment

        return (
          <div key={path} className="flex items-center gap-2">
            <span className="text-gray-600">/</span>
            {isLast ? (
              <span className="text-blue-400 font-semibold">{name}</span>
            ) : (
              <Link href={path} className="text-gray-400 hover:text-blue-400 transition">
                {name}
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )
}
