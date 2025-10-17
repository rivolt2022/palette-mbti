/**
 * 얼굴 색상 예측 관련 타입 정의
 */

import { ColorPalette } from '../ColorMLUtils';
import { ColorExtractionReason } from './ColorReasonGenerator';
import { FaceLandmarks } from './FaceFeatureExtractor';

export interface FaceDetection {
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  score: number;
}

export interface FaceAnalysisResult {
  emotion: string;
  confidence: number;
  faceDescriptor: Float32Array | null;
  landmarks: FaceLandmarks | null;
  boundingBox: FaceDetection | null;
}

export interface ColorRecommendationResult {
  palette: ColorPalette;
  emotion: string;
  confidence: number;
  analysis: FaceAnalysisResult;
  reason?: ColorExtractionReason; // 색상 추출 근거 정보
}
