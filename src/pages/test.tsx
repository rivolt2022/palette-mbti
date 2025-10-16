import React from 'react';

import { GetStaticProps } from 'next';

import { MBTIPredictor } from '@/utils/MBTIPredictor';

import { IBlogGalleryProps } from '../blog/BlogGallery';
import { Meta } from '../layout/Meta';
import { IPaginationProps } from '../pagination/Pagination';
import { Main } from '../templates/Main';
import { AppConfig } from '../utils/AppConfig';
import {
  ColorAnalyzer,
  ColorPalette,
  hexToRgbNormalized,
  paletteToVector,
} from '../utils/ColorMLUtils';
import { getAllPosts } from '../utils/Content';
import {
  FaceColorPredictor,
  ColorRecommendationResult,
} from '../utils/FaceColorPredictor';
// import { MBTIPredictor } from '../utils/MBTIPredictor';

// 얼굴 기반 색상 추천 컴포넌트
const FaceColorTest = () => {
  const [faceColorResult, setFaceColorResult] =
    React.useState<ColorRecommendationResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [faceColorPredictor, setFaceColorPredictor] =
    React.useState<FaceColorPredictor | null>(null);
  const [mbtiPrediction, setMbtiPrediction] = React.useState<any>(null);
  const [mbtiPredictor, setMbtiPredictor] =
    React.useState<MBTIPredictor | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  // 모델 초기화 (클라이언트 사이드에서만)
  React.useEffect(() => {
    const initPredictors = async () => {
      // 클라이언트 사이드에서만 실행
      if (typeof window === 'undefined') return;

      try {
        const facePredictor = new FaceColorPredictor();
        const mbtiPred = new MBTIPredictor();

        await Promise.all([
          facePredictor.loadAllModels(),
          mbtiPred.loadModels(),
        ]);

        setFaceColorPredictor(facePredictor);
        setMbtiPredictor(mbtiPred);
        console.log('✅ 모든 모델 로드 완료');
      } catch (error) {
        console.error('❌ 모델 로드 실패:', error);
      }
    };
    initPredictors();
  }, []);

  // 파일 선택 핸들러
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      // 이미지 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 얼굴 분석 및 색상 추천 실행
  const analyzeFace = async () => {
    if (!selectedFile || !faceColorPredictor) return;

    setIsLoading(true);
    try {
      const result = await faceColorPredictor.recommendColorsFromFile(
        selectedFile
      );
      setFaceColorResult(result);

      // MBTI 예측도 함께 실행
      if (mbtiPredictor) {
        try {
          console.log('MBTI 예측 시작...', result.palette);
          const mbtiResult = await mbtiPredictor.predictMBTI(result.palette);
          console.log('MBTI 예측 결과:', mbtiResult);
          setMbtiPrediction(mbtiResult);
        } catch (mbtiError) {
          console.error('MBTI 예측 실패:', mbtiError);
        }
      } else {
        console.log('MBTI 예측기 없음');
      }
    } catch (error) {
      console.error('얼굴 분석 실패:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : '알 수 없는 오류가 발생했습니다.';
      alert(
        `얼굴 분석에 실패했습니다: ${errorMessage}\n\n다른 이미지를 시도해보세요.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">🎭 얼굴 기반 색상 추천</h2>

      {/* 파일 업로드 섹션 */}
      <div className="mb-8 p-6 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">1. 얼굴 사진 업로드</h3>

        <div className="mb-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-500 mt-2">
            💡 팁: 얼굴이 명확하게 보이는 사진을 업로드해주세요. (정면, 조명이
            좋은 사진)
          </p>
        </div>

        {imagePreview && (
          <div className="mb-4">
            <h4 className="text-md font-medium mb-2">이미지 미리보기:</h4>
            <img
              src={imagePreview}
              alt="업로드된 이미지"
              className="max-w-xs max-h-64 object-contain border rounded"
            />
          </div>
        )}

        <button
          onClick={analyzeFace}
          disabled={!selectedFile || isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? '분석 중...' : '얼굴 분석 및 색상 추천'}
        </button>
      </div>

      {/* 결과 표시 섹션 */}
      {faceColorResult && (
        <div className="space-y-6">
          {/* 감정 분석 결과 */}
          <div className="p-4 bg-green-100 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              😊 감정 분석 결과
            </h3>
            <p className="text-green-700">
              <strong>감정:</strong> {faceColorResult.emotion}
              <span className="ml-2">
                <strong>신뢰도:</strong>{' '}
                {(faceColorResult.confidence * 100).toFixed(1)}%
              </span>
            </p>
          </div>

          {/* 추천 색상 팔레트 */}
          <div className="p-4 bg-blue-100 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              🎨 추천 색상 팔레트
            </h3>

            <div className="flex gap-3 mb-4">
              {faceColorResult.palette.colors.map((color, index) => (
                <div
                  key={index}
                  className="w-16 h-16 rounded-lg border-2 border-white shadow-lg"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            <div className="text-sm text-blue-700">
              <p>
                <strong>색상 코드:</strong>{' '}
                {faceColorResult.palette.colors.join(', ')}
              </p>
            </div>
          </div>

          {/* MBTI 예측 결과 */}
          {mbtiPrediction && (
            <div className="p-4 bg-purple-100 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800 mb-2">
                🧠 MBTI 예측 결과
              </h3>
              <p className="text-purple-700">
                <strong>예측된 MBTI:</strong> {mbtiPrediction.mbti}
                <span className="ml-2">
                  <strong>신뢰도:</strong>{' '}
                  {(mbtiPrediction.confidence * 100).toFixed(1)}%
                </span>
              </p>

              <div className="mt-2 text-sm">
                <h4 className="font-medium mb-1">세부 지표:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {mbtiPrediction.predictions.map(
                    (pred: any, index: number) => (
                      <div key={index} className="text-xs">
                        <span className="font-medium">
                          {pred.indicator.toUpperCase()}:
                        </span>{' '}
                        {pred.prediction}
                        <span className="ml-1">
                          ({(pred.confidence * 100).toFixed(0)}%)
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 모델 상태 표시 */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">📊 모델 상태</h3>
        <div className="text-sm text-gray-600">
          {faceColorPredictor && (
            <p>
              얼굴-색상 모델:{' '}
              {faceColorPredictor.getModelStatus().isAllLoaded
                ? '✅ 로드됨'
                : '❌ 로딩 중'}
            </p>
          )}
          {mbtiPredictor && (
            <p>
              MBTI 모델:{' '}
              {mbtiPredictor.getModelStatus().isLoaded
                ? '✅ 로드됨'
                : '❌ 로딩 중'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ColorMLUtils 테스트용 컴포넌트
const ColorMLTest = () => {
  const [mlPredictions, setMlPredictions] = React.useState<{
    [key: number]: any;
  }>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [predictor, setPredictor] = React.useState<MBTIPredictor | null>(null);

  // 테스트용 색상 팔레트들
  const testPalettes: ColorPalette[] = [
    { colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'] }, // 따뜻한 색상
    { colors: ['#2C3E50', '#34495E', '#7F8C8D', '#95A5A6', '#BDC3C7'] }, // 차가운 색상
    { colors: ['#E74C3C', '#E67E22', '#F39C12', '#F1C40F', '#2ECC71'] }, // 밝은 색상
    { colors: ['#8E44AD', '#9B59B6', '#3498DB', '#2980B9', '#1ABC9C'] }, // 보라-파랑 계열
  ];

  // ML 모델 초기화
  React.useEffect(() => {
    const initPredictor = async () => {
      const newPredictor = new MBTIPredictor();
      try {
        await newPredictor.loadModels();
        setPredictor(newPredictor);
        // ML 모델 로드 완료
      } catch (error) {
        // ML 모델 로드 실패
      }
    };
    initPredictor();
  }, []);

  // ML 예측 실행
  const runMLPrediction = async (palette: ColorPalette, index: number) => {
    if (!predictor) return;

    setIsLoading(true);
    try {
      const result = await predictor.predictMBTI(palette);
      setMlPredictions((prev) => ({
        ...prev,
        [index]: result,
      }));
    } catch (error) {
      // ML 예측 실패
    } finally {
      setIsLoading(false);
    }
  };

  const analyzePalette = (palette: ColorPalette, index: number) => {
    const brightness = ColorAnalyzer.getAverageBrightness(palette);
    const saturation = ColorAnalyzer.getAverageSaturation(palette);
    const temperature = ColorAnalyzer.getColorTemperature(palette);
    const vector = paletteToVector(palette);
    const mlPrediction = mlPredictions[index];

    return (
      <div key={index} className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-3">팔레트 {index + 1}</h3>

        {/* 색상 표시 */}
        <div className="flex gap-2 mb-4">
          {palette.colors.map((color, i) => (
            <div
              key={i}
              className="w-12 h-12 rounded border"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        {/* ML 모델 예측 */}
        <div className="mb-4">
          <div className="p-4 bg-green-100 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">
              🤖 ML 모델 예측
            </h4>
            {mlPrediction ? (
              <div>
                <div className="text-2xl font-bold text-green-800 mb-2">
                  {mlPrediction.mbti}
                </div>
                <div className="text-sm text-green-700 mb-2">
                  전체 신뢰도: {(mlPrediction.confidence * 100).toFixed(1)}%
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-green-600">
                  {mlPrediction.predictions.map((pred: any) => (
                    <div
                      key={pred.indicator}
                      className="bg-green-50 p-2 rounded"
                    >
                      <strong>{pred.indicator.toUpperCase()}:</strong>{' '}
                      {pred.prediction}
                      <br />
                      <span className="text-green-500">
                        {(pred.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => runMLPrediction(palette, index)}
                  disabled={!predictor || isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? '예측 중...' : 'ML 예측 실행'}
                </button>
                <p className="text-sm text-green-600 mt-2">
                  실제 학습된 모델로 MBTI를 예측해보세요!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 색상 분석 결과 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-yellow-50 rounded">
            <div className="font-semibold text-yellow-800 mb-1">밝기 분석</div>
            <div>
              <strong>수치:</strong> {brightness.toFixed(3)}
            </div>
            <div className="text-xs text-yellow-700 mt-1">
              색상의 평균 밝기 (0-1 범위)
            </div>
          </div>

          <div className="p-3 bg-green-50 rounded">
            <div className="font-semibold text-green-800 mb-1">채도 분석</div>
            <div>
              <strong>수치:</strong> {saturation.toFixed(3)}
            </div>
            <div className="text-xs text-green-700 mt-1">
              색상의 평균 채도 (0-1 범위)
            </div>
          </div>

          <div className="p-3 bg-red-50 rounded">
            <div className="font-semibold text-red-800 mb-1">색온도 분석</div>
            <div>
              <strong>수치:</strong> {temperature.toFixed(3)}
            </div>
            <div className="text-xs text-red-700 mt-1">
              색상의 온도 (양수: 따뜻함, 음수: 차가움)
            </div>
          </div>

          <div className="p-3 bg-purple-50 rounded">
            <div className="font-semibold text-purple-800 mb-1">ML 벡터</div>
            <div>
              <strong>차원:</strong> {vector.length}D
            </div>
            <div className="text-xs text-purple-700 mt-1">
              머신러닝 모델 입력용 15차원 벡터
            </div>
          </div>
        </div>

        {/* RGB 변환 테스트 */}
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <strong className="text-gray-800">🔧 RGB 변환 결과:</strong>
          <div className="text-xs text-gray-600 mt-2">
            {palette.colors.map((color, i) => {
              const [r, g, b] = hexToRgbNormalized(color);
              return (
                <div key={i} className="mb-1">
                  {color} → RGB({r.toFixed(3)}, {g.toFixed(3)}, {b.toFixed(3)})
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">🎨 ColorMLUtils 테스트</h2>
      <p className="mb-6 text-gray-600">
        ColorMLUtils.ts의 색상 분석 기능을 테스트해보세요!
      </p>

      {testPalettes.map((palette, index) => analyzePalette(palette, index))}
    </div>
  );
};

const Test = () => (
  <Main
    meta={
      <Meta
        title="Made with Next.js, TypeScript, ESLint, Prettier, PostCSS, Tailwind CSS"
        description={AppConfig.description}
      />
    }
  >
    <FaceColorTest />
  </Main>
);

export const getStaticProps: GetStaticProps<IBlogGalleryProps> = async () => {
  const posts = getAllPosts(['title', 'date', 'slug']);
  const pagination: IPaginationProps = {};

  if (posts.length > AppConfig.pagination_size) {
    pagination.next = '/page2';
  }

  return {
    props: {
      posts: posts.slice(0, AppConfig.pagination_size),
      pagination,
    },
  };
};

export default Test;
