/**
 * MBTI 색상 데이터 관련 타입 정의
 */

/**
 * RGB 색상 값
 */
export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

/**
 * MBTI 지표 타입
 */
export type MBTIIndicator = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

/**
 * MBTI 색상 규칙 정의
 */
export interface MBTIColorRule {
  hueRange: [number, number];
  saturationRange: [number, number];
  lightnessRange: [number, number];
  warmTone: boolean;
  includeNeutral: boolean;
  complementary: boolean;
}

/**
 * MBTI 색상 규칙 맵
 */
export type MBTIColorRules = Record<MBTIIndicator, MBTIColorRule>;

/**
 * MBTI 데이터 샘플
 */
export interface MBTIData {
  label: MBTIIndicator;
  palette: string[];
}
