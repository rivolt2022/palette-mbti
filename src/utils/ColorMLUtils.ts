/**
 * 색상 데이터를 ML 모델 입력 형식으로 변환하는 유틸리티 함수들
 */

export interface ColorPalette {
  colors: string[]; // 5개의 16진수 색상 코드
}

export interface MBTIPrediction {
  indicator: string;
  prediction: string;
  confidence: number;
}

export interface MBTIResult {
  mbti: string;
  predictions: MBTIPrediction[];
  confidence: number;
}

/**
 * 16진수 색상을 0-1 범위의 RGB 값으로 변환
 */
export function hexToRgbNormalized(hexColor: string): [number, number, number] {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255.0;
  const g = parseInt(hex.substring(2, 4), 16) / 255.0;
  const b = parseInt(hex.substring(4, 6), 16) / 255.0;
  return [r, g, b];
}

/**
 * 5개 색상 팔레트를 15차원 벡터로 변환 (모델 입력 형식)
 */
export function paletteToVector(palette: ColorPalette): number[] {
  const vector: number[] = [];

  palette.colors.forEach((color) => {
    const [r, g, b] = hexToRgbNormalized(color);
    vector.push(r, g, b);
  });

  return vector;
}

/**
 * RGB 값을 16진수 색상으로 변환
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 벡터를 색상 팔레트로 변환
 */
export function vectorToPalette(vector: number[]): ColorPalette {
  const colors: string[] = [];

  console.log('vectorToPalette 입력 벡터:', vector);
  console.log('벡터 길이:', vector.length);

  // 벡터 길이를 15로 제한 (5개 색상 × 3 RGB 값)
  const maxLength = Math.min(vector.length, 15);
  
  for (let i = 0; i < maxLength; i += 3) {
    if (i + 2 < maxLength) {
      const r = Math.max(0, Math.min(1, vector[i] || 0));
      const g = Math.max(0, Math.min(1, vector[i + 1] || 0));
      const b = Math.max(0, Math.min(1, vector[i + 2] || 0));
      colors.push(rgbToHex(r, g, b));
    }
  }

  // 5개 색상이 되도록 기본 색상으로 채우기
  while (colors.length < 5) {
    colors.push('#808080'); // 기본 회색
  }

  console.log('변환된 색상 팔레트:', colors);
  return { colors };
}

/**
 * MBTI 예측 결과를 조합하여 최종 MBTI 타입 생성
 */
export function combineMBTIPredictions(
  predictions: MBTIPrediction[]
): MBTIResult {
  const mbtiLetters = ['', '', '', ''];
  let totalConfidence = 0;

  // 각 지표별로 가장 높은 확률의 예측 선택
  predictions.forEach((pred) => {
    const { indicator } = pred;
    const letter = pred.prediction;
    const { confidence } = pred;

    totalConfidence += confidence;

    switch (indicator) {
      case 'e-i':
        mbtiLetters[0] = letter;
        break;
      case 's-n':
        mbtiLetters[1] = letter;
        break;
      case 't-f':
        mbtiLetters[2] = letter;
        break;
      case 'j-p':
        mbtiLetters[3] = letter;
        break;
      default:
        // 알 수 없는 지표는 무시
        break;
    }
  });

  const mbti = mbtiLetters.join('');
  const avgConfidence = totalConfidence / predictions.length;

  return {
    mbti,
    predictions,
    confidence: avgConfidence,
  };
}

/**
 * 색상 팔레트의 특성을 분석하는 헬퍼 함수들
 */
export class ColorAnalyzer {
  /**
   * 팔레트의 평균 밝기 계산
   */
  static getAverageBrightness(palette: ColorPalette): number {
    let totalBrightness = 0;

    palette.colors.forEach((color) => {
      const [r, g, b] = hexToRgbNormalized(color);
      // 밝기 = (R + G + B) / 3
      totalBrightness += (r + g + b) / 3;
    });

    return totalBrightness / palette.colors.length;
  }

  /**
   * 팔레트의 평균 채도 계산
   */
  static getAverageSaturation(palette: ColorPalette): number {
    let totalSaturation = 0;

    palette.colors.forEach((color) => {
      const [r, g, b] = hexToRgbNormalized(color);
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      totalSaturation += saturation;
    });

    return totalSaturation / palette.colors.length;
  }

  /**
   * 팔레트의 색상 온도 분석 (따뜻한 색 vs 차가운 색)
   */
  static getColorTemperature(palette: ColorPalette): number {
    let totalTemperature = 0;

    palette.colors.forEach((color) => {
      const [r, g, b] = hexToRgbNormalized(color);
      // 따뜻한 색(빨강, 노랑)은 양수, 차가운 색(파랑)은 음수
      const temperature = r + g - b;
      totalTemperature += temperature;
    });

    return totalTemperature / palette.colors.length;
  }
}
