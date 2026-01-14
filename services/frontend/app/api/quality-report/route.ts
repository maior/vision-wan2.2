import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // services/frontend에서 ../../로 올라가서 Wan2.2로
    const filePath = path.join(process.cwd(), '../../QUALITY_ASSESSMENT_REPORT.md')

    // 파일 존재 확인
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath)
      return NextResponse.json({
        error: 'Report file not found',
        path: filePath
      }, { status: 404 })
    }

    const content = fs.readFileSync(filePath, 'utf-8')

    return NextResponse.json({ content })
  } catch (error: any) {
    console.error('Error reading quality report:', error)
    return NextResponse.json({
      error: 'Failed to load report',
      details: error.message
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
