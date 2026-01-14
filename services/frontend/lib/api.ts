/**
 * API 클라이언트
 */

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7010';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dashboard 통계
export const getDashboardStats = async () => {
  const response = await apiClient.get('/api/statistics/dashboard');
  return response.data;
};

// 데이터 샘플 목록
export const getDataSamples = async (params: any) => {
  const response = await apiClient.get('/api/data/samples', { params });
  return response.data;
};

// 전처리 작업 목록
export const getPreprocessingJobs = async () => {
  const response = await apiClient.get('/api/preprocessing/jobs');
  return response.data;
};

// 전처리 작업 생성
export const createPreprocessingJob = async (jobType: string) => {
  const response = await apiClient.post('/api/preprocessing/jobs', { job_type: jobType });
  return response.data;
};

// 품질 리포트
export const getQualityReports = async () => {
  const response = await apiClient.get('/api/quality/reports');
  return response.data;
};

// 품질 요약
export const getQualitySummary = async () => {
  const response = await apiClient.get('/api/quality/summary');
  return response.data;
};

// 통계 - 해상도
export const getResolutionStats = async () => {
  const response = await apiClient.get('/api/statistics/resolution');
  return response.data;
};

// 통계 - 카테고리
export const getCategoryStats = async () => {
  const response = await apiClient.get('/api/statistics/category');
  return response.data;
};

// RAPA 2025 품질 분석
export const getQualityAnalysis = async () => {
  const response = await apiClient.get('/api/validation/quality-analysis');
  return response.data;
};

// 샘플 데이터 조회
export const getSamples = async (params?: { skip?: number; limit?: number; category?: string }) => {
  const response = await apiClient.get('/api/validation/samples', { params });
  return response.data;
};

// 개선 가이드
export const getImprovementGuide = async () => {
  const response = await apiClient.get('/api/validation/improvement-guide');
  return response.data;
};

// Caption 품질 분석
export const getCaptionQualityAnalysis = async () => {
  const response = await apiClient.get('/api/caption-quality/analysis');
  return response.data;
};

// Caption 샘플
export const getCaptionSamples = async (count: number = 5) => {
  const response = await apiClient.get(`/api/caption-quality/samples?count=${count}`);
  return response.data;
};

// Caption 개선 권장사항
export const getCaptionRecommendations = async () => {
  const response = await apiClient.get('/api/caption-quality/recommendations');
  return response.data;
};

// Caption 개선 실증 데모 (의사결정자용)
export const getCaptionImprovementDemo = async () => {
  const response = await apiClient.get('/api/caption-improvement/demo');
  return response.data;
};

// 전처리 완료 상태 조회
export const getPreprocessingStatus = async () => {
  const response = await apiClient.get('/api/preprocessing/status');
  return response.data;
};

// 통계 분석 - 기본 통계
export const getBasicStatistics = async () => {
  const response = await apiClient.get('/api/statistics/basic');
  return response.data;
};

// 통계 분석 - 고급 통계 (TTR, 상관관계)
export const getAdvancedStatistics = async () => {
  const response = await apiClient.get('/api/statistics/advanced');
  return response.data;
};

// 상세 이슈 분석 (이유와 해결방안 포함)
export const getDetailedIssues = async () => {
  const response = await apiClient.get('/api/statistics/issues/detailed');
  return response.data;
};

// 샘플 데이터 전체 조회
export const getSampleData = async (clipId: string) => {
  const response = await apiClient.get(`/api/statistics/sample/${clipId}`);
  return response.data;
};

// 샘플 미디어 파일 URL 가져오기
export const getMediaUrl = (clipId: string): string => {
  return `${API_BASE_URL}/api/statistics/media/${clipId}`;
};

// 원본 미디어 파일 URL 가져오기
export const getOriginalMediaUrl = (clipId: string): string => {
  return `${API_BASE_URL}/api/statistics/media/original/${clipId}`;
};

// 모델 분석
export const getModelAnalysis = async () => {
  const response = await apiClient.get('/api/model/analysis');
  return response.data;
};

// 학습 설정
export const getTrainingConfig = async () => {
  const response = await apiClient.get('/api/model/training-config');
  return response.data;
};

// 검증 데이터 변환 진행 상황
export const getConversionProgress = async () => {
  const response = await apiClient.get('/api/preprocessing/conversion-progress');
  return response.data;
};

// LoRA 추론 결과
export const getInferenceResults = async () => {
  const response = await apiClient.get('/api/inference/results');
  return response.data;
};

// LoRA 추론 상태
export const getInferenceStatus = async () => {
  const response = await apiClient.get('/api/inference/status');
  return response.data;
};

// 데이터 품질 검증 보고서
export const getValidationReport = async () => {
  const response = await apiClient.get('/api/statistics/validation-report');
  return response.data;
};

export default apiClient;
