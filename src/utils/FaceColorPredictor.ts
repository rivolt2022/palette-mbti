/**
 * 얼굴 이미지에서 색상 팔레트를 추천하는 예측기
 * FaceAPI.js와 커스텀 색상 추천 모델을 사용합니다.
 */

import * as tf from '@tensorflow/tfjs';

import { ColorPalette, vectorToPalette } from './ColorMLUtils';

export interface FaceAnalysisResult {
  emotion: string;
  confidence: number;
  faceDescriptor: Float32Array | null;
  boundingBox: faceapi.FaceDetection | null;
}

export interface ColorRecommendationResult {
  palette: ColorPalette;
  emotion: string;
  confidence: number;
  analysis: FaceAnalysisResult;
}

export class FaceColorPredictor {
  private faceColorModel: tf.LayersModel | null = null;

  private isModelsLoaded: boolean = false;

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
   * 커스텀 얼굴-색상 모델을 로드합니다.
   */
  async loadFaceColorModel(): Promise<void> {
    if (this.isModelsLoaded) return;

    try {
      const modelUrl = '/models/face-to-color/model.json';
      this.faceColorModel = await tf.loadLayersModel(modelUrl);
      this.isModelsLoaded = true;
      console.log('✅ 얼굴-색상 모델 로드 완료');
    } catch (error) {
      console.error('❌ 얼굴-색상 모델 로드 실패:', error);
      throw new Error('색상 추천 모델을 로드할 수 없습니다.');
    }
  }

  /**
   * 모든 모델을 로드합니다.
   */
  async loadAllModels(): Promise<void> {
    await Promise.all([this.loadFaceApiModels(), this.loadFaceColorModel()]);
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

        // 감정 분석 결과
        const { expressions } = detection;
        let maxEmotion = 'neutral';
        let maxConfidence = 0;

        for (const [emotion, confidence] of Object.entries(expressions)) {
          if (confidence > maxConfidence) {
            maxEmotion = emotion;
            maxConfidence = confidence;
          }
        }

        return {
          emotion: maxEmotion,
          confidence: maxConfidence,
          faceDescriptor: detection.descriptor,
          boundingBox: detection.detection,
        };
      }

      // 첫 번째 얼굴 사용
      const detection = detections[0];

      // 감정 분석 결과
      const { expressions } = detection;
      let maxEmotion = 'neutral';
      let maxConfidence = 0;

      for (const [emotion, confidence] of Object.entries(expressions)) {
        if (confidence > maxConfidence) {
          maxEmotion = emotion;
          maxConfidence = confidence;
        }
      }

      return {
        emotion: maxEmotion,
        confidence: maxConfidence,
        faceDescriptor: detection.descriptor,
        boundingBox: detection.detection,
      };
    } catch (error) {
      console.error('얼굴 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 얼굴 특징 벡터에서 색상 팔레트를 예측합니다.
   */
  async predictColorFromFace(
    faceDescriptor: Float32Array
  ): Promise<ColorPalette> {
    if (!this.isModelsLoaded) {
      await this.loadFaceColorModel();
    }

    if (!this.faceColorModel) {
      throw new Error('색상 추천 모델이 로드되지 않았습니다.');
    }

    try {
      // 128차원 얼굴 특징 벡터를 텐서로 변환
      const inputTensor = tf.tensor2d([Array.from(faceDescriptor)]);

      // 색상 예측 수행
      const prediction = this.faceColorModel.predict(inputTensor) as tf.Tensor;
      const predictionArray = await prediction.data();

      // 15차원 벡터를 5개 색상 팔레트로 변환
      const palette = vectorToPalette(Array.from(predictionArray));

      // 메모리 정리
      inputTensor.dispose();
      prediction.dispose();

      return palette;
    } catch (error) {
      console.error('색상 예측 실패:', error);
      throw error;
    }
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
      const palette = await this.predictColorFromFace(
        faceAnalysis.faceDescriptor
      );

      return {
        palette,
        emotion: faceAnalysis.emotion,
        confidence: faceAnalysis.confidence,
        analysis: faceAnalysis,
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
   * 모델 상태를 확인합니다.
   */
  getModelStatus(): {
    isFaceApiLoaded: boolean;
    isFaceColorModelLoaded: boolean;
    isAllLoaded: boolean;
  } {
    return {
      isFaceApiLoaded: this.isFaceApiLoaded,
      isFaceColorModelLoaded: this.isModelsLoaded,
      isAllLoaded: this.isFaceApiLoaded && this.isModelsLoaded,
    };
  }

  /**
   * 모델을 언로드하여 메모리를 정리합니다.
   */
  dispose(): void {
    if (this.faceColorModel) {
      this.faceColorModel.dispose();
      this.faceColorModel = null;
    }
    this.isModelsLoaded = false;
    this.isFaceApiLoaded = false;
  }
}

// 싱글톤 인스턴스
export const faceColorPredictor = new FaceColorPredictor();
