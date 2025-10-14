/**
 * MBTI 컬러 팔레트 예측기
 * TensorFlow.js 모델을 사용하여 색상 팔레트로부터 MBTI를 예측합니다.
 */

import * as tf from '@tensorflow/tfjs';

import {
  ColorPalette,
  MBTIPrediction,
  MBTIResult,
  paletteToVector,
  combineMBTIPredictions,
} from './ColorMLUtils';

export interface ModelInfo {
  classes: string[];
  indicator: string;
}

export class MBTIPredictor {
  private models: Map<string, tf.LayersModel> = new Map();

  private modelInfos: Map<string, ModelInfo> = new Map();

  private isLoaded: boolean = false;

  /**
   * 모든 MBTI 모델을 로드합니다.
   */
  async loadModels(): Promise<void> {
    if (this.isLoaded) return;

    const indicators = ['e-i', 's-n', 't-f', 'j-p'];

    try {
      // 각 지표별 모델 로드
      const loadPromises = indicators.map(async (indicator) => {
        const modelUrl = `/models/${indicator}/model.json`;
        const labelsUrl = `/models/${indicator}/labels.json`;

        try {
          // TensorFlow.js 표준 방식으로 모델 로드
          const model = await tf.loadLayersModel(modelUrl);
          this.models.set(indicator, model);
          // eslint-disable-next-line no-console
          console.log(`✅ ${indicator} 모델 로드 완료 (TensorFlow.js 표준)`);
        } catch (modelError) {
          // eslint-disable-next-line no-console
          console.error(`❌ ${indicator} 모델 로드 실패:`, modelError);
          throw new Error(
            `${indicator} 모델을 로드할 수 없습니다. 모델 파일을 확인해주세요.`
          );
        }

        // 라벨 정보 로드
        const response = await fetch(labelsUrl);
        const modelInfo: ModelInfo = await response.json();
        this.modelInfos.set(indicator, modelInfo);
      });

      await Promise.all(loadPromises);

      this.isLoaded = true;
      // eslint-disable-next-line no-console
      console.log('🎉 모든 MBTI 모델 로드 완료!');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ 모델 로드 실패:', error);
      throw new Error(
        '모델을 로드할 수 없습니다. 먼저 파이썬 스크립트로 모델을 생성해주세요.'
      );
    }
  }

  /**
   * 단일 지표에 대한 예측을 수행합니다.
   */
  private async predictSingleIndicator(
    indicator: string,
    palette: ColorPalette
  ): Promise<MBTIPrediction> {
    const model = this.models.get(indicator);
    const modelInfo = this.modelInfos.get(indicator);

    if (!model || !modelInfo) {
      throw new Error(`${indicator} 모델이 로드되지 않았습니다.`);
    }

    // 색상 팔레트를 벡터로 변환
    const inputVector = paletteToVector(palette);
    const inputTensor = tf.tensor2d([inputVector]);

    try {
      // 예측 수행
      const prediction = model.predict(inputTensor) as tf.Tensor;
      const predictionArray = await prediction.data();

      // 가장 높은 확률의 클래스 찾기
      let maxIndex = 0;
      let maxProbability = predictionArray[0];

      for (let i = 1; i < predictionArray.length; i += 1) {
        if (predictionArray[i] > maxProbability) {
          maxIndex = i;
          maxProbability = predictionArray[i];
        }
      }

      const predictedClass = modelInfo.classes[maxIndex];
      const confidence = maxProbability;

      // 메모리 정리
      inputTensor.dispose();
      prediction.dispose();

      return {
        indicator,
        prediction: predictedClass,
        confidence: Math.round(confidence * 100) / 100,
      };
    } catch (error) {
      inputTensor.dispose();
      throw error;
    }
  }

  /**
   * 색상 팔레트로부터 MBTI를 예측합니다.
   */
  async predictMBTI(palette: ColorPalette): Promise<MBTIResult> {
    if (!this.isLoaded) {
      await this.loadModels();
    }

    const indicators = ['e-i', 's-n', 't-f', 'j-p'];
    const predictions: MBTIPrediction[] = [];

    try {
      // 각 지표별로 예측 수행
      const predictionPromises = indicators.map(async (indicator) => {
        return this.predictSingleIndicator(indicator, palette);
      });

      const results = await Promise.all(predictionPromises);
      predictions.push(...results);

      // 예측 결과를 조합하여 최종 MBTI 생성
      const result = combineMBTIPredictions(predictions);

      return result;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('MBTI 예측 실패:', error);
      throw error;
    }
  }

  /**
   * 모델의 상태를 확인합니다.
   */
  getModelStatus(): { isLoaded: boolean; loadedModels: string[] } {
    return {
      isLoaded: this.isLoaded,
      loadedModels: Array.from(this.models.keys()),
    };
  }

  /**
   * 모델을 언로드하여 메모리를 정리합니다.
   */
  dispose(): void {
    this.models.forEach((model) => {
      model.dispose();
    });
    this.models.clear();
    this.modelInfos.clear();
    this.isLoaded = false;
  }
}

// 싱글톤 인스턴스
export const mbtiPredictor = new MBTIPredictor();
