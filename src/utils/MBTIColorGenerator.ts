/**
 * MBTI 색채 심리학 기반 자동 데이터 생성 유틸리티
 */

import type {
  ColorRGB,
  MBTIColorRules,
  MBTIData,
  MBTIIndicator,
} from '@/types/MBTIData';

/**
 * 이미지 기반 MBTI 색상 규칙 정의
 * 각 지표별로 해당하는 MBTI 타입들의 색상 범위를 분석하여 설정
 */
const MBTI_COLOR_RULES: MBTIColorRules = {
  // E (외향): ESFP, ESTP, ENFP, ENTP, ENFJ, ENTJ
  // 색상: Diva Pink(320,85,70), Flame Scarlet(15,90,60), Lemon Chrome(55,90,60), Goji Berry(350,75,45), Bluebird(210,80,55), Night Sky(0,0,15)
  E: {
    hueRange: [0, 60], // 빨강-노랑 범위 (핑크, 빨강, 노랑)
    saturationRange: [70, 90],
    lightnessRange: [60, 80],
    warmTone: true,
    includeNeutral: false,
    complementary: false,
  },
  // I (내향): ISFJ, ISFP, INFP, INFJ, INTP, INTJ, ISTP, ISTJ
  // 색상: Daffodil(45,85,75), Sharp Green(120,80,50), Cockatoo(180,70,65), Crystal Seas(200,60,75), Forget-Me-Not(240,50,70), Antarctica(0,0,85), Blueprint(220,85,35), Asphalt(0,0,40)
  I: {
    hueRange: [45, 240], // 노랑-보라 범위 (노랑, 초록, 청록, 파랑, 보라, 회색)
    saturationRange: [40, 85],
    lightnessRange: [35, 85],
    warmTone: false,
    includeNeutral: true,
    complementary: false,
  },
  // S (감각): ISFJ, ISFP, ESTP, ESFJ, ISFP, ESTJ, ISTP, ISTJ
  // 색상: Daffodil(45,85,75), Sharp Green(120,80,50), Flame Scarlet(15,90,60), Fandango Pink(310,70,65), Sharp Green(120,80,50), Winter Green(150,60,40), Blueprint(220,85,35), Asphalt(0,0,40)
  S: {
    hueRange: [15, 220], // 빨강-파랑 범위 (빨강, 핑크, 노랑, 초록, 파랑, 회색)
    saturationRange: [50, 90],
    lightnessRange: [40, 75],
    warmTone: false,
    includeNeutral: true,
    complementary: false,
  },
  // N (직관): INFP, ENFP, ENTP, INFP, ENFJ, INFJ, INTP, INTJ, ENTJ
  // 색상: Cockatoo(180,70,65), Lemon Chrome(55,90,60), Goji Berry(350,75,45), Cockatoo(180,70,65), Bluebird(210,80,55), Crystal Seas(200,60,75), Forget-Me-Not(240,50,70), Antarctica(0,0,85), Night Sky(0,0,15)
  N: {
    hueRange: [0, 360], // 전체 색조 범위
    saturationRange: [50, 90],
    lightnessRange: [15, 85],
    warmTone: false,
    includeNeutral: true,
    complementary: true,
  },
  // T (사고): ESTP, ESTJ, ENTP, INTP, INTJ, ISTP, ENTJ, ISTJ
  // 색상: Flame Scarlet(15,90,60), Winter Green(150,60,40), Goji Berry(350,75,45), Forget-Me-Not(240,50,70), Antarctica(0,0,85), Blueprint(220,85,35), Night Sky(0,0,15), Asphalt(0,0,40)
  T: {
    hueRange: [15, 240], // 빨강-보라 범위 (빨강, 초록, 보라, 파랑, 회색)
    saturationRange: [30, 90],
    lightnessRange: [15, 85],
    warmTone: false,
    includeNeutral: true,
    complementary: false,
  },
  // F (감정): ISFJ, ESFP, ESFJ, ISFP, ENFP, INFP, ENFJ, INFJ
  // 색상: Daffodil(45,85,75), Diva Pink(320,85,70), Fandango Pink(310,70,65), Sharp Green(120,80,50), Lemon Chrome(55,90,60), Cockatoo(180,70,65), Bluebird(210,80,55), Crystal Seas(200,60,75)
  F: {
    hueRange: [45, 320], // 노랑-핑크 범위 (노랑, 핑크, 초록, 청록, 파랑)
    saturationRange: [60, 90],
    lightnessRange: [50, 80],
    warmTone: true,
    includeNeutral: false,
    complementary: false,
  },
  // J (판단): ISFJ, ESFJ, ESTJ, ENFJ, INFJ, INTJ, ENTJ, ISTJ
  // 색상: Daffodil(45,85,75), Fandango Pink(310,70,65), Winter Green(150,60,40), Bluebird(210,80,55), Crystal Seas(200,60,75), Antarctica(0,0,85), Night Sky(0,0,15), Asphalt(0,0,40)
  J: {
    hueRange: [0, 360], // 전체 색조 범위
    saturationRange: [40, 85],
    lightnessRange: [15, 85],
    warmTone: false,
    includeNeutral: true,
    complementary: true,
    colorScheme: 'analogous',
    orderliness: 'high',
  },
  // P (인식): ESFP, ESTP, ISFP, ENFP, ENTP, INFP, INTP, ISTP
  // 색상: Diva Pink(320,85,70), Flame Scarlet(15,90,60), Sharp Green(120,80,50), Lemon Chrome(55,90,60), Goji Berry(350,75,45), Cockatoo(180,70,65), Forget-Me-Not(240,50,70), Blueprint(220,85,35)
  P: {
    hueRange: [0, 360], // 전체 색조 범위
    saturationRange: [50, 90],
    lightnessRange: [35, 70],
    warmTone: false,
    includeNeutral: false,
    complementary: false,
    colorScheme: 'random',
    orderliness: 'low',
  },
};

