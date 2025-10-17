/**
 * 얼굴 랜드마크에서 물리적 특징을 추출하는 클래스
 * 68포인트 랜드마크에서 15차원의 특징 벡터를 생성합니다.
 */

export interface FaceLandmarks {
  positions: Array<{ x: number; y: number }>;
}

export interface FaceFeatures {
  // 얼굴형 특징 (4차원)
  faceShape: {
    aspectRatio: number; // 얼굴 가로세로 비율
    jawAngle: number; // 턱선 각도
    foreheadWidth: number; // 이마 너비
    symmetry: number; // 얼굴 대칭성
  };

  // 눈 특징 (4차원)
  eyeFeatures: {
    eyeSize: number; // 눈 크기
    eyeDistance: number; // 눈간 거리
    eyeHeight: number; // 눈 높이
    eyeAngle: number; // 눈 각도
  };

  // 입 특징 (3차원)
  mouthFeatures: {
    mouthWidth: number; // 입 너비
    mouthHeight: number; // 입 높이
    lipThickness: number; // 입술 두께
  };

  // 코 특징 (2차원)
  noseFeatures: {
    noseLength: number; // 코 길이
    noseWidth: number; // 코 너비
  };

  // 전체 비율 (2차원)
  faceProportions: {
    upperFaceRatio: number; // 얼굴 상단 비율
    lowerFaceRatio: number; // 얼굴 하단 비율
  };
}

export class FaceFeatureExtractor {
  /**
   * 68포인트 랜드마크에서 15차원 특징 벡터를 추출합니다.
   */
  static extractFeatures(landmarks: FaceLandmarks): number[] {
    if (
      !landmarks ||
      !landmarks.positions ||
      landmarks.positions.length !== 68
    ) {
      throw new Error('68포인트 랜드마크가 필요합니다.');
    }

    const points = landmarks.positions;
    const features = this.calculateAllFeatures(points);

    // 15차원 벡터로 변환
    return [
      // 얼굴형 특징 (4차원)
      features.faceShape.aspectRatio,
      features.faceShape.jawAngle,
      features.faceShape.foreheadWidth,
      features.faceShape.symmetry,

      // 눈 특징 (4차원)
      features.eyeFeatures.eyeSize,
      features.eyeFeatures.eyeDistance,
      features.eyeFeatures.eyeHeight,
      features.eyeFeatures.eyeAngle,

      // 입 특징 (3차원)
      features.mouthFeatures.mouthWidth,
      features.mouthFeatures.mouthHeight,
      features.mouthFeatures.lipThickness,

      // 코 특징 (2차원)
      features.noseFeatures.noseLength,
      features.noseFeatures.noseWidth,

      // 전체 비율 (2차원)
      features.faceProportions.upperFaceRatio,
      features.faceProportions.lowerFaceRatio,
    ];
  }

  /**
   * 모든 얼굴 특징을 계산합니다.
   */
  private static calculateAllFeatures(
    points: Array<{ x: number; y: number }>
  ): FaceFeatures {
    return {
      faceShape: this.calculateFaceShapeFeatures(points),
      eyeFeatures: this.calculateEyeFeatures(points),
      mouthFeatures: this.calculateMouthFeatures(points),
      noseFeatures: this.calculateNoseFeatures(points),
      faceProportions: this.calculateFaceProportions(points),
    };
  }

  /**
   * 얼굴형 특징 계산 (4차원)
   */
  private static calculateFaceShapeFeatures(
    points: Array<{ x: number; y: number }>
  ): FaceFeatures['faceShape'] {
    // 얼굴 경계점들 (얼굴 윤곽선)
    const faceOutline = points.slice(0, 17); // 0-16: 얼굴 윤곽선
    const leftJaw = points.slice(0, 9); // 0-8: 왼쪽 턱선
    const rightJaw = points.slice(8, 17); // 8-16: 오른쪽 턱선

    // 얼굴 가로세로 비율
    const faceWidth =
      Math.max(...faceOutline.map((p) => p.x)) -
      Math.min(...faceOutline.map((p) => p.x));
    const faceHeight =
      Math.max(...faceOutline.map((p) => p.y)) -
      Math.min(...faceOutline.map((p) => p.y));
    const aspectRatio = faceWidth / faceHeight;

    // 턱선 각도 (왼쪽과 오른쪽 턱선의 평균 각도)
    const leftJawAngle = this.calculateJawAngle(leftJaw);
    const rightJawAngle = this.calculateJawAngle(rightJaw.reverse());
    const jawAngle = (leftJawAngle + rightJawAngle) / 2;

    // 이마 너비 (눈썹 끝점들 사이의 거리)
    const leftEyebrow = points[17]; // 왼쪽 눈썹 끝
    const rightEyebrow = points[26]; // 오른쪽 눈썹 끝
    const foreheadWidth = Math.abs(rightEyebrow.x - leftEyebrow.x) / faceWidth;

    // 얼굴 대칭성 (왼쪽과 오른쪽 특징점들의 대칭성)
    const symmetry = this.calculateFaceSymmetry(points);

    return {
      aspectRatio: this.normalizeValue(aspectRatio, 0.5, 2.0),
      jawAngle: this.normalizeValue(jawAngle, -45, 45),
      foreheadWidth: this.normalizeValue(foreheadWidth, 0.2, 0.8),
      symmetry: this.normalizeValue(symmetry, 0, 1),
    };
  }

