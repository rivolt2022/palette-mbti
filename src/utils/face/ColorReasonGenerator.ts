/**
 * 색상 추출 근거를 생성하는 모듈
 * 얼굴 특징, 감정, 색상 분석을 바탕으로 사용자 친화적인 설명을 생성합니다.
 */

import { ColorPalette } from '../ColorMLUtils';

export interface ColorExtractionReason {
  // 얼굴 특징 분석
  faceCharacteristics: {
    faceShape: string; // 얼굴형 (동그란/긴/타원형)
    eyeSize: string; // 눈 크기
    emotionalImpact: string; // 감정이 색상에 미친 영향
  };
  // 색상 결정 요인
  colorDecisionFactors: {
    brightnessReason: string; // 밝기 결정 근거
    saturationReason: string; // 채도 결정 근거
    temperatureReason: string; // 색온도 결정 근거
    diversityApplied: boolean; // 다양성 강화 적용 여부
  };
  // 모델 처리 과정
  processingSteps: string[]; // 처리 단계별 설명
}

export class ColorReasonGenerator {
  /**
   * 색상 추출 근거를 생성합니다.
   */
  static generateColorReason(
    physicalFeatures: number[],
    emotion: string,
    randomSeed: number[],
    inputDim: number,
    palette: ColorPalette
  ): ColorExtractionReason {
    // 얼굴 특징 분석
    const faceCharacteristics =
      this.analyzeFaceCharacteristics(physicalFeatures);

    // 감정 영향 분석
    const emotionalImpact = this.analyzeEmotionalImpact(emotion);

    // 색상 결정 요인 분석
    const colorDecisionFactors = this.analyzeColorDecisionFactors(
      palette,
      emotion,
      inputDim
    );

    // 모델 처리 과정 생성
    const processingSteps = this.generateProcessingSteps(inputDim, randomSeed);

    return {
      faceCharacteristics: {
        faceShape: faceCharacteristics.faceShape,
        eyeSize: faceCharacteristics.eyeSize,
        emotionalImpact,
      },
      colorDecisionFactors: {
        brightnessReason: colorDecisionFactors.brightnessReason,
        saturationReason: colorDecisionFactors.saturationReason,
        temperatureReason: colorDecisionFactors.temperatureReason,
        diversityApplied: inputDim === 148,
      },
      processingSteps,
    };
  }

  /**
   * 얼굴 특징을 분석하여 친근한 설명을 생성합니다.
   */
  private static analyzeFaceCharacteristics(physicalFeatures: number[]): {
    faceShape: string;
    eyeSize: string;
  } {
    // 물리적 특징 배열에서 값 추출
    const aspectRatio = physicalFeatures[0]; // 얼굴 가로세로 비율
    const eyeSize = physicalFeatures[4]; // 눈 크기
    const jawAngle = physicalFeatures[1]; // 턱선 각도
    const symmetry = physicalFeatures[3]; // 얼굴 대칭성

    // 얼굴형 분석 (더 구체적이고 재미있게)
    let faceShape = '';
    if (aspectRatio > 0.7) {
      if (jawAngle > 0.6) {
        faceShape = '둥글둥글한 하트형 얼굴';
      } else {
        faceShape = '사과 같은 동그란 얼굴';
      }
    } else if (aspectRatio < 0.4) {
      if (jawAngle > 0.6) {
        faceShape = '각진 긴 얼굴 (모델 같은 비율!)';
      } else {
        faceShape = '우아한 긴 얼굴';
      }
    } else if (jawAngle > 0.6) {
      faceShape = '완벽한 타원형 얼굴 (황금비율!)';
    } else {
      faceShape = '고전적인 타원형 얼굴';
    }

    // 눈 크기 분석 (더 생동감 있게)
    let eyeSizeDesc = '';
    if (eyeSize > 0.7) {
      if (symmetry > 0.8) {
        eyeSizeDesc = '크고 대칭적인 눈 (완벽한 비율!)';
      } else {
        eyeSizeDesc = '크고 매력적인 눈';
      }
    } else if (eyeSize < 0.3) {
      if (symmetry > 0.8) {
        eyeSizeDesc = '작지만 균형 잡힌 눈';
      } else {
        eyeSizeDesc = '작고 독특한 눈';
      }
    } else if (symmetry > 0.8) {
      eyeSizeDesc = '보통 크기지만 완벽한 대칭의 눈';
    } else {
      eyeSizeDesc = '보통 크기의 귀여운 눈';
    }

    return { faceShape, eyeSize: eyeSizeDesc };
  }

