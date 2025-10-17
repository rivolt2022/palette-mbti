/**
 * 색상 예측 및 모델 관리 유틸리티
 */

import * as tf from '@tensorflow/tfjs';

import { ColorPalette, vectorToPalette } from '../ColorMLUtils';
import { ColorAdjuster } from './ColorAdjuster';
import {
  ColorReasonGenerator,
  ColorExtractionReason,
} from './ColorReasonGenerator';
import { FaceFeatureExtractor, FaceLandmarks } from './FaceFeatureExtractor';

export class ColorPredictor {
  private faceColorModel: tf.LayersModel | null = null;

  private isModelsLoaded: boolean = false;

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
   * 얼굴 특징 벡터에서 색상 팔레트를 예측합니다.
   */
  async predictColorFromFace(
    faceDescriptor: Float32Array,
    landmarks?: FaceLandmarks | null,
    randomSeed?: number[],
    emotion?: string
  ): Promise<{ palette: ColorPalette; reason?: ColorExtractionReason }> {
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
      const inputDim = inputShape ? inputShape[1] || 128 : 128;

      if (inputDim === 148) {
        // 향상된 모델: 148차원 입력 (descriptor 128 + 특징 15 + 랜덤 5)
        if (!landmarks) {
          throw new Error(
            '향상된 모델을 사용하려면 랜드마크 정보가 필요합니다.'
          );
        }

        // 1. 128차원 얼굴 descriptor
        const descriptorArray = Array.from(faceDescriptor);

        // 2. 15차원 물리적 특징 추출
        const physicalFeatures =
          FaceFeatureExtractor.extractFeatures(landmarks);

        // 3. 5차원 랜덤 시드 생성 (얼굴 특징 기반으로 일관된 시드 생성)
        randomSeedArray =
          randomSeed ||
          this.generateConsistentSeed(faceDescriptor, physicalFeatures);

        // 4. 148차원 입력 벡터 조합
        inputVector = [
          ...descriptorArray,
          ...physicalFeatures,
          ...randomSeedArray,
        ];

        // 상세 디버깅 정보 출력
        console.log('🔍 향상된 모델 사용 중 (148차원)');
        console.log('📊 얼굴 descriptor (128차원):', {
          length: descriptorArray.length,
          first10: descriptorArray.slice(0, 10),
          min: Math.min(...descriptorArray),
          max: Math.max(...descriptorArray),
          mean:
            descriptorArray.reduce((a: number, b: number) => a + b, 0) /
            descriptorArray.length,
        });
        console.log('👤 물리적 특징 (15차원):', {
          length: physicalFeatures.length,
          values: physicalFeatures,
          min: Math.min(...physicalFeatures),
          max: Math.max(...physicalFeatures),
          mean:
            physicalFeatures.reduce((a: number, b: number) => a + b, 0) /
            physicalFeatures.length,
        });
        console.log('🎲 랜덤 시드 (5차원):', {
          length: randomSeedArray.length,
          values: randomSeedArray,
          min: Math.min(...randomSeedArray),
          max: Math.max(...randomSeedArray),
        });
        console.log('📈 최종 입력 벡터 (148차원):', {
          length: inputVector.length,
          first10: inputVector.slice(0, 10),
          last10: inputVector.slice(-10),
        });
      } else {
        // 기존 모델: 128차원 입력 (descriptor만)
        inputVector = Array.from(faceDescriptor);

        // 상세 디버깅 정보 출력
        console.log('🔍 기존 모델 사용 중 (128차원)');
        console.log('📊 얼굴 descriptor (128차원):', {
          length: inputVector.length,
          first10: inputVector.slice(0, 10),
          min: Math.min(...inputVector),
          max: Math.max(...inputVector),
          mean:
            inputVector.reduce((a: number, b: number) => a + b, 0) /
            inputVector.length,
        });
      }

      // 입력 텐서 생성
      const inputTensor = tf.tensor2d([inputVector]);

      // 색상 예측 수행
      const prediction = this.faceColorModel.predict(inputTensor) as tf.Tensor;
      const predictionArray = await prediction.data();

      // 15차원 벡터를 5개 색상 팔레트로 변환
      const predictionArrayValues = Array.from(predictionArray);
      let palette = vectorToPalette(predictionArrayValues);

      // 상세 디버깅 정보 출력
      console.log('🎨 색상 예측 결과:');
      console.log('📊 예측 벡터 (15차원):', {
        length: predictionArrayValues.length,
        values: predictionArrayValues,
        min: Math.min(...predictionArrayValues),
        max: Math.max(...predictionArrayValues),
        mean:
          predictionArrayValues.reduce((a: number, b: number) => a + b, 0) /
          predictionArrayValues.length,
      });
      console.log('🎨 원본 색상 팔레트:', palette.colors);

      // 감정 기반 색상 조정 (모든 모델에 적용)
      if (emotion) {
        console.log(`😊 감정 기반 색상 조정: ${emotion}`);
        palette = ColorAdjuster.adjustColorsForEmotion(palette, emotion);
        console.log('🎨 감정 조정된 색상 팔레트:', palette.colors);
      }

      // 색상 다양성 강화 (향상된 모델인 경우)
      if (inputDim === 148) {
        console.log('✨ 색상 다양성 강화 적용');
        palette = ColorAdjuster.enhanceColorDiversity(
          palette,
          randomSeedArray,
          emotion
        );
        console.log('✨ 다양성 강화된 색상 팔레트:', palette.colors);
      }

      // 근거 정보 생성
      let reason: ColorExtractionReason | undefined;
      if (landmarks) {
        const physicalFeatures =
          FaceFeatureExtractor.extractFeatures(landmarks);
        reason = ColorReasonGenerator.generateColorReason(
          physicalFeatures,
          emotion || 'neutral',
          randomSeedArray,
          inputDim,
          palette
        );
      }

      // 메모리 정리
      inputTensor.dispose();
      prediction.dispose();

      return { palette, reason };
    } catch (error) {
      console.error('색상 예측 실패:', error);
      throw error;
    }
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
        const baseSeed = this.generateConsistentSeed(
          faceDescriptor,
          landmarks ? FaceFeatureExtractor.extractFeatures(landmarks) : []
        );
        const variationSeed = baseSeed.map((seed) => (seed + i * 0.1) % 1); // 약간의 변화 추가
        const predictionResult = await this.predictColorFromFace(
          faceDescriptor,
          landmarks,
          variationSeed,
          emotion
        );
        return predictionResult.palette;
      } catch (error) {
        console.error(`팔레트 ${i + 1} 생성 실패:`, error);
        // 실패한 경우 기본 팔레트 사용
        return {
          colors: ['#808080', '#A0A0A0', '#C0C0C0', '#E0E0E0', '#F0F0F0'],
        };
      }
    });

    const results = await Promise.all(palettePromises);
    palettes.push(...results);

    return palettes;
  }

  /**
   * 얼굴 특징을 기반으로 일관된 시드 생성 (동일한 이미지에 대해 같은 결과 보장)
   */
  private generateConsistentSeed(
    faceDescriptor: Float32Array,
    _physicalFeatures: number[]
  ): number[] {
    // 얼굴 descriptor의 일부 값들을 사용하여 시드 생성
    const descriptorValues = Array.from(faceDescriptor).slice(0, 10); // 처음 10개 값 사용

    // 시드 생성 (0-1 범위로 정규화)
    const seed1 = Math.abs(descriptorValues[0] + descriptorValues[5]) % 1;
    const seed2 = Math.abs(descriptorValues[1] + descriptorValues[6]) % 1;
    const seed3 = Math.abs(descriptorValues[2] + descriptorValues[7]) % 1;
    const seed4 = Math.abs(descriptorValues[3] + descriptorValues[8]) % 1;
    const seed5 = Math.abs(descriptorValues[4] + descriptorValues[9]) % 1;

    return [seed1, seed2, seed3, seed4, seed5];
  }

  /**
   * 모델 상태를 확인합니다.
   */
  getModelStatus(): boolean {
    return this.isModelsLoaded;
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
  }
}