  /**
   * 눈 특징 계산 (4차원)
   */
  private static calculateEyeFeatures(
    points: Array<{ x: number; y: number }>
  ): FaceFeatures['eyeFeatures'] {
    // 왼쪽 눈 (36-41)
    const leftEye = points.slice(36, 42);
    // 오른쪽 눈 (42-47)
    const rightEye = points.slice(42, 48);

    // 눈 크기 (두 눈의 평균 크기)
    const leftEyeSize = this.calculateEyeSize(leftEye);
    const rightEyeSize = this.calculateEyeSize(rightEye);
    const eyeSize = (leftEyeSize + rightEyeSize) / 2;

    // 눈간 거리
    const leftEyeCenter = this.getEyeCenter(leftEye);
    const rightEyeCenter = this.getEyeCenter(rightEye);
    const eyeDistance = Math.abs(rightEyeCenter.x - leftEyeCenter.x);

    // 눈 높이 (눈의 세로 크기)
    const leftEyeHeight =
      Math.max(...leftEye.map((p) => p.y)) -
      Math.min(...leftEye.map((p) => p.y));
    const rightEyeHeight =
      Math.max(...rightEye.map((p) => p.y)) -
      Math.min(...rightEye.map((p) => p.y));
    const eyeHeight = (leftEyeHeight + rightEyeHeight) / 2;

    // 눈 각도 (두 눈의 평균 각도)
    const leftEyeAngle = this.calculateEyeAngle(leftEye);
    const rightEyeAngle = this.calculateEyeAngle(rightEye);
    const eyeAngle = (leftEyeAngle + rightEyeAngle) / 2;

    return {
      eyeSize: this.normalizeValue(eyeSize, 10, 50),
      eyeDistance: this.normalizeValue(eyeDistance, 20, 80),
      eyeHeight: this.normalizeValue(eyeHeight, 5, 25),
      eyeAngle: this.normalizeValue(eyeAngle, -15, 15),
    };
  }

  /**
   * 입 특징 계산 (3차원)
   */
  private static calculateMouthFeatures(
    points: Array<{ x: number; y: number }>
  ): FaceFeatures['mouthFeatures'] {
    // 입 (48-67)
    const mouth = points.slice(48, 68);

    // 입 너비
    const mouthWidth =
      Math.max(...mouth.map((p) => p.x)) - Math.min(...mouth.map((p) => p.x));

    // 입 높이
    const mouthHeight =
      Math.max(...mouth.map((p) => p.y)) - Math.min(...mouth.map((p) => p.y));

    // 입술 두께 (상하 입술의 평균 두께)
    const upperLip = mouth.slice(0, 12); // 상입술
    const lowerLip = mouth.slice(12, 20); // 하입술
    const upperLipThickness = this.calculateLipThickness(upperLip);
    const lowerLipThickness = this.calculateLipThickness(lowerLip);
    const lipThickness = (upperLipThickness + lowerLipThickness) / 2;

    return {
      mouthWidth: this.normalizeValue(mouthWidth, 20, 80),
      mouthHeight: this.normalizeValue(mouthHeight, 5, 30),
      lipThickness: this.normalizeValue(lipThickness, 2, 15),
    };
  }

  /**
   * 코 특징 계산 (2차원)
   */
  private static calculateNoseFeatures(
    points: Array<{ x: number; y: number }>
  ): FaceFeatures['noseFeatures'] {
    // 코 (27-35)
    const nose = points.slice(27, 36);

    // 코 길이
    const noseLength =
      Math.max(...nose.map((p) => p.y)) - Math.min(...nose.map((p) => p.y));

    // 코 너비 (코 끝 부분의 너비)
    const noseTip = points.slice(31, 36);
    const noseWidth =
      Math.max(...noseTip.map((p) => p.x)) -
      Math.min(...noseTip.map((p) => p.x));

    return {
      noseLength: this.normalizeValue(noseLength, 15, 50),
      noseWidth: this.normalizeValue(noseWidth, 8, 25),
    };
  }

