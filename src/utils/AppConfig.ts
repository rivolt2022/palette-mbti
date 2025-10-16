export const AppConfig = {
  site_name: '팔레트 MBTI',
  title: '팔레트 MBTI - 색상으로 알아보는 나의 성격',
  description:
    '5가지 색상을 선택하면 AI가 당신의 MBTI를 분석해드려요! 색깔로 알아보는 재미있는 성격 테스트',
  url: 'https://example.com',
  locale: 'ko',
  author: '팔레트 MBTI',
  pagination_size: 5,
};

// 미리 정의된 인기 색상 팔레트
export const POPULAR_COLORS = [
  '#FF6B6B', // 따뜻한 빨강
  '#4ECDC4', // 청록
  '#45B7D1', // 하늘색
  '#96CEB4', // 민트
  '#FFEAA7', // 노랑
  '#DDA0DD', // 자주
  '#98D8C8', // 연두
  '#F7DC6F', // 골드
  '#BB8FCE', // 라벤더
  '#85C1E9', // 연파랑
  '#F8C471', // 오렌지
  '#82E0AA', // 연초록
];

// 예시 결과 데이터
export const EXAMPLE_RESULTS = [
  {
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
    mbti: 'ENFP',
    description: '활발하고 창의적인 색상들로 당신은 ENFP!',
    comment: '밝고 따뜻한 색상들이 당신의 열정적인 성격을 보여주네요 ✨',
  },
  {
    colors: ['#2C3E50', '#34495E', '#7F8C8D', '#95A5A6', '#BDC3C7'],
    mbti: 'INTJ',
    description: '차분하고 신중한 색상들로 당신은 INTJ!',
    comment: '차가운 톤의 색상들이 당신의 논리적이고 체계적인 면을 나타내요 🧠',
  },
];