/**
 * HSL을 RGB로 변환
 */
function hslToRgb(h: number, s: number, l: number): ColorRGB {
  const normalizedH = h / 360;
  const normalizedS = s / 100;
  const normalizedL = l / 100;

  const c = (1 - Math.abs(2 * normalizedL - 1)) * normalizedS;
  const x = c * (1 - Math.abs(((normalizedH * 6) % 2) - 1));
  const m = normalizedL - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (normalizedH >= 0 && normalizedH < 1 / 6) {
    r = c;
    g = x;
    b = 0;
  } else if (1 / 6 <= normalizedH && normalizedH < 2 / 6) {
    r = x;
    g = c;
    b = 0;
  } else if (2 / 6 <= normalizedH && normalizedH < 3 / 6) {
    r = 0;
    g = c;
    b = x;
  } else if (3 / 6 <= normalizedH && normalizedH < 4 / 6) {
    r = 0;
    g = x;
    b = c;
  } else if (4 / 6 <= normalizedH && normalizedH < 5 / 6) {
    r = x;
    g = 0;
    b = c;
  } else if (5 / 6 <= normalizedH && normalizedH < 1) {
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
  // eslint-disable-next-line no-bitwise
  const hex = ((1 << 24) + (r << 16) + (g << 8) + b)
    .toString(16)
    .slice(1)
    .toUpperCase();
  return `#${hex}`;
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
 * 유사색상 생성 (J 타입용)
 */
function generateAnalogousColors(baseHue: number, count: number): number[] {
  const hues: number[] = [];
  const step = 30; // 30도씩 차이

  for (let i = 0; i < count; i += 1) {
    const offset = (i - Math.floor(count / 2)) * step;
    hues.push((baseHue + offset + 360) % 360);
  }

  return hues;
}

/**
 * 특정 MBTI 지표에 대한 색상 팔레트 생성 (기존 로직 유지)
 */
function generateColorPaletteForMBTI(indicator: MBTIIndicator): string[] {
  const rules = MBTI_COLOR_RULES[indicator];
  const palette: string[] = [];

  // J와 P에 대한 특별한 처리
  if (indicator === 'J') {
    // J: 체계적이고 정렬된 색상
    const baseHue = randomInRange(rules.hueRange[0], rules.hueRange[1]);

    if (rules.colorScheme === 'analogous') {
      // 유사색상 계열
      const hues = generateAnalogousColors(baseHue, 5);
      hues.forEach((hue) => {
        const saturation = randomInRange(
          rules.saturationRange[0],
          rules.saturationRange[1]
        );
        const lightness = randomInRange(
          rules.lightnessRange[0],
          rules.lightnessRange[1]
        );
        palette.push(hslToHex(hue, saturation, lightness));
      });
    } else if (rules.complementary) {
      // 보색 관계 활용
      const hues = [baseHue, getComplementaryHue(baseHue)];
      for (let i = 0; i < 5; i += 1) {
        const hue = hues[i % 2];
        const saturation = randomInRange(
          rules.saturationRange[0],
          rules.saturationRange[1]
        );
        const lightness = randomInRange(
          rules.lightnessRange[0],
          rules.lightnessRange[1]
        );
        palette.push(hslToHex(hue, saturation, lightness));
      }
    }
  } else if (indicator === 'P') {
    // P: 자유롭고 다양한 색상 조합
    for (let i = 0; i < 5; i += 1) {
      let saturation: number;
      let lightness: number;

      // 매우 다양한 색상 조합
      const hue = randomInRange(rules.hueRange[0], rules.hueRange[1]);
      saturation = randomInRange(
        rules.saturationRange[0],
        rules.saturationRange[1]
      );
      lightness = randomInRange(
        rules.lightnessRange[0],
        rules.lightnessRange[1]
      );

      // 중성색 포함 옵션 (P는 더 자주)
      if (rules.includeNeutral && Math.random() < 0.4) {
        saturation = randomInRange(0, 30);
      }

      // 대비가 큰 색상들 (밝기 차이)
      if (i > 0 && Math.random() < 0.6) {
        const prevLightness =
          (Number.parseInt(
            palette[palette.length - 1]?.slice(5, 7) ?? '80',
            16
          ) /
            255) *
          100;

        // 이전 색상과 대비되는 밝기
        lightness =
          prevLightness > 50 ? randomInRange(15, 45) : randomInRange(55, 85);
      }

      palette.push(hslToHex(hue, saturation, lightness));
    }
  } else {
    // 다른 지표들은 기존 로직 사용
    for (let i = 0; i < 5; i += 1) {
      let hue: number;
      let saturation: number;

      if (rules.complementary && i > 0 && Math.random() < 0.3) {
        // 30% 확률로 보색 관계 활용
        const baseHue =
          palette.length > 0
            ? (Number.parseInt(
                palette[palette.length - 1]?.slice(1, 3) ?? '0',
                16
              ) *
                360) /
              255
            : randomInRange(rules.hueRange[0], rules.hueRange[1]);
        hue = getComplementaryHue(baseHue);
      } else {
        hue = randomInRange(rules.hueRange[0], rules.hueRange[1]);
      }

      saturation = randomInRange(
        rules.saturationRange[0],
        rules.saturationRange[1]
      );
      const lightness = randomInRange(
        rules.lightnessRange[0],
        rules.lightnessRange[1]
      );

      // 무채색 포함 옵션
      if (rules.includeNeutral && Math.random() < 0.2) {
        saturation = randomInRange(0, 20);
      }

      palette.push(hslToHex(hue, saturation, lightness));
    }
  }

  return palette;
}

/**
 * MBTI 데이터셋 생성
 */
export function generateMBTIDataset(
  samplesPerIndicator: number = 1000
): Record<MBTIIndicator, MBTIData[]> {
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
    for (let i = 0; i < samplesPerIndicator; i += 1) {
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
  samples: number = 1000
): MBTIData[] {
  const data: MBTIData[] = [];

  for (let i = 0; i < samples; i += 1) {
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
export function formatDatasetForExport(
  dataset: Record<MBTIIndicator, MBTIData[]>
): Record<string, MBTIData[]> {
  return {
    'e-i': [...dataset.E, ...dataset.I],
    's-n': [...dataset.S, ...dataset.N],
    't-f': [...dataset.T, ...dataset.F],
    'j-p': [...dataset.J, ...dataset.P],
  };
}