  /**
   * 얼굴 비율 계산 (2차원)
   */
  private static calculateFaceProportions(
    points: Array<{ x: number; y: number }>
  ): FaceFeatures['faceProportions'] {
    const faceOutline = points.slice(0, 17);
    const faceTop = Math.min(...faceOutline.map((p) => p.y));
    const faceBottom = Math.max(...faceOutline.map((p) => p.y));
    const faceHeight = faceBottom - faceTop;

    // 눈썹 위치 (얼굴 상단에서의 비율)
    const eyebrowY = (points[19].y + points[24].y) / 2; // 눈썹 중앙
    const upperFaceRatio = (eyebrowY - faceTop) / faceHeight;

    // 입 위치 (얼굴 하단에서의 비율)
    const mouthY = (points[51].y + points[57].y) / 2; // 입 중앙
    const lowerFaceRatio = (faceBottom - mouthY) / faceHeight;

    return {
      upperFaceRatio: this.normalizeValue(upperFaceRatio, 0.1, 0.4),
      lowerFaceRatio: this.normalizeValue(lowerFaceRatio, 0.1, 0.4),
    };
  }

  // 헬퍼 메서드들

  private static calculateJawAngle(
    jawPoints: Array<{ x: number; y: number }>
  ): number {
    if (jawPoints.length < 2) return 0;

    const first = jawPoints[0];
    const last = jawPoints[jawPoints.length - 1];
    const angle =
      Math.atan2(last.y - first.y, last.x - first.x) * (180 / Math.PI);
    return angle;
  }

  private static calculateFaceSymmetry(
    points: Array<{ x: number; y: number }>
  ): number {
    // 얼굴 중앙선 기준으로 대칭성 계산
    const faceCenterX =
      (Math.min(...points.map((p) => p.x)) +
        Math.max(...points.map((p) => p.x))) /
      2;

    // 대칭성 계산을 위한 변수들 (현재는 사용하지 않음)
    // const symmetrySum = 0;
    // const count = 0;

    // 대칭점들 비교 (예: 왼쪽 눈썹 vs 오른쪽 눈썹)
    const leftEye = points[36];
    const rightEye = points[45];
    const leftNostril = points[31];
    const rightNostril = points[35];

    const eyeSymmetry =
      1 - Math.abs(leftEye.x - faceCenterX + (rightEye.x - faceCenterX)) / 100;
    const noseSymmetry =
      1 -
      Math.abs(leftNostril.x - faceCenterX + (rightNostril.x - faceCenterX)) /
        50;

    return (eyeSymmetry + noseSymmetry) / 2;
  }

  private static calculateEyeSize(
    eyePoints: Array<{ x: number; y: number }>
  ): number {
    const width =
      Math.max(...eyePoints.map((p) => p.x)) -
      Math.min(...eyePoints.map((p) => p.x));
    const height =
      Math.max(...eyePoints.map((p) => p.y)) -
      Math.min(...eyePoints.map((p) => p.y));
    return Math.sqrt(width * width + height * height);
  }

  private static getEyeCenter(eyePoints: Array<{ x: number; y: number }>): {
    x: number;
    y: number;
  } {
    const avgX = eyePoints.reduce((sum, p) => sum + p.x, 0) / eyePoints.length;
    const avgY = eyePoints.reduce((sum, p) => sum + p.y, 0) / eyePoints.length;
    return { x: avgX, y: avgY };
  }

  private static calculateEyeAngle(
    eyePoints: Array<{ x: number; y: number }>
  ): number {
    if (eyePoints.length < 2) return 0;

    const left = eyePoints[0];
    const right = eyePoints[eyePoints.length - 1];
    const angle =
      Math.atan2(right.y - left.y, right.x - left.x) * (180 / Math.PI);
    return angle;
  }

  private static calculateLipThickness(
    lipPoints: Array<{ x: number; y: number }>
  ): number {
    if (lipPoints.length < 2) return 0;

    const top = Math.min(...lipPoints.map((p) => p.y));
    const bottom = Math.max(...lipPoints.map((p) => p.y));
    return bottom - top;
  }

  /**
   * 값을 0-1 범위로 정규화합니다.
   */
  private static normalizeValue(
    value: number,
    min: number,
    max: number
  ): number {
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  /**
   * 랜덤 시드 5개를 생성합니다.
   */
  static generateRandomSeed(seed?: number): number[] {
    if (seed !== undefined) {
      // 시드가 주어진 경우 재현 가능한 랜덤 생성
      const random = this.seededRandom(seed);
      return Array.from({ length: 5 }, () => random());
    }
    // 시드가 없는 경우 완전 랜덤
    return Array.from({ length: 5 }, () => Math.random());
  }

  /**
   * 시드 기반 랜덤 생성기
   */
  private static seededRandom(seed: number): () => number {
    let currentSeed = seed;
    return () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };
  }
}
