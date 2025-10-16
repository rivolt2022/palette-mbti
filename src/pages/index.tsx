import React, { useState } from 'react';

import { GetStaticProps } from 'next';
import { ChromePicker } from 'react-color';

import { IBlogGalleryProps } from '../blog/BlogGallery';
import { Meta } from '../layout/Meta';
import { IPaginationProps } from '../pagination/Pagination';
import { Main } from '../templates/Main';
import { AppConfig, POPULAR_COLORS, EXAMPLE_RESULTS } from '../utils/AppConfig';
import { getAllPosts } from '../utils/Content';

// 색상 선택 랜딩 페이지 컴포넌트
const ColorMBTILanding = () => {
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isFaceMode, setIsFaceMode] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentPickerIndex, setCurrentPickerIndex] = useState<number | null>(
    null
  );
  const [tempColor, setTempColor] = useState<string>('#000000');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 색상 추출 시뮬레이션 (실제 ML 모델 대신)
  const simulateColorExtraction = () => {
    setIsProcessing(true);
    setTimeout(() => {
      // 랜덤 색상 5개 생성 (실제로는 ML 모델이 추출)
      const extractedColors = [
        '#FF6B6B',
        '#4ECDC4',
        '#45B7D1',
        '#96CEB4',
        '#FFEAA7',
      ];
      setSelectedColors(extractedColors);
      setIsProcessing(false);
    }, 2000);
  };

  // 색상 선택 핸들러
  const handleColorSelect = (color: string) => {
    if (selectedColors.length < 5) {
      setSelectedColors([...selectedColors, color]);
    }
  };

  // 색상 제거 핸들러
  const handleColorRemove = (index: number) => {
    const newColors = selectedColors.filter((_, i) => i !== index);
    setSelectedColors(newColors);
  };

  // 색상 교체 핸들러
  const handleColorReplace = (index: number, newColor: string) => {
    const newColors = [...selectedColors];
    newColors[index] = newColor;
    setSelectedColors(newColors);
  };

  // 컬러피커 열기
  const openColorPicker = (index: number) => {
    setCurrentPickerIndex(index);
    setTempColor(selectedColors[index] || '#000000');
    setShowColorPicker(true);
  };

  // 컬러피커에서 색상 변경 (실시간 미리보기)
  const handleColorPickerChange = (color: any) => {
    setTempColor(color.hex);
  };

  // 컬러피커에서 색상 선택 완료
  const handleColorPickerComplete = () => {
    if (currentPickerIndex !== null) {
      if (currentPickerIndex < selectedColors.length) {
        // 기존 색상 교체
        handleColorReplace(currentPickerIndex, tempColor);
      } else {
        // 새 색상 추가
        handleColorSelect(tempColor);
      }
    }
    setShowColorPicker(false);
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        // TODO: 실제 ML 모델로 색상 추출
        simulateColorExtraction();
      };
      reader.readAsDataURL(file);
    }
  };

  // 모드 리셋
  const resetModes = () => {
    setIsCustomMode(false);
    setIsFaceMode(false);
    setUploadedImage(null);
    setSelectedColors([]);
  };

  // 분석 시작
  const handleAnalyze = () => {
    if (selectedColors.length === 5) {
      // TODO: 분석 결과 페이지로 이동
      // 분석할 색상들: selectedColors
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* 히어로 섹션 */}
      <div className="text-center py-12 md:py-16 px-4">
        <div className="mb-8">
          <div className="inline-block px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium text-purple-600 mb-4 shadow-lg">
            ✨ 새로운 방식의 성격 테스트
          </div>
        </div>
        <h1 className="hero-title text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6 fade-in-up">
          당신의 색깔로 알아보는 MBTI 🎨
        </h1>
        <p className="hero-subtitle text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto fade-in-up leading-relaxed">
          5가지 색상을 선택하면 AI가 당신의 성격을 분석해드려요!
          <br className="hidden md:block" />
          <span className="md:hidden"> </span>색깔로 알아보는 재미있는 성격
          테스트를 시작해보세요.
        </p>

        {/* 진행 상태 표시 */}
        <div className="mb-8 fade-in-up">
          <div className="text-base md:text-lg font-semibold text-gray-700 mb-3">
            {selectedColors.length}개 색상 선택됨 (5개 중)
          </div>
          <div className="w-full max-w-sm md:max-w-md mx-auto bg-gray-200 rounded-full progress-bar-mobile h-3 md:h-3 shadow-inner">
            <div
              className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 h-full rounded-full progress-bar transition-all duration-700 ease-out"
              style={{ width: `${(selectedColors.length / 5) * 100}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {selectedColors.length === 5
              ? '🎉 모든 색상을 선택했어요!'
              : `${5 - selectedColors.length}개 더 선택해주세요`}
          </div>
        </div>
      </div>

      {/* 색상 선택 섹션 */}
      <div className="max-w-4xl mx-auto px-4 mb-12">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 md:p-8 border border-white/20">
          <h2 className="text-xl md:text-2xl font-bold text-center mb-6 md:mb-8 text-gray-800">
            🎨 당신만의 색깔 팔레트를 만들어보세요!
          </h2>

          {/* 빠른 선택 모드 */}
          {!isCustomMode && (
            <div className="mb-8">
              <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-700 text-center">
                💫 빠른 선택
              </h3>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3 md:gap-4 color-grid color-grid-mobile">
                {POPULAR_COLORS.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => handleColorSelect(color)}
                    disabled={selectedColors.length >= 5}
                    className="w-12 h-12 md:w-16 md:h-16 rounded-xl shadow-md color-box disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 모드 선택 버튼들 */}
          <div className="mb-8">
            <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-700 text-center">
              🎯 색상 선택 방법을 선택하세요
            </h3>
            <div className="flex flex-col md:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  resetModes();
                  setIsCustomMode(false);
                }}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  !isCustomMode && !isFaceMode
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                💫 빠른 선택
              </button>
              <button
                onClick={() => {
                  resetModes();
                  setIsCustomMode(true);
                }}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  isCustomMode && !isFaceMode
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                🎨 커스텀 선택
              </button>
              <button
                onClick={() => {
                  resetModes();
                  setIsFaceMode(true);
                }}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  isFaceMode
                    ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                📸 얼굴 업로드
              </button>
            </div>
          </div>

          {/* 커스텀 모드 - 컬러피커 */}
          {isCustomMode && (
            <div className="mb-8">
              <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-700 text-center">
                🎨 커스텀 색상 선택
              </h3>
              <div className="flex justify-center">
                <button
                  onClick={() => openColorPicker(selectedColors.length)}
                  disabled={selectedColors.length >= 5}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  색상 선택하기
                </button>
              </div>
            </div>
          )}

          {/* 얼굴 업로드 모드 */}
          {isFaceMode && (
            <div className="mb-8">
              <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-700 text-center">
                📸 얼굴 사진을 업로드하세요
              </h3>
              <div className="text-center">
                {!uploadedImage ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-green-400 transition-colors duration-300">
                    <div className="text-gray-500 mb-4">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      얼굴이 잘 보이는 사진을 업로드하면
                      <br />
                      AI가 자동으로 5가지 색상을 추출해드려요!
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="face-upload"
                    />
                    <label
                      htmlFor="face-upload"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white rounded-xl font-medium transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl"
                    >
                      📷 사진 선택하기
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <img
                        src={uploadedImage}
                        alt="Uploaded face"
                        className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-xl shadow-lg"
                      />
                      {isProcessing && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center">
                          <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                            <p className="text-sm">색상 추출 중...</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {isProcessing
                        ? 'AI가 색상을 분석하고 있어요...'
                        : '색상 추출이 완료되었습니다!'}
                    </div>
                    <button
                      onClick={() => {
                        setUploadedImage(null);
                        setSelectedColors([]);
                      }}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors duration-200"
                    >
                      다른 사진 선택하기
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 선택된 색상 미리보기 */}
          <div className="mb-8">
            <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-700 text-center">
              ✨ 선택된 색상
            </h3>
            <div className="flex justify-center gap-3 md:gap-4 selected-colors-mobile">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="relative">
                  {selectedColors[index] ? (
                    <div className="relative group">
                      <div
                        className="w-12 h-12 md:w-16 md:h-16 rounded-xl shadow-lg cursor-pointer color-box selected-color selected-color-mobile hover:shadow-xl transition-all duration-300"
                        style={{ backgroundColor: selectedColors[index] }}
                        onClick={() => !isFaceMode && openColorPicker(index)}
                        title={selectedColors[index]}
                      />
                      {!isFaceMode && (
                        <button
                          onClick={() => handleColorRemove(index)}
                          className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-5 h-5 md:w-6 md:h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 selected-color-mobile">
                      ?
                    </div>
                  )}
                </div>
              ))}
            </div>
            {isFaceMode && selectedColors.length > 0 && (
              <p className="text-sm text-gray-500 text-center mt-2">
                AI가 추출한 색상입니다. 다른 사진을 업로드하면 색상이 바뀝니다.
              </p>
            )}
          </div>

          {/* 분석 시작 버튼 */}
          <div className="text-center">
            <button
              onClick={handleAnalyze}
              disabled={selectedColors.length !== 5 || isProcessing}
              className="gradient-button-mobile px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(() => {
                if (isProcessing) {
                  return (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      처리 중...
                    </div>
                  );
                }
                if (selectedColors.length === 5) {
                  return '내 MBTI 분석하기 ✨';
                }
                return `${5 - selectedColors.length}개 더 선택해주세요`;
              })()}
            </button>
            {isFaceMode && selectedColors.length === 5 && (
              <p className="text-sm text-gray-500 mt-2">
                AI가 추출한 색상으로 MBTI를 분석합니다
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 예시 섹션 */}
      <div className="max-w-4xl mx-auto px-4 mb-12">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
          이런 분들은 어떤 결과가 나왔을까요?
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {EXAMPLE_RESULTS.map((example, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 example-card"
            >
              <div className="flex gap-2 mb-4 justify-center">
                {example.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-lg shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <h3 className="text-xl font-bold text-center mb-2 text-gray-800">
                {example.mbti}
              </h3>
              <p className="text-center text-gray-600 mb-2">
                {example.description}
              </p>
              <p className="text-center text-sm text-gray-500">
                {example.comment}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 컬러피커 모달 */}
      {showColorPicker && (
        <div className="fixed inset-0 color-picker-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl color-picker-modal">
            <div className="color-picker-header">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">🎨 색상 선택</h3>
                <button
                  onClick={() => setShowColorPicker(false)}
                  className="text-white/80 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>
              <p className="text-white/90 text-sm mt-2">
                원하는 색상을 선택해주세요
              </p>
            </div>

            <div className="mt-6">
              {/* 현재 선택된 색상 미리보기 */}
              <div className="text-center mb-6">
                <div
                  className="color-preview mx-auto"
                  style={{ backgroundColor: tempColor }}
                />
                <p className="text-sm text-gray-600 mt-2 font-mono">
                  {tempColor}
                </p>
              </div>

              {/* 컬러피커 */}
              <div className="flex justify-center">
                <ChromePicker
                  color={tempColor}
                  onChange={handleColorPickerChange}
                />
              </div>
            </div>

            <div className="color-picker-buttons">
              <button
                onClick={() => setShowColorPicker(false)}
                className="color-picker-button color-picker-button-cancel"
              >
                취소
              </button>
              <button
                onClick={handleColorPickerComplete}
                className="color-picker-button color-picker-button-confirm"
              >
                선택 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Index = () => (
  <Main
    meta={<Meta title={AppConfig.title} description={AppConfig.description} />}
  >
    <ColorMBTILanding />
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

export default Index;
