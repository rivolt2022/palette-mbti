/**
 * 감정에 따른 색상 조정 및 다양성 강화 유틸리티
 */

import { ColorPalette } from '../ColorMLUtils';

export class ColorAdjuster {
  /**
   * 감정에 따라 색상을 조정하는 함수
   */
  static adjustColorsForEmotion(
    palette: ColorPalette,
    emotion: string
  ): ColorPalette {
    const adjustedColors = palette.colors.map((color) => {
      const [r, g, b] = this.hexToRgbNormalized(color);
      let [h, s, l] = this.rgbToHsl(r, g, b);

      switch (emotion) {
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
   * 색상 다양성을 강화하는 함수 (MBTI 예측을 위한 대폭 개선)
   */
  static enhanceColorDiversity(
    palette: ColorPalette,
    randomSeed: number[],
    _emotion?: string
  ): ColorPalette {
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
      const hueVariation = (seed - 0.5) * 180 + colorIndex * 72; // ±90도 + 색상별 72도씩 차이
      const saturationVariation = (seed - 0.5) * 0.6; // ±30% 채도 변화
      const lightnessVariation = (seed - 0.5) * 0.4; // ±20% 밝기 변화

      // 색상 변형 적용
      hue = (hue + hueVariation + 360) % 360;
      saturation = Math.max(0, Math.min(1, saturation + saturationVariation));
      lightness = Math.max(0, Math.min(1, lightness + lightnessVariation));

      // 색상 카테고리별 특별 처리 (색상 인덱스 기반)
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
   * 16진수 색상을 RGB로 변환 (0-1 범위)
   */
  private static hexToRgbNormalized(
    hexColor: string
  ): [number, number, number] {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return [r, g, b];
  }

  /**
   * RGB 값을 16진수 색상으로 변환
   */
  private static rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
      const hex = Math.round(n * 255).toString(16);
      return hex.length === 1 ? `0${hex}` : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * RGB를 HSL로 변환
   */
  private static rgbToHsl(
    r: number,
    g: number,
    b: number
  ): [number, number, number] {
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
  private static hslToRgb(
    h: number,
    s: number,
    l: number
  ): [number, number, number] {
    const hue = h / 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((hue * 6) % 2) - 1));
    const m = l - c / 2;

    let r = 0;
    let g = 0;
    let b = 0;

    if (hue >= 0 && hue < 1 / 6) {
      r = c;
      g = x;
      b = 0;
    } else if (1 / 6 <= hue && hue < 2 / 6) {
      r = x;
      g = c;
      b = 0;
    } else if (2 / 6 <= hue && hue < 3 / 6) {
      r = 0;
      g = c;
      b = x;
    } else if (3 / 6 <= hue && hue < 4 / 6) {
      r = 0;
      g = x;
      b = c;
    } else if (4 / 6 <= hue && hue < 5 / 6) {
      r = x;
      g = 0;
      b = c;
    } else if (5 / 6 <= hue && hue < 1) {
      r = c;
      g = 0;
      b = x;
    }

    return [r + m, g + m, b + m];
  }
}
