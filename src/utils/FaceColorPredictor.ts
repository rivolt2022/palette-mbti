/* eslint-disable prettier/prettier */
/**
 * 얼굴 이미지에서 색상 팔레트를 추천하는 예측기
 * FaceAPI.js와 커스텀 색상 추천 모델을 사용합니다.
 */

import * as tf from '@tensorflow/tfjs';

import { ColorPalette, vectorToPalette } from './ColorMLUtils';
import { FaceFeatureExtractor, FaceLandmarks } from './FaceFeatureExtractor';

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
      // 다양한 모델 우선 시도, 실패하면 다른 모델들 시도
      try {
        const diverseModelUrl = '/models/diverse-face-to-color/model.json';
        this.faceColorModel = await tf.loadLayersModel(diverseModelUrl);
        console.log('✅ 다양한 얼굴-색상 모델 로드 완료 (148차원 입력)');
      } catch (diverseError) {
        console.log('⚠️ 다양한 모델 로드 실패, 향상된 모델 시도');
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

      Object.entries(expressions).forEach(([emotion, confidence]) => {
        const confidenceValue = confidence as number;
        if (confidenceValue > maxConfidence) {
          maxEmotion = emotion;
          maxConfidence = confidenceValue;
        }
      });

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

      Object.entries(expressions).forEach(([emotion, confidence]) => {
        const confidenceValue = confidence as number;
        if (confidenceValue > maxConfidence) {
          maxEmotion = emotion;
          maxConfidence = confidenceValue;
        }
      });

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
   * 감정에 따라 색상을 조정하는 함수
   */
  private adjustColorsForEmotion(palette: ColorPalette, emotion: string): ColorPalette {
    const adjustedColors = palette.colors.map(color => {
      const [r, g, b] = this.hexToRgbNormalized(color);
      let [h, s, l] = this.rgbToHsl(r, g, b);
      
      switch(emotion) {
        case 'happy':
          // 밝고 선명한 색상으로 조정 (웃는 얼굴) - 파스텔톤 지양
          l = Math.max(0.5, Math.min(0.8, l + 0.1)); // 밝기 조정 (너무 밝지 않게)
          s = Math.max(0.8, Math.min(1.0, s + 0.4)); // 채도 대폭 증가 (선명하게)
          // 따뜻한 색상으로 조정 (노랑, 주황, 빨강 계열)
          if (h < 60 || h > 300) {
            h = (h + 30) % 360; // 따뜻한 색상으로 이동
          }
          break;
          
        case 'sad':
          // 어둡고 차분한 색상으로 조정 (우울한 얼굴)
          l = Math.max(0.2, Math.min(0.5, l - 0.2));
          s = Math.max(0.3, Math.min(0.6, s - 0.1));
          // 차가운 색상으로 조정 (파랑, 보라 계열)
          if (h > 180 && h < 300) {
            h = (h + 60) % 360; // 더 차가운 색상으로 이동
          }
          break;
          
        case 'angry':
          // 선명하고 대비가 강한 색상으로 조정 (화난 얼굴)
          s = Math.max(0.8, Math.min(1.0, s + 0.3));
          l = Math.max(0.4, Math.min(0.7, l));
          // 빨강 계열 색상으로 조정
          if (h < 30 || h > 330) {
            h = 0; // 빨강으로 고정
          } else {
            h = (h - 60) % 360; // 빨강에 가깝게 이동
          }
          break;
          
        case 'surprised':
          // 밝고 선명한 색상으로 조정 (놀란 얼굴)
          l = Math.max(0.7, Math.min(0.95, l + 0.3));
          s = Math.max(0.8, Math.min(1.0, s + 0.2));
          // 노랑, 주황 계열 색상으로 조정
          if (h < 60) {
            h = (h + 45) % 360; // 노랑-주황 계열로 이동
          }
          break;
          
        case 'fearful':
          // 어둡고 차분한 색상으로 조정 (무서워하는 얼굴)
          l = Math.max(0.1, Math.min(0.4, l - 0.3));
          s = Math.max(0.2, Math.min(0.5, s - 0.2));
          // 차가운 색상으로 조정 (파랑, 보라 계열)
          h = (h + 120) % 360; // 차가운 색상으로 이동
          break;
          
        case 'disgusted':
          // 어둡고 탁한 색상으로 조정 (역겨워하는 얼굴)
          l = Math.max(0.3, Math.min(0.6, l - 0.1));
          s = Math.max(0.1, Math.min(0.4, s - 0.3));
          // 갈색, 올리브 계열 색상으로 조정
          h = (h + 90) % 360; // 갈색 계열로 이동
          break;
          
        case 'neutral':
          // 중간 톤의 색상으로 조정 (무표정한 얼굴)
          l = Math.max(0.4, Math.min(0.7, l));
          s = Math.max(0.4, Math.min(0.7, s));
          // 색상 변화 최소화
          break;
          
        default:
          // 기본값 유지
          break;
      }
      
      const [newR, newG, newB] = this.hslToRgb(h, s, l);
      return this.rgbToHex(newR, newG, newB);
    });
    
    return { colors: adjustedColors };
  }

  /**
   * 16진수 색상을 RGB로 변환 (0-1 범위)
   */
  private hexToRgbNormalized(hexColor: string): [number, number, number] {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return [r, g, b];
  }

  /**
   * RGB 값을 16진수 색상으로 변환
   */
  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
      const hex = Math.round(n * 255).toString(16);
      return hex.length === 1 ? `0${hex}` : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * 얼굴 특징을 기반으로 일관된 시드 생성 (동일한 이미지에 대해 같은 결과 보장)
   */
  private generateConsistentSeed(faceDescriptor: Float32Array, physicalFeatures: number[]): number[] {
    // 얼굴 descriptor의 일부 값들을 사용하여 시드 생성
    const descriptorValues = Array.from(faceDescriptor).slice(0, 10); // 처음 10개 값 사용
    const physicalValues = physicalFeatures.slice(0, 5); // 처음 5개 값 사용
    
    // 시드 생성 (0-1 범위로 정규화)
    const seed1 = Math.abs(descriptorValues[0] + descriptorValues[5]) % 1;
    const seed2 = Math.abs(descriptorValues[1] + descriptorValues[6]) % 1;
    const seed3 = Math.abs(descriptorValues[2] + descriptorValues[7]) % 1;
    const seed4 = Math.abs(descriptorValues[3] + descriptorValues[8]) % 1;
    const seed5 = Math.abs(descriptorValues[4] + descriptorValues[9]) % 1;
    
    return [seed1, seed2, seed3, seed4, seed5];
  }

  /**
   * 색상 다양성을 강화하는 함수 (MBTI 예측을 위한 대폭 개선)
   */
  private enhanceColorDiversity(palette: ColorPalette, randomSeed: number[], emotion?: string): ColorPalette {
    const enhancedColors = palette.colors.map((color, index) => {
      // 각 색상마다 다른 시드 사용 (색상 다양성 확보)
      const seed = randomSeed[index % randomSeed.length];
      const colorIndex = index; // 색상 인덱스 추가
      
      // RGB 값 추출
      const hexColor = color.replace('#', '');
      const r = parseInt(hexColor.substring(0, 2), 16) / 255;
      const g = parseInt(hexColor.substring(2, 4), 16) / 255;
      const b = parseInt(hexColor.substring(4, 6), 16) / 255;
      
      // 색상 공간 변환 (RGB → HSL)
      const hsl = this.rgbToHsl(r, g, b);
      let [hue, saturation, lightness] = hsl;
      
      // 더 강한 색상 변형 적용 (파스텔톤 지양, 색상 다양성 확보)
      const hueVariation = (seed - 0.5) * 180 + (colorIndex * 72); // ±90도 + 색상별 72도씩 차이
      const saturationVariation = (seed - 0.5) * 0.6; // ±30% 채도 변화
      const lightnessVariation = (seed - 0.5) * 0.4; // ±20% 밝기 변화
      
      // 색상 변형 적용
      hue = (hue + hueVariation + 360) % 360;
      saturation = Math.max(0, Math.min(1, saturation + saturationVariation));
      lightness = Math.max(0, Math.min(1, lightness + lightnessVariation));
      
      // 색상 카테고리별 특별 처리 (색상 인덱스 기반)
      const categorySeed = randomSeed[(index + 1) % randomSeed.length];
      const colorType = colorIndex % 5; // 5가지 색상 타입
      
      if (colorType === 0) {
        // 빨강 계열 (따뜻하고 강렬한 색상)
        hue = (hue + 60) % 360;
        saturation = Math.max(0.8, Math.min(1.0, saturation + 0.3));
        lightness = Math.max(0.3, Math.min(0.7, lightness));
      } else if (colorType === 1) {
        // 노랑-주황 계열 (밝고 따뜻한 색상)
        hue = (hue + 120) % 360;
        saturation = Math.max(0.7, Math.min(0.9, saturation + 0.2));
        lightness = Math.max(0.4, Math.min(0.8, lightness + 0.1));
      } else if (colorType === 2) {
        // 초록-청록 계열 (자연스러운 색상)
        hue = (hue + 180) % 360;
        saturation = Math.max(0.8, Math.min(1.0, saturation + 0.4));
        lightness = Math.max(0.3, Math.min(0.7, lightness));
      } else if (colorType === 3) {
        // 파랑-보라 계열 (차가운 색상)
        hue = (hue + 240) % 360;
        saturation = Math.max(0.8, Math.min(1.0, saturation + 0.4));
        lightness = Math.max(0.2, Math.min(0.6, lightness));
      } else {
        // 보라-핑크 계열 (독특한 색상)
        hue = (hue + 300) % 360;
        saturation = Math.max(0.7, Math.min(1.0, saturation + 0.3));
        lightness = Math.max(0.3, Math.min(0.8, lightness));
      }
      
      // HSL → RGB 변환
      const rgb = this.hslToRgb(hue, saturation, lightness);
      
      // 최종 RGB 값을 16진수로 변환
      const toHex = (n: number) => {
        const hex = Math.round(n * 255).toString(16);
        return hex.length === 1 ? `0${hex}` : hex;
      };
      
      return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
    });
    
    return { colors: enhancedColors };
  }

  /**
   * RGB를 HSL로 변환
   */
  private rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    const s = max === 0 ? 0 : diff / max;
    const l = (max + min) / 2;
    
    if (diff !== 0) {
      if (max === r) {
        h = ((g - b) / diff) % 6;
      } else if (max === g) {
        h = (b - r) / diff + 2;
      } else {
        h = (r - g) / diff + 4;
      }
    }
    
    h = (h * 60 + 360) % 360;
    return [h, s, l];
  }

  /**
   * HSL을 RGB로 변환
   */
  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    const hue = h / 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((hue * 6) % 2 - 1));
    const m = l - c / 2;
    
    let r = 0; let g = 0; let b = 0;
    
    if (hue >= 0 && hue < 1/6) {
      r = c; g = x; b = 0;
    } else if (1/6 <= hue && hue < 2/6) {
      r = x; g = c; b = 0;
    } else if (2/6 <= hue && hue < 3/6) {
      r = 0; g = c; b = x;
    } else if (3/6 <= hue && hue < 4/6) {
      r = 0; g = x; b = c;
    } else if (4/6 <= hue && hue < 5/6) {
      r = x; g = 0; b = c;
    } else if (5/6 <= hue && hue < 1) {
      r = c; g = 0; b = x;
    }
    
    return [r + m, g + m, b + m];
  }

  /**
   * 얼굴 특징 벡터에서 색상 팔레트를 예측합니다.
   */
  async predictColorFromFace(
    faceDescriptor: Float32Array,
    landmarks?: FaceLandmarks | null,
    randomSeed?: number[],
    emotion?: string
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

        // 3. 5차원 랜덤 시드 생성 (얼굴 특징 기반으로 일관된 시드 생성)
        randomSeedArray = randomSeed || this.generateConsistentSeed(faceDescriptor, physicalFeatures);

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
      
      // 감정 기반 색상 조정 (모든 모델에 적용)
      if (emotion) {
        console.log(`😊 감정 기반 색상 조정: ${emotion}`);
        palette = this.adjustColorsForEmotion(palette, emotion);
        console.log('🎨 감정 조정된 색상 팔레트:', palette.colors);
      }
      
      // 색상 다양성 강화 (향상된 모델인 경우)
      if (inputDim === 148) {
        console.log('🎨 원본 색상 팔레트:', palette.colors);
        palette = this.enhanceColorDiversity(palette, randomSeedArray, emotion);
        console.log('✨ 다양성 강화된 색상 팔레트:', palette.colors);
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
        faceAnalysis.landmarks,
        undefined,
        faceAnalysis.emotion
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
    if (!this.isModelsLoaded) {
      await this.loadFaceColorModel();
    }

    if (!this.faceColorModel) {
      throw new Error('색상 추천 모델이 로드되지 않았습니다.');
    }

    const palettes: ColorPalette[] = [];

    const palettePromises = Array.from({ length: count }, async (_, i) => {
      try {
        // 각 팔레트마다 약간씩 다른 시드 사용 (얼굴 특징 기반)
        const baseSeed = this.generateConsistentSeed(faceDescriptor, landmarks ? FaceFeatureExtractor.extractFeatures(landmarks) : []);
        const variationSeed = baseSeed.map(seed => (seed + i * 0.1) % 1); // 약간의 변화 추가
        const palette = await this.predictColorFromFace(
          faceDescriptor,
          landmarks,
          variationSeed,
          emotion
        );
        return palette;
      } catch (error) {
        console.error(`팔레트 ${i + 1} 생성 실패:`, error);
        // 실패한 경우 기본 팔레트 사용
        return {
          colors: ['#808080', '#A0A0A0', '#C0C0C0', '#E0E0E0', '#F0F0F0']
        };
      }
    });

    const results = await Promise.all(palettePromises);
    palettes.push(...results);

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
