/**
 * MBTI 색채 심리학 기반 자동 데이터 생성 유틸리티
 */

import type { ColorRGB, MBTIColorRules, MBTIData, MBTIIndicator } from '@/types/MBTIData';

/**
 * 색채 심리학 기반 MBTI 색상 규칙 정의
 */
const MBTI_COLOR_RULES: MBTIColorRules = {
  // E (외향): 채도 높음, 밝기 중상, 따뜻한 색조
  E: {
    hueRange: [0, 60], // 빨강-노랑 범위
    saturationRange: [70, 100],
    lightnessRange: [50, 80],
    warmTone: true,
    includeNeutral: false,
    complementary: false,
  },
  // I (내향): 채도 낮음, 밝기 중하, 차가운 색조
  I: {
    hueRange: [180, 270], // 파랑-보라 범위
    saturationRange: [20, 50],
    lightnessRange: [30, 60],
    warmTone: false,
    includeNeutral: true,
    complementary: false,
  },
  // S (감각): 자연색, 중립색, 채도 중간
  S: {
    hueRange: [60, 180], // 노랑-파랑 범위 (자연색)
    saturationRange: [40, 70],
    lightnessRange: [40, 70],
    warmTone: false,
    includeNeutral: true,
    complementary: false,
  },
  // N (직관): 비현실적 색상 조합, 채도 높음
  N: {
    hueRange: [0, 360], // 전체 색조 범위
    saturationRange: [60, 100],
    lightnessRange: [30, 80],
    warmTone: false,
    includeNeutral: false,
    complementary: true,
  },
  // T (사고): 무채색 포함, 쿨톤, 채도 낮음
  T: {
    hueRange: [180, 300], // 파랑-보라 범위
    saturationRange: [30, 60],
    lightnessRange: [30, 70],
    warmTone: false,
    includeNeutral: true,
    complementary: false,
  },
  // F (감정): 파스텔톤, 웜톤, 채도 중상
  F: {
    hueRange: [300, 60], // 보라-빨강 범위 (웜톤)
    saturationRange: [50, 90],
    lightnessRange: [60, 90],
    warmTone: true,
    includeNeutral: false,
    complementary: false,
  },
  // J (판단): 정렬된 색상 계열, 보색 관계
  J: {
    hueRange: [0, 360], // 전체 색조 범위
    saturationRange: [40, 80],
    lightnessRange: [40, 70],
    warmTone: false,
    includeNeutral: false,
    complementary: true,
  },
  // P (인식): 무작위 색상 조합, 비보색 관계
  P: {
    hueRange: [0, 360], // 전체 색조 범위
    saturationRange: [30, 90],
    lightnessRange: [20, 80],
    warmTone: false,
    includeNeutral: true,
    complementary: false,
  },
};

/**
 * HSL을 RGB로 변환
 */
function hslToRgb(h: number, s: number, l: number): ColorRGB {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 1 / 6) {
    r = c;
    g = x;
    b = 0;
  } else if (1 / 6 <= h && h < 2 / 6) {
    r = x;
    g = c;
    b = 0;
  } else if (2 / 6 <= h && h < 3 / 6) {
    r = 0;
    g = c;
    b = x;
  } else if (3 / 6 <= h && h < 4 / 6) {
    r = 0;
    g = x;
    b = c;
  } else if (4 / 6 <= h && h < 5 / 6) {
    r = x;
    g = 0;
    b = c;
  } else if (5 / 6 <= h && h < 1) {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/**
 * RGB를 HEX로 변환
 */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

/**
 * HSL을 HEX로 변환
 */
function hslToHex(h: number, s: number, l: number): string {
  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * 무작위 숫자 생성 (min, max 포함)
 */
function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * 보색 계산
 */
function getComplementaryHue(hue: number): number {
  return (hue + 180) % 360;
}

/**
 * 특정 MBTI 지표에 대한 색상 팔레트 생성
 */
function generateColorPaletteForMBTI(indicator: MBTIIndicator): string[] {
  const rules = MBTI_COLOR_RULES[indicator];
  const palette: string[] = [];

  // 5개 색상 생성
  for (let i = 0; i < 5; i++) {
    let hue: number;
    let saturation: number;

    if (rules.complementary && i > 0 && Math.random() < 0.3) {
      // 30% 확률로 보색 관계 활용
      const baseHue = palette.length > 0
        ? Number.parseInt(palette[palette.length - 1]?.slice(1, 3) ?? '0', 16) * 360 / 255
        : randomInRange(rules.hueRange[0], rules.hueRange[1]);
      hue = getComplementaryHue(baseHue);
    } else {
      hue = randomInRange(rules.hueRange[0], rules.hueRange[1]);
    }

    saturation = randomInRange(rules.saturationRange[0], rules.saturationRange[1]);
    const lightness = randomInRange(rules.lightnessRange[0], rules.lightnessRange[1]);

    // 무채색 포함 옵션
    if (rules.includeNeutral && Math.random() < 0.2) {
      saturation = randomInRange(0, 20);
    }

    palette.push(hslToHex(hue, saturation, lightness));
  }

  return palette;
}

/**
 * MBTI 데이터셋 생성
 */
export function generateMBTIDataset(samplesPerIndicator: number = 1000): Record<MBTIIndicator, MBTIData[]> {
  const dataset: Record<MBTIIndicator, MBTIData[]> = {
    E: [],
    I: [],
    S: [],
    N: [],
    T: [],
    F: [],
    J: [],
    P: [],
  };

  const indicators: MBTIIndicator[] = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'];

  indicators.forEach((indicator) => {
    for (let i = 0; i < samplesPerIndicator; i++) {
      const palette = generateColorPaletteForMBTI(indicator);
      dataset[indicator].push({
        label: indicator,
        palette,
      });
    }
  });

  return dataset;
}

/**
 * 특정 지표의 데이터만 생성
 */
export function generateMBTIDataForIndicator(
  indicator: MBTIIndicator,
  samples: number = 1000,
): MBTIData[] {
  const data: MBTIData[] = [];

  for (let i = 0; i < samples; i++) {
    const palette = generateColorPaletteForMBTI(indicator);
    data.push({
      label: indicator,
      palette,
    });
  }

  return data;
}

/**
 * 데이터셋을 JSON 파일로 저장하기 위한 형식으로 변환
 */
export function formatDatasetForExport(dataset: Record<MBTIIndicator, MBTIData[]>): Record<string, MBTIData[]> {
  return {
    'e-i': [...dataset.E, ...dataset.I],
    's-n': [...dataset.S, ...dataset.N],
    't-f': [...dataset.T, ...dataset.F],
    'j-p': [...dataset.J, ...dataset.P],
  };
}