  /**
   * 감정이 색상에 미친 영향을 분석합니다.
   */
  private static analyzeEmotionalImpact(emotion: string): string {
    const emotionDescriptions: { [key: string]: string } = {
      happy:
        '웃는 얼굴이 너무 밝아서! 마치 햇살처럼 따뜻하고 생동감 넘치는 색상들을 골랐어요! 마치 당신의 미소처럼 눈부신 팔레트가 완성되었답니다 ☀️✨',
      sad: '차분하고 우아한 표정이 느껴져서, 마치 비 오는 날의 하늘처럼 깊이 있고 신비로운 색상들을 선택했어요. 당신의 내면의 깊이를 표현하는 듯한 색감이에요 🌧️💙',
      angry:
        '강렬한 에너지가 느껴져서! 마치 폭풍처럼 강렬하고 대비가 뚜렷한 색상들을 골랐어요. 당신의 강인한 매력을 잘 드러내는 색감이에요 ⚡🔥',
      surprised:
        '놀란 표정이 너무 생생해서! 마치 폭죽이 터지는 순간처럼 밝고 역동적인 색상들을 선택했어요. 당신의 생동감이 그대로 전해지는 팔레트예요 🎆🎨',
      fearful:
        '조심스러운 표정이 느껴져서, 마치 달빛 아래의 호수처럼 차가우면서도 아름다운 색상들을 골랐어요. 신비롭고 우아한 느낌의 색감이에요 🌙💎',
      disgusted:
        '복잡한 감정이 느껴져서, 마치 가을 숲의 색깔처럼 자연스럽고 차분한 색상들을 선택했어요. 당신의 진정성을 담은 색감이에요 🍂🌿',
      neutral:
        '차분하고 균형 잡힌 표정이어서, 마치 클래식한 예술작품처럼 조화롭고 세련된 색상들을 골랐어요. 당신의 우아함이 잘 드러나는 팔레트예요 🎭🎨',
    };

    return emotionDescriptions[emotion] || emotionDescriptions.neutral;
  }

