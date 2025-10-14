/**
 * MBTI 색상 학습 데이터 자동 생성 스크립트
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { formatDatasetForExport, generateMBTIDataset } from '../src/utils/MBTIColorGenerator';

const SAMPLES_PER_INDICATOR = 1000;
const OUTPUT_DIR = join(process.cwd(), 'public', 'data', 'training-data');

async function main() {
  console.log('🎨 MBTI 색상 학습 데이터 생성 시작...');

  // 출력 디렉토리 생성
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 출력 디렉토리 생성: ${OUTPUT_DIR}`);
  }

  try {
    // 데이터셋 생성
    console.log(`📊 각 MBTI 지표별 ${SAMPLES_PER_INDICATOR}개 샘플 생성 중...`);
    const dataset = generateMBTIDataset(SAMPLES_PER_INDICATOR);

    // 지표별 개수 확인
    const indicators = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'] as const;
    indicators.forEach((indicator) => {
      console.log(`  ${indicator}: ${dataset[indicator].length}개 샘플`);
    });

    // JSON 파일로 저장할 형식으로 변환
    const exportData = formatDatasetForExport(dataset);

    // 각 지표 조합별로 파일 저장
    const fileMappings = [
      { key: 'e-i', filename: 'e-i.json' },
      { key: 's-n', filename: 's-n.json' },
      { key: 't-f', filename: 't-f.json' },
      { key: 'j-p', filename: 'j-p.json' },
    ];

    for (const mapping of fileMappings) {
      const filePath = join(OUTPUT_DIR, mapping.filename);
      const data = exportData[mapping.key];

      writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`💾 ${mapping.filename} 저장 완료 (${data.length}개 샘플)`);
    }

    // 전체 데이터셋도 저장 (선택사항)
    const fullDatasetPath = join(OUTPUT_DIR, 'full-dataset.json');
    writeFileSync(fullDatasetPath, JSON.stringify(dataset, null, 2));
    console.log(`💾 full-dataset.json 저장 완료`);

    // 통계 정보 출력
    const totalSamples = Object.values(dataset).reduce((sum, data) => sum + data.length, 0);
    console.log(`\n✅ 데이터 생성 완료!`);
    console.log(`📈 총 샘플 수: ${totalSamples}개`);
    console.log(`📁 저장 위치: ${OUTPUT_DIR}`);
    console.log(`\n📋 생성된 파일:`);
    fileMappings.forEach((mapping) => {
      console.log(`  - ${mapping.filename}`);
    });
    console.log(`  - full-dataset.json`);
  } catch (error) {
    console.error('❌ 데이터 생성 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
main().catch(console.error);
