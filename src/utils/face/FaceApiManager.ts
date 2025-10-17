/**
 * FaceAPI.js 모델 관리 및 얼굴 분석 유틸리티
 */

import { FaceAnalysisResult } from './types';

export class FaceApiManager {
  private isFaceApiLoaded: boolean = false;

  private faceapi: any = null;

  /**
   * FaceAPI.js 모델들을 로드합니다.
   */
  async loadFaceApiModels(): Promise<void> {
    if (this.isFaceApiLoaded) return;

    try {
      // 클라이언트 사이드에서만 FaceAPI.js 동적 import
      if (typeof window === 'undefined') {
        throw new Error(
          'FaceAPI.js는 클라이언트 사이드에서만 사용할 수 있습니다.'
        );
      }

      // FaceAPI.js 동적 import
      const faceapiModule = await import('@vladmandic/face-api');
      this.faceapi = faceapiModule;

      // 로컬 모델 파일 경로 설정
      const modelPath = '/models/face-api';

      // 필요한 모델들 로드
      await Promise.all([
        this.faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
        this.faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
        this.faceapi.nets.faceRecognitionNet.loadFromUri(modelPath),
        this.faceapi.nets.faceExpressionNet.loadFromUri(modelPath),
      ]);

      this.isFaceApiLoaded = true;
      console.log('✅ FaceAPI.js 모델 로드 완료');
    } catch (error) {
      console.error('❌ FaceAPI.js 모델 로드 실패:', error);
      throw new Error('얼굴 인식 모델을 로드할 수 없습니다.');
    }
  }

  /**
   * 얼굴 이미지에서 감정과 특징을 분석합니다.
   */
  async analyzeFace(
    imageElement: HTMLImageElement | HTMLCanvasElement
  ): Promise<FaceAnalysisResult> {
    if (!this.isFaceApiLoaded) {
      await this.loadFaceApiModels();
    }

    if (!this.faceapi) {
      throw new Error('FaceAPI.js가 로드되지 않았습니다.');
    }

    try {
      // 얼굴 검출 (더 관대한 설정 사용)
      const detectionOptions = new this.faceapi.TinyFaceDetectorOptions({
        inputSize: 320, // 더 큰 입력 크기
        scoreThreshold: 0.3, // 더 낮은 임계값 (기본값: 0.5)
      });

      const detections = await this.faceapi
        .detectAllFaces(imageElement, detectionOptions)
        .withFaceLandmarks()
        .withFaceExpressions()
        .withFaceDescriptors();

      console.log(`얼굴 검출 결과: ${detections.length}개 얼굴 발견`);

      if (detections.length === 0) {
        // 다른 설정으로 재시도
        console.log('기본 설정으로 얼굴을 찾지 못함. 다른 설정으로 재시도...');

        const alternativeOptions = new this.faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.1,
        });

        const alternativeDetections = await this.faceapi
          .detectAllFaces(imageElement, alternativeOptions)
          .withFaceLandmarks()
          .withFaceExpressions()
          .withFaceDescriptors();

        console.log(
          `대안 설정으로 얼굴 검출 결과: ${alternativeDetections.length}개 얼굴 발견`
        );

        if (alternativeDetections.length === 0) {
          throw new Error(
            '얼굴을 찾을 수 없습니다. 더 명확한 얼굴 사진을 업로드해주세요.'
          );
        }

        // 대안 검출 결과 사용
        const detection = alternativeDetections[0];
        return this.processDetection(detection);
      }

      // 첫 번째 얼굴 사용
      const detection = detections[0];
      return this.processDetection(detection);
    } catch (error) {
      console.error('얼굴 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 검출된 얼굴 정보를 처리합니다.
   */
  private processDetection(detection: any): FaceAnalysisResult {
    // 상세 로그 출력
    console.log('🔍 얼굴 분석 상세 정보:');
    console.log('📊 얼굴 descriptor:', {
      length: detection.descriptor.length,
      first10: Array.from(detection.descriptor).slice(0, 10),
      min: Math.min(...detection.descriptor),
      max: Math.max(...detection.descriptor),
      mean:
        detection.descriptor.reduce((a: number, b: number) => a + b, 0) /
        detection.descriptor.length,
    });

    console.log('🎭 감정 분석 결과:', detection.expressions);

    if (detection.landmarks) {
      console.log('📍 랜드마크 정보:', {
        count: detection.landmarks.positions.length,
        first5: detection.landmarks.positions.slice(0, 5),
        last5: detection.landmarks.positions.slice(-5),
      });
    }

    console.log('📦 바운딩 박스:', detection.detection);

    // 감정 분석 결과
    const { expressions } = detection;
    let maxEmotion = 'neutral';
    let maxConfidence = 0;

    Object.entries(expressions).forEach(([emotion, confidence]) => {
      const confidenceValue = confidence as number;
      if (confidenceValue > maxConfidence) {
        maxEmotion = emotion;
        maxConfidence = confidenceValue;
      }
    });

    console.log(
      `🎯 최종 감정: ${maxEmotion} (신뢰도: ${maxConfidence.toFixed(3)})`
    );

    return {
      emotion: maxEmotion,
      confidence: maxConfidence,
      faceDescriptor: detection.descriptor,
      landmarks: detection.landmarks
        ? { positions: detection.landmarks.positions }
        : null,
      boundingBox: detection.detection,
    };
  }

  /**
   * 모델 상태를 확인합니다.
   */
  getModelStatus(): boolean {
    return this.isFaceApiLoaded;
  }

  /**
   * 모델을 언로드하여 메모리를 정리합니다.
   */
  dispose(): void {
    this.isFaceApiLoaded = false;
    this.faceapi = null;
  }
}
