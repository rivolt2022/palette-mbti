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
// import { MBTIPredictor } from '../utils/MBTIPredictor';

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
    <ColorMLTest />
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
