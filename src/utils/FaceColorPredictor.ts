/* eslint-disable prettier/prettier */
/**
 * 얼굴 이미지에서 색상 팔레트를 추천하는 예측기
 * FaceAPI.js와 커스텀 색상 추천 모델을 사용합니다.
 */

import * as tf from '@tensorflow/tfjs';

import { ColorPalette, vectorToPalette } from './ColorMLUtils';
import { FaceFeatureExtractor, FaceLandmarks } from './FaceFeatureExtractor';

export interface FaceAnalysisResult {
  emotion: string;
  confidence: number;
  faceDescriptor: Float32Array | null;
  landmarks: FaceLandmarks | null;
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
      // 향상된 모델 우선 시도, 실패하면 기존 모델 사용
      try {
        const enhancedModelUrl = '/models/enhanced-face-to-color/model.json';
        this.faceColorModel = await tf.loadLayersModel(enhancedModelUrl);
        console.log('✅ 향상된 얼굴-색상 모델 로드 완료 (148차원 입력)');
      } catch (enhancedError) {
        console.log('⚠️ 향상된 모델 로드 실패, 기존 모델 사용');
        const modelUrl = '/models/face-to-color/model.json';
        this.faceColorModel = await tf.loadLayersModel(modelUrl);
        console.log('✅ 기존 얼굴-색상 모델 로드 완료 (128차원 입력)');
      }
      this.isModelsLoaded = true;
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
          landmarks: detection.landmarks ? { positions: detection.landmarks.positions } : null,
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
        landmarks: detection.landmarks ? { positions: detection.landmarks.positions } : null,
        boundingBox: detection.detection,
      };
    } catch (error) {
      console.error('얼굴 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 색상 다양성을 강화하는 함수
   */
  private enhanceColorDiversity(palette: ColorPalette, randomSeed: number[]): ColorPalette {
    const enhancedColors = palette.colors.map((color, index) => {
      // 랜덤 시드를 사용한 색상 변형
      const seed = randomSeed[index % randomSeed.length];
      
      // RGB 값 추출
      const hex = color.replace('#', '');
      let r = parseInt(hex.substring(0, 2), 16) / 255;
      let g = parseInt(hex.substring(2, 4), 16) / 255;
      let b = parseInt(hex.substring(4, 6), 16) / 255;
      
      // 강한 색상 변형 적용
      const variation = (seed - 0.5) * 0.8; // -0.4 ~ +0.4 범위
      
      // 색상 채널별 변형
      r = Math.max(0, Math.min(1, r + variation * 0.5));
      g = Math.max(0, Math.min(1, g + variation * 0.3));
      b = Math.max(0, Math.min(1, b + variation * 0.7));
      
      // 채도 강화
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      
      if (saturation < 0.3) {
        // 채도가 낮으면 강화
        const enhanceFactor = 1.5 + seed * 0.5;
        r += (max - r) * enhanceFactor * 0.3;
        g += (max - g) * enhanceFactor * 0.3;
        b += (max - b) * enhanceFactor * 0.3;
      }
      
      // 밝기 조정
      const brightness = (r + g + b) / 3;
      if (brightness < 0.3) {
        const brightenFactor = 0.5 + seed * 0.3;
        r = Math.min(1, r + brightenFactor);
        g = Math.min(1, g + brightenFactor);
        b = Math.min(1, b + brightenFactor);
      }
      
      // 최종 RGB 값을 16진수로 변환
      const toHex = (n: number) => {
        const hex = Math.round(n * 255).toString(16);
        return hex.length === 1 ? `0${hex}` : hex;
      };
      
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    });
    
    return { colors: enhancedColors };
  }

  /**
   * 얼굴 특징 벡터에서 색상 팔레트를 예측합니다.
   */
  async predictColorFromFace(
    faceDescriptor: Float32Array,
    landmarks?: FaceLandmarks | null,
    randomSeed?: number[]
  ): Promise<ColorPalette> {
    if (!this.isModelsLoaded) {
      await this.loadFaceColorModel();
    }

    if (!this.faceColorModel) {
      throw new Error('색상 추천 모델이 로드되지 않았습니다.');
    }

    try {
      let inputVector: number[];
      let randomSeedArray: number[] = []; // 랜덤 시드 배열 선언

      // 모델 입력 차원 확인 (148차원이면 향상된 모델, 128차원이면 기존 모델)
      const inputShape = this.faceColorModel.inputs[0].shape;
      const inputDim = inputShape ? inputShape[1] : 128;

      if (inputDim === 148) {
        // 향상된 모델: 148차원 입력 (descriptor 128 + 특징 15 + 랜덤 5)
        if (!landmarks) {
          throw new Error('향상된 모델을 사용하려면 랜드마크 정보가 필요합니다.');
        }

        // 1. 128차원 얼굴 descriptor
        const descriptorArray = Array.from(faceDescriptor);

        // 2. 15차원 물리적 특징 추출
        const physicalFeatures = FaceFeatureExtractor.extractFeatures(landmarks);

        // 3. 5차원 랜덤 시드 생성 (더 강한 변형을 위해)
        randomSeedArray = randomSeed || FaceFeatureExtractor.generateRandomSeed();

        // 4. 148차원 입력 벡터 조합
        inputVector = [...descriptorArray, ...physicalFeatures, ...randomSeedArray];
        
        // 디버깅 정보 출력
        console.log('🔍 향상된 모델 사용 중 (148차원)');
        console.log('물리적 특징:', physicalFeatures.slice(0, 5));
        console.log('랜덤 시드:', randomSeedArray);
      } else {
        // 기존 모델: 128차원 입력 (descriptor만)
        inputVector = Array.from(faceDescriptor);
      }

      // 입력 텐서 생성
      const inputTensor = tf.tensor2d([inputVector]);

      // 색상 예측 수행
      const prediction = this.faceColorModel.predict(inputTensor) as tf.Tensor;
      const predictionArray = await prediction.data();

      // 15차원 벡터를 5개 색상 팔레트로 변환
      let palette = vectorToPalette(Array.from(predictionArray));
      
      // 색상 다양성 강화 (향상된 모델인 경우)
      if (inputDim === 148) {
        palette = this.enhanceColorDiversity(palette, randomSeedArray);
      }

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
        faceAnalysis.faceDescriptor,
        faceAnalysis.landmarks
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
   * 한 얼굴에서 여러 색상 팔레트를 생성합니다.
   */
  async predictMultipleVariations(
    faceDescriptor: Float32Array,
    landmarks: FaceLandmarks | null,
    count: number = 5
  ): Promise<ColorPalette[]> {
    if (!this.isModelsLoaded) {
      await this.loadFaceColorModel();
    }

    if (!this.faceColorModel) {
      throw new Error('색상 추천 모델이 로드되지 않았습니다.');
    }

    const palettes: ColorPalette[] = [];

    for (let i = 0; i < count; i++) {
      try {
        // 각 팔레트마다 다른 랜덤 시드 사용
        const randomSeed = FaceFeatureExtractor.generateRandomSeed();
        const palette = await this.predictColorFromFace(
          faceDescriptor,
          landmarks,
          randomSeed
        );
        palettes.push(palette);
      } catch (error) {
        console.error(`팔레트 ${i + 1} 생성 실패:`, error);
        // 실패한 경우 기본 팔레트 사용
        palettes.push({
          colors: ['#808080', '#A0A0A0', '#C0C0C0', '#E0E0E0', '#F0F0F0']
        });
      }
    }

    return palettes;
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
        count
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
