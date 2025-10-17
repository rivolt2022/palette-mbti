/* eslint-disable prettier/prettier */
/**
 * 얼굴 이미지에서 색상 팔레트를 추천하는 예측기
 * FaceAPI.js와 커스텀 색상 추천 모델을 사용합니다.
 */

import { ColorPalette } from '../ColorMLUtils';
import { ColorPredictor } from './ColorPredictor';
import { FaceApiManager } from './FaceApiManager';
import { FaceLandmarks } from './FaceFeatureExtractor';
import { 
  FaceDetection, 
  FaceAnalysisResult, 
  ColorRecommendationResult 
} from './types';

export class FaceColorPredictor {
  private faceApiManager: FaceApiManager;

  private colorPredictor: ColorPredictor;

  constructor() {
    this.faceApiManager = new FaceApiManager();
    this.colorPredictor = new ColorPredictor();
  }

  /**
   * 모든 모델을 로드합니다.
   */
  async loadAllModels(): Promise<void> {
    await Promise.all([
      this.faceApiManager.loadFaceApiModels(),
      this.colorPredictor.loadFaceColorModel()
    ]);
  }

  /**
   * 얼굴 이미지에서 감정과 특징을 분석합니다.
   */
  async analyzeFace(
    imageElement: HTMLImageElement | HTMLCanvasElement
  ): Promise<FaceAnalysisResult> {
    return this.faceApiManager.analyzeFace(imageElement);
  }

  /**
   * 얼굴 특징 벡터에서 색상 팔레트를 예측합니다.
   */
  async predictColorFromFace(
    faceDescriptor: Float32Array,
    landmarks?: FaceLandmarks | null,
    randomSeed?: number[],
    emotion?: string
  ): Promise<{ palette: ColorPalette; reason?: any }> {
    return this.colorPredictor.predictColorFromFace(
      faceDescriptor,
      landmarks,
      randomSeed,
      emotion
    );
  }

  /**
   * 이미지에서 얼굴을 분석하고 색상 팔레트를 추천합니다.
   */
  async recommendColorsFromImage(
    imageElement: HTMLImageElement | HTMLCanvasElement
  ): Promise<ColorRecommendationResult> {
    try {
      // 1. 얼굴 분석
      const faceAnalysis = await this.analyzeFace(imageElement);

      if (!faceAnalysis.faceDescriptor) {
        throw new Error('얼굴 특징을 추출할 수 없습니다.');
      }

      // 2. 색상 팔레트 예측
      const predictionResult = await this.predictColorFromFace(
        faceAnalysis.faceDescriptor,
        faceAnalysis.landmarks,
        undefined,
        faceAnalysis.emotion
      );

      return {
        palette: predictionResult.palette,
        emotion: faceAnalysis.emotion,
        confidence: faceAnalysis.confidence,
        analysis: faceAnalysis,
        reason: predictionResult.reason,
      };
    } catch (error) {
      console.error('색상 추천 실패:', error);
      throw error;
    }
  }

  /**
   * 이미지 전처리 (얼굴 검출 개선을 위해)
   */
  private preprocessImage(imageElement: HTMLImageElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context를 생성할 수 없습니다.');
    }

    // 이미지 크기 조정 (얼굴 검출에 최적화)
    const maxSize = 512;
    let { width, height } = imageElement;

    if (width > height) {
      if (width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      }
    } else if (height > maxSize) {
      width = (width * maxSize) / height;
      height = maxSize;
    }

    canvas.width = width;
    canvas.height = height;

    // Canvas 최적화 설정
    canvas.setAttribute('willReadFrequently', 'true');

    // 이미지 그리기
    ctx.drawImage(imageElement, 0, 0, width, height);

    return canvas;
  }

  /**
   * 이미지 파일을 로드하고 분석합니다.
   */
  async recommendColorsFromFile(
    file: File
  ): Promise<ColorRecommendationResult> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = async () => {
        try {
          // 이미지 전처리
          const processedCanvas = this.preprocessImage(img);
          const result = await this.recommendColorsFromImage(processedCanvas);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('이미지 파일을 로드할 수 없습니다.'));
      };

      // 이미지 로드
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * 한 얼굴에서 여러 색상 팔레트를 생성합니다.
   */
  async predictMultipleVariations(
    faceDescriptor: Float32Array,
    landmarks: FaceLandmarks | null,
    count: number = 5,
    emotion?: string
  ): Promise<ColorPalette[]> {
    return this.colorPredictor.predictMultipleVariations(
          faceDescriptor,
          landmarks,
      count,
          emotion
        );
  }

  /**
   * 이미지에서 여러 색상 팔레트를 생성합니다.
   */
  async recommendMultipleColorsFromImage(
    imageElement: HTMLImageElement | HTMLCanvasElement,
    count: number = 5
  ): Promise<{
    palettes: ColorPalette[];
    emotion: string;
    confidence: number;
    analysis: FaceAnalysisResult;
  }> {
    try {
      // 1. 얼굴 분석
      const faceAnalysis = await this.analyzeFace(imageElement);

      if (!faceAnalysis.faceDescriptor) {
        throw new Error('얼굴 특징을 추출할 수 없습니다.');
      }

      // 2. 여러 색상 팔레트 예측
      const palettes = await this.predictMultipleVariations(
        faceAnalysis.faceDescriptor,
        faceAnalysis.landmarks,
        count,
        faceAnalysis.emotion
      );

      return {
        palettes,
        emotion: faceAnalysis.emotion,
        confidence: faceAnalysis.confidence,
        analysis: faceAnalysis,
      };
    } catch (error) {
      console.error('다중 색상 추천 실패:', error);
      throw error;
    }
  }

  /**
   * 모델 상태를 확인합니다.
   */
  getModelStatus(): {
    isFaceApiLoaded: boolean;
    isFaceColorModelLoaded: boolean;
    isAllLoaded: boolean;
  } {
    return {
      isFaceApiLoaded: this.faceApiManager.getModelStatus(),
      isFaceColorModelLoaded: this.colorPredictor.getModelStatus(),
      isAllLoaded: this.faceApiManager.getModelStatus() && this.colorPredictor.getModelStatus(),
    };
  }

  /**
   * 모델을 언로드하여 메모리를 정리합니다.
   */
  dispose(): void {
    this.faceApiManager.dispose();
    this.colorPredictor.dispose();
  }
}

// 싱글톤 인스턴스
export const faceColorPredictor = new FaceColorPredictor();

// 타입들도 export
export type { FaceDetection, FaceAnalysisResult, ColorRecommendationResult };