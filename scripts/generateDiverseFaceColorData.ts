/* eslint-disable max-classes-per-file */
/**
 * 얼굴 특징 기반 다양한 색상 패턴 생성 스크립트
 * MBTI 예측을 위한 색상 다양성 확보
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// 색상 팔레트 생성기
class ColorPaletteGenerator {
  /**
   * 다양한 색상 팔레트 생성 (감정에 국한되지 않음)
   */
  static generateDiversePalettes(count: number = 1000): Array<{
    colors: string[];
    characteristics: {
      brightness: number;
      saturation: number;
      temperature: number;
      contrast: number;
      harmony: number;
    };
    category: string;
  }> {
    const palettes = [];

    // 1. 선명하고 대비가 강한 팔레트 (20%)
    const vibrantCount = Math.floor(count * 0.2);
    for (let i = 0; i < vibrantCount; i += 1) {
      palettes.push(this.generateVibrantPalette());
    }

    // 2. 부드럽고 조화로운 팔레트 (20%)
    const harmoniousCount = Math.floor(count * 0.2);
    for (let i = 0; i < harmoniousCount; i += 1) {
      palettes.push(this.generateHarmoniousPalette());
    }

    // 3. 차가운 톤 팔레트 (15%)
    const coolCount = Math.floor(count * 0.15);
    for (let i = 0; i < coolCount; i += 1) {
      palettes.push(this.generateCoolPalette());
    }

    // 4. 따뜻한 톤 팔레트 (15%)
    const warmCount = Math.floor(count * 0.15);
    for (let i = 0; i < warmCount; i += 1) {
      palettes.push(this.generateWarmPalette());
    }

    // 5. 중성 팔레트 (10%)
    const neutralCount = Math.floor(count * 0.1);
    for (let i = 0; i < neutralCount; i += 1) {
      palettes.push(this.generateNeutralPalette());
    }

    // 6. 대비 팔레트 (10%)
    const contrastCount = Math.floor(count * 0.1);
    for (let i = 0; i < contrastCount; i += 1) {
      palettes.push(this.generateContrastPalette());
    }

    // 7. 랜덤 조합 팔레트 (10%)
    const randomCount = Math.floor(count * 0.1);
    for (let i = 0; i < randomCount; i += 1) {
      palettes.push(this.generateRandomPalette());
    }

    return palettes;
  }

  /**
   * 선명하고 대비가 강한 팔레트
   */
  private static generateVibrantPalette() {
    const baseHue = Math.random() * 360;
    const colors = [];

    for (let i = 0; i < 5; i += 1) {
      const hue = (baseHue + i * 72 + Math.random() * 30 - 15) % 360;
      const saturation = 0.7 + Math.random() * 0.3; // 70-100%
      const lightness = 0.3 + Math.random() * 0.4; // 30-70%

      colors.push(this.hslToHex(hue, saturation, lightness));
    }

    return {
      colors,
      characteristics: {
        brightness: 0.6 + Math.random() * 0.3,
        saturation: 0.8 + Math.random() * 0.2,
        temperature: Math.random() * 2 - 1,
        contrast: 0.7 + Math.random() * 0.3,
        harmony: 0.4 + Math.random() * 0.3,
      },
      category: 'vibrant',
    };
  }

  /**
   * 부드럽고 조화로운 팔레트
   */
  private static generateHarmoniousPalette() {
    const baseHue = Math.random() * 360;
    const colors = [];

    for (let i = 0; i < 5; i += 1) {
      const hue = (baseHue + i * 15 + Math.random() * 10 - 5) % 360;
      const saturation = 0.3 + Math.random() * 0.4; // 30-70%
      const lightness = 0.4 + Math.random() * 0.4; // 40-80%

      colors.push(this.hslToHex(hue, saturation, lightness));
    }

    return {
      colors,
      characteristics: {
        brightness: 0.5 + Math.random() * 0.3,
        saturation: 0.4 + Math.random() * 0.3,
        temperature: Math.random() * 2 - 1,
        contrast: 0.2 + Math.random() * 0.3,
        harmony: 0.7 + Math.random() * 0.3,
      },
      category: 'harmonious',
    };
  }

  /**
   * 차가운 톤 팔레트
   */
  private static generateCoolPalette() {
    const baseHue = 180 + Math.random() * 120; // 파랑-초록 범위
    const colors = [];

    for (let i = 0; i < 5; i += 1) {
      const hue = (baseHue + Math.random() * 60 - 30) % 360;
      const saturation = 0.4 + Math.random() * 0.5;
      const lightness = 0.3 + Math.random() * 0.5;

      colors.push(this.hslToHex(hue, saturation, lightness));
    }

    return {
      colors,
      characteristics: {
        brightness: 0.4 + Math.random() * 0.4,
        saturation: 0.5 + Math.random() * 0.4,
        temperature: -0.5 - Math.random() * 0.5,
        contrast: 0.3 + Math.random() * 0.4,
        harmony: 0.6 + Math.random() * 0.3,
      },
      category: 'cool',
    };
  }

  /**
   * 따뜻한 톤 팔레트
   */
  private static generateWarmPalette() {
    const baseHue = Math.random() * 60 + 300; // 빨강-노랑 범위
    const colors = [];

    for (let i = 0; i < 5; i += 1) {
      const hue = (baseHue + Math.random() * 60 - 30) % 360;
      const saturation = 0.5 + Math.random() * 0.4;
      const lightness = 0.4 + Math.random() * 0.4;

      colors.push(this.hslToHex(hue, saturation, lightness));
    }

    return {
      colors,
      characteristics: {
        brightness: 0.5 + Math.random() * 0.4,
        saturation: 0.6 + Math.random() * 0.3,
        temperature: 0.5 + Math.random() * 0.5,
        contrast: 0.4 + Math.random() * 0.4,
        harmony: 0.5 + Math.random() * 0.3,
      },
      category: 'warm',
    };
  }

  /**
   * 중성 팔레트
   */
  private static generateNeutralPalette() {
    const colors = [];

    for (let i = 0; i < 5; i += 1) {
      const hue = Math.random() * 360;
      const saturation = Math.random() * 0.3; // 0-30%
      const lightness = 0.3 + Math.random() * 0.5;

      colors.push(this.hslToHex(hue, saturation, lightness));
    }

    return {
      colors,
      characteristics: {
        brightness: 0.4 + Math.random() * 0.4,
        saturation: 0.1 + Math.random() * 0.2,
        temperature: Math.random() * 0.4 - 0.2,
        contrast: 0.2 + Math.random() * 0.3,
        harmony: 0.8 + Math.random() * 0.2,
      },
      category: 'neutral',
    };
  }

  /**
   * 대비 팔레트
   */
  private static generateContrastPalette() {
    const colors = [];
    const baseHue = Math.random() * 360;

    for (let i = 0; i < 5; i += 1) {
      const hue = (baseHue + i * 72 + Math.random() * 20 - 10) % 360;
      const saturation = 0.6 + Math.random() * 0.4;
      const lightness =
        i % 2 === 0 ? 0.2 + Math.random() * 0.3 : 0.6 + Math.random() * 0.3;

      colors.push(this.hslToHex(hue, saturation, lightness));
    }

    return {
      colors,
      characteristics: {
        brightness: 0.4 + Math.random() * 0.4,
        saturation: 0.6 + Math.random() * 0.3,
        temperature: Math.random() * 2 - 1,
        contrast: 0.8 + Math.random() * 0.2,
        harmony: 0.3 + Math.random() * 0.3,
      },
      category: 'contrast',
    };
  }

  /**
   * 완전 랜덤 팔레트
   */
  private static generateRandomPalette() {
    const colors = [];

    for (let i = 0; i < 5; i += 1) {
      const hue = Math.random() * 360;
      const saturation = Math.random();
      const lightness = Math.random();

      colors.push(this.hslToHex(hue, saturation, lightness));
    }

    return {
      colors,
      characteristics: {
        brightness: Math.random(),
        saturation: Math.random(),
        temperature: Math.random() * 2 - 1,
        contrast: Math.random(),
        harmony: Math.random(),
      },
      category: 'random',
    };
  }

  /**
   * HSL을 HEX로 변환
   */
  private static hslToHex(h: number, s: number, l: number): string {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0;
    let g = 0;
    let b = 0;

    if (h >= 0 && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (h >= 60 && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (h >= 180 && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (h >= 240 && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else if (h >= 300 && h < 360) {
      r = c;
      g = 0;
      b = x;
    }

    const toHex = (n: number) => {
      const hex = Math.round((n + m) * 255).toString(16);
      return hex.length === 1 ? `0${hex}` : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
}

// 얼굴 특징 생성기
class FaceFeatureGen {
  /**
   * 다양한 얼굴 특징 벡터 생성 (128차원)
   */
  static generateFaceDescriptors(count: number = 1000): Array<{
    descriptor: number[];
    physicalFeatures: number[];
    characteristics: {
      faceShape: string;
      eyeSize: string;
      mouthSize: string;
      noseSize: string;
      jawline: string;
    };
  }> {
    const descriptors = [];

    for (let i = 0; i < count; i += 1) {
      // 128차원 얼굴 descriptor 생성
      const descriptor = this.generateFaceDescriptor();

      // 15차원 물리적 특징 생성
      const physicalFeatures = this.generatePhysicalFeatures();

      // 얼굴 특징 분석
      const characteristics = this.analyzeFaceCharacteristics(
        descriptor,
        physicalFeatures
      );

      descriptors.push({
        descriptor,
        physicalFeatures,
        characteristics,
      });
    }

    return descriptors;
  }

  /**
   * 얼굴 descriptor 생성 (128차원)
   */
  private static generateFaceDescriptor(): number[] {
    const descriptor = [];

    // 다양한 얼굴 패턴 생성
    for (let i = 0; i < 128; i += 1) {
      // 정규분포 기반 생성
      let value = this.generateGaussian(0, 1);

      // 특정 차원에 패턴 적용
      if (i < 32) {
        // 얼굴 전체적인 형태
        value *= 1.2;
      } else if (i < 64) {
        // 눈 영역
        value *= 0.8;
      } else if (i < 96) {
        // 코 영역
        value *= 0.6;
      } else {
        // 입 영역
        value *= 0.9;
      }

      descriptor.push(value);
    }

    return descriptor;
  }

  /**
   * 물리적 특징 생성 (15차원)
   */
  private static generatePhysicalFeatures(): number[] {
    return [
      Math.random(), // 얼굴 가로세로 비율
      Math.random(), // 턱선 각도
      Math.random(), // 이마 너비
      Math.random(), // 얼굴 대칭성
      Math.random(), // 눈 크기
      Math.random(), // 눈간 거리
      Math.random(), // 눈 높이
      Math.random(), // 눈 각도
      Math.random(), // 입 너비
      Math.random(), // 입 높이
      Math.random(), // 입술 두께
      Math.random(), // 코 길이
      Math.random(), // 코 너비
      Math.random(), // 상안면 비율
      Math.random(), // 하안면 비율
    ];
  }

  /**
   * 얼굴 특징 분석
   */
  private static analyzeFaceCharacteristics(
    _descriptor: number[],
    physicalFeatures: number[]
  ): {
    faceShape: string;
    eyeSize: string;
    mouthSize: string;
    noseSize: string;
    jawline: string;
  } {
    const faceRatio = physicalFeatures[0];
    const eyeSize = physicalFeatures[4];
    const mouthWidth = physicalFeatures[8];
    const noseWidth = physicalFeatures[12];
    const jawAngle = physicalFeatures[1];

    const getFaceShape = () => {
      if (faceRatio > 0.7) return 'round';
      if (faceRatio < 0.4) return 'long';
      return 'oval';
    };

    const getEyeSize = () => {
      if (eyeSize > 0.7) return 'large';
      if (eyeSize < 0.3) return 'small';
      return 'medium';
    };

    const getMouthSize = () => {
      if (mouthWidth > 0.7) return 'wide';
      if (mouthWidth < 0.3) return 'narrow';
      return 'medium';
    };

    const getNoseSize = () => {
      if (noseWidth > 0.7) return 'wide';
      if (noseWidth < 0.3) return 'narrow';
      return 'medium';
    };

    const getJawline = () => {
      if (jawAngle > 0.7) return 'angular';
      if (jawAngle < 0.3) return 'soft';
      return 'moderate';
    };

    return {
      faceShape: getFaceShape(),
      eyeSize: getEyeSize(),
      mouthSize: getMouthSize(),
      noseSize: getNoseSize(),
      jawline: getJawline(),
    };
  }

  /**
   * 가우시안 분포 생성
   */
  private static generateGaussian(mean: number, std: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * std + mean;
  }
}

// 16진수 색상을 RGB로 변환
function hexToRgbNormalized(hexColor: string): [number, number, number] {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255.0;
  const g = parseInt(hex.substring(2, 4), 16) / 255.0;
  const b = parseInt(hex.substring(4, 6), 16) / 255.0;
  return [r, g, b];
}

// 메인 데이터 생성 함수
function generateDiverseFaceColorDataset(sampleCount: number = 10000) {
  console.log(`🎨 ${sampleCount}개의 다양한 얼굴-색상 데이터 생성 시작...`);

  // 1. 다양한 색상 팔레트 생성
  console.log('🌈 다양한 색상 팔레트 생성 중...');
  const colorPalettes =
    ColorPaletteGenerator.generateDiversePalettes(sampleCount);

  // 2. 다양한 얼굴 특징 생성
  console.log('👤 다양한 얼굴 특징 생성 중...');
  const faceFeatures = FaceFeatureGen.generateFaceDescriptors(sampleCount);

  // 3. 데이터 매칭 및 조합
  console.log('🔗 얼굴-색상 데이터 매칭 중...');
  const dataset = [];

  for (let i = 0; i < sampleCount; i += 1) {
    const palette = colorPalettes[i];
    const face = faceFeatures[i];

    // 5차원 랜덤 시드 생성
    const randomSeed = Array.from({ length: 5 }, () => Math.random());

    // 148차원 입력 벡터 생성
    const inputVector = [
      ...face.descriptor, // 128차원
      ...face.physicalFeatures, // 15차원
      ...randomSeed, // 5차원
    ];

    // 15차원 RGB 벡터 생성
    const rgbVector: number[] = [];
    palette.colors.forEach((color) => {
      const [r, g, b] = hexToRgbNormalized(color);
      rgbVector.push(r, g, b);
    });

    dataset.push({
      input: inputVector,
      output: rgbVector,
      metadata: {
        colors: palette.colors,
        colorCharacteristics: palette.characteristics,
        colorCategory: palette.category,
        faceCharacteristics: face.characteristics,
        randomSeed,
      },
    });
  }

  console.log(`✅ ${dataset.length}개의 데이터 생성 완료!`);
  return dataset;
}

// 메인 실행 함수
async function main() {
  const OUTPUT_DIR = join(
    process.cwd(),
    'public',
    'data',
    'diverse-face-color'
  );
  const SAMPLE_COUNT = 20000; // 더 많은 샘플 생성

  // 출력 디렉토리 생성
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 출력 디렉토리 생성: ${OUTPUT_DIR}`);
  }

  try {
    // 데이터셋 생성
    console.log(`📊 ${SAMPLE_COUNT}개 샘플 생성 중...`);
    const dataset = generateDiverseFaceColorDataset(SAMPLE_COUNT);

    // 통계 정보 수집
    const colorCategories = dataset.reduce((acc, item) => {
      const category = item.metadata.colorCategory;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('📈 색상 카테고리 분포:');
    Object.entries(colorCategories).forEach(([category, count]) => {
      console.log(
        `  ${category}: ${count}개 (${((count / dataset.length) * 100).toFixed(
          1
        )}%)`
      );
    });

    // 데이터 저장
    const datasetPath = join(OUTPUT_DIR, 'diverse-face-color-dataset.json');
    writeFileSync(datasetPath, JSON.stringify(dataset, null, 2));
    console.log(`💾 데이터셋 저장 완료: ${datasetPath}`);

    // 학습용 형식으로 변환
    const trainingData = {
      X: dataset.map((item) => item.input),
      y: dataset.map((item) => item.output),
      metadata: dataset.map((item) => item.metadata),
    };

    const trainingPath = join(OUTPUT_DIR, 'training-data.json');
    writeFileSync(trainingPath, JSON.stringify(trainingData, null, 2));
    console.log(`💾 학습 데이터 저장 완료: ${trainingPath}`);

    console.log('\n🎉 다양한 얼굴-색상 데이터 생성 완료!');
    console.log(`📈 총 샘플 수: ${dataset.length}개`);
    console.log(`📁 저장 위치: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('❌ 데이터 생성 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
main().catch((error) => {
  console.error(error);
});
