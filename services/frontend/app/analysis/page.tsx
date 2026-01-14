'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';

interface AssociationRule {
  antecedents: string[];
  consequents: string[];
  support: number;
  confidence: number;
  lift: number;
}

interface ClusterData {
  cluster_id: number;
  count: number;
  percentage: number;
  description?: string;
  top_keywords?: Array<{keyword: string; count: number}>;
}

export default function DataAnalysisPage() {
  const [rules, setRules] = useState<AssociationRule[]>([]);
  const [clusters, setClusters] = useState<ClusterData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7010';

        const rulesRes = await fetch(`${API_URL}/api/analysis/association-rules`);
        const rulesData = await rulesRes.json();
        setRules(rulesData.rules || []);

        const samplingRes = await fetch(`${API_URL}/api/analysis/sampling-results`);
        const samplingData = await samplingRes.json();
        setClusters(samplingData.cluster_distribution || []);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching analysis data:', error);
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">Loading analysis data...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">데이터 분석 대시보드</h1>
        <p className="text-gray-600">명사 기반 연관규칙 분석 및 다양성 샘플링 결과</p>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">발견된 연관규칙</div>
          <div className="text-3xl font-bold text-indigo-600">{rules.length}</div>
          <div className="text-xs text-gray-500 mt-1">명사 기반 패턴</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">선택된 샘플</div>
          <div className="text-3xl font-bold text-green-600">50,000</div>
          <div className="text-xs text-gray-500 mt-1">전체 170K 중 29.4%</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">최고 Lift 값</div>
          <div className="text-3xl font-bold text-purple-600">{rules.length > 0 ? rules[0].lift.toFixed(2) : '-'}</div>
          <div className="text-xs text-gray-500 mt-1">강한 연관성</div>
        </div>
      </div>

      {/* 연관규칙 테이블 */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Top 10 연관규칙 (Lift 기준)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Antecedents</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consequents</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Support</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lift</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rules.slice(0, 10).map((rule, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rule.antecedents.join(', ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rule.consequents.join(', ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rule.support.toFixed(3)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rule.confidence.toFixed(3)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">
                    {rule.lift.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 샘플링 방법 설명 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">다양성 기반 샘플링</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4">
            전체 170,180개 데이터에서 50,000개를 선택할 때, <strong>균형잡힌 다양성</strong>을 확보하기 위해 클러스터링 기반 샘플링을 사용했습니다.
          </p>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 mb-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">샘플링 과정</h3>
            <ol className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-bold mr-3 flex-shrink-0 mt-0.5">1</span>
                <div>
                  <strong>TF-IDF 벡터화</strong>: 각 비디오의 캡션에서 의미적 특징을 추출합니다
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-bold mr-3 flex-shrink-0 mt-0.5">2</span>
                <div>
                  <strong>K-Means 클러스터링</strong>: 유사한 의미를 가진 비디오들을 15개 그룹으로 분류합니다
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-bold mr-3 flex-shrink-0 mt-0.5">3</span>
                <div>
                  <strong>균등 샘플링</strong>: 각 클러스터에서 비율에 맞게 샘플을 선택하여 다양성을 보장합니다
                </div>
              </li>
            </ol>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-2">전체 데이터</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">170,180</div>
              <div className="text-xs text-gray-500">개 샘플</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
              <div className="text-sm text-green-700 mb-2">선택된 샘플</div>
              <div className="text-4xl font-bold text-green-600 mb-1">50,000</div>
              <div className="text-xs text-green-600">개 샘플 (29.4%)</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