  /**
   * 색상 결정 요인을 분석합니다.
   */
  private static analyzeColorDecisionFactors(
    palette: ColorPalette,
    _emotion: string,
    _inputDim: number
  ): {
    brightnessReason: string;
    saturationReason: string;
    temperatureReason: string;
  } {
    // 색상 분석을 위한 RGB 값 추출
    const rgbValues = palette.colors.map((color) =>
      this.hexToRgbNormalized(color)
    );

    // 평균 밝기 계산
    const avgBrightness =
      rgbValues.reduce((sum, [r, g, b]) => {
        return sum + (r + g + b) / 3;
      }, 0) / rgbValues.length;

    // 평균 채도 계산 (HSL 변환)
    const avgSaturation =
      rgbValues.reduce((sum, [r, g, b]) => {
        const [, s] = this.rgbToHsl(r, g, b);
        return sum + s;
      }, 0) / rgbValues.length;

    // 색온도 계산 (빨강-파랑 비율)
    const avgTemperature =
      rgbValues.reduce((sum, [r, _g, b]) => {
        return sum + (r - b) / 2; // 빨강이 많으면 양수, 파랑이 많으면 음수
      }, 0) / rgbValues.length;

    // 밝기 근거 생성 (더 구체적이고 재미있게)
    let brightnessReason = '';
    if (avgBrightness > 0.7) {
      brightnessReason =
        '마치 아침 햇살처럼 밝고 환한 색상들이 선택되었어요! 당신의 밝은 피부 톤과 완벽하게 어울려서 더욱 생기있어 보일 거예요. 마치 당신의 긍정적인 에너지가 색깔로 번져나가는 것 같아요! ☀️✨';
    } else if (avgBrightness < 0.4) {
      brightnessReason =
        '깊고 신비로운 색상들이 선택되었어요. 마치 밤하늘의 별처럼 은은하게 빛나는 색감으로, 당신의 내면의 깊이와 우아함을 잘 표현해줄 거예요. 신비로운 매력이 더욱 돋보일 거예요! 🌙💫';
    } else {
      brightnessReason =
        '완벽한 균형의 색상들이 선택되었어요! 너무 밝지도 어둡지도 않은 황금비율의 밝기로, 어떤 상황에서도 당신을 돋보이게 해줄 거예요. 마치 클래식한 예술작품처럼 세련된 느낌이에요! ⚖️🎨';
    }

    // 채도 근거 생성 (더 생동감 있게)
    let saturationReason = '';
    if (avgSaturation > 0.7) {
      saturationReason =
        '마치 무지개처럼 선명하고 생동감 넘치는 색상들이 선택되었어요! 당신의 활기찬 에너지가 그대로 전해지는 색감으로, 어디를 가든 시선을 사로잡을 거예요. 마치 당신의 열정이 색깔로 폭발하는 것 같아요! 🌈⚡';
    } else if (avgSaturation < 0.4) {
      saturationReason =
        '부드럽고 우아한 색상들이 선택되었어요. 마치 파스텔 그림처럼 은은하고 세련된 색감으로, 당신의 차분하고 고급스러운 매력을 잘 드러내줄 거예요. 편안하면서도 세련된 느낌이에요! 🌸💎';
    } else {
      saturationReason =
        '완벽한 조화의 색상들이 선택되었어요! 너무 강하지도 약하지도 않은 적당한 채도로, 당신의 균형 잡힌 매력을 완벽하게 표현해줄 거예요. 마치 베테랑 아티스트가 조화롭게 배치한 색감이에요! 🎯🎭';
    }

    // 색온도 근거 생성 (더 감성적으로)
    let temperatureReason = '';
    if (avgTemperature > 0.2) {
      temperatureReason =
        '마치 따뜻한 불꽃처럼 따뜻한 색상들이 선택되었어요! 빨강, 주황, 노랑 계열의 색감으로, 당신의 따뜻하고 친근한 매력을 완벽하게 표현해줄 거예요. 마치 포근한 포옹을 받는 것 같은 색감이에요! 🔥🤗';
    } else if (avgTemperature < -0.2) {
      temperatureReason =
        '마치 시원한 바다처럼 차가운 색상들이 선택되었어요! 파랑, 보라, 초록 계열의 색감으로, 당신의 신비롭고 우아한 매력을 잘 드러내줄 거예요. 마치 달빛 아래에서 반짝이는 보석 같은 색감이에요! ❄️💎';
    } else {
      temperatureReason =
        '따뜻함과 차가움의 완벽한 조화예요! 마치 봄날의 하늘처럼 중성적이면서도 아름다운 색감으로, 당신의 균형 잡힌 매력을 완벽하게 표현해줄 거예요. 어떤 스타일과도 잘 어울리는 만능 색감이에요! 🌊🌈';
    }

    return { brightnessReason, saturationReason, temperatureReason };
  }

  /**
   * AI 처리 과정을 설명하는 단계들을 생성합니다.
   */
  private static generateProcessingSteps(
    inputDim: number,
    _randomSeed: number[]
  ): string[] {
    const steps = [
      '📸 업로드된 사진을 스캔해서 얼굴을 정확히 찾아냈어요! (마치 탐정이 단서를 찾는 것처럼!)',
      '🔍 68개의 얼굴 특징점을 하나하나 정밀하게 분석했어요 (눈, 코, 입, 턱선까지 꼼꼼히!)',
      '🧠 128차원의 얼굴 특징 벡터를 추출했어요 (당신만의 고유한 얼굴 DNA를 만들었어요!)',
    ];

    if (inputDim === 148) {
      steps.push(
        '👤 15가지 물리적 특징을 세밀하게 분석했어요 (얼굴형, 눈 크기, 입 모양, 코 모양까지!)'
      );
      steps.push(
        '🎲 5개의 특별한 랜덤 시드를 생성해서 색상 다양성을 극대화했어요 (마치 마법의 주문처럼!)'
      );
      steps.push(
        '🤖 148차원 입력으로 최첨단 AI 모델이 당신만의 색상을 예측했어요 (미래 기술의 힘!)'
      );
    } else {
      steps.push(
        '🤖 128차원 입력으로 AI 모델이 당신만의 색상을 예측했어요 (인공지능의 마법!)'
      );
    }

    steps.push(
      '😊 감정 분석 결과를 반영해서 색상을 미세조정했어요 (당신의 마음을 색깔로 표현!)'
    );
    steps.push(
      '✨ 최종적으로 5가지 완벽하게 조화로운 색상을 선택했어요 (마치 마스터 아티스트의 작품처럼!)'
    );

    return steps;
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
}
