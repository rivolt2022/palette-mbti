"use strict";
/**
 * MBTI 색채 심리학 기반 자동 데이터 생성 유틸리티
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.formatDatasetForExport = exports.generateMBTIDataForIndicator = exports.generateMBTIDataset = void 0;
/**
 * 색채 심리학 기반 MBTI 색상 규칙 정의
 */
var MBTI_COLOR_RULES = {
    // E (외향): 채도 높음, 밝기 중상, 따뜻한 색조
    E: {
        hueRange: [0, 60],
        saturationRange: [70, 100],
        lightnessRange: [50, 80],
        warmTone: true,
        includeNeutral: false,
        complementary: false
    },
    // I (내향): 채도 낮음, 밝기 중하, 차가운 색조
    I: {
        hueRange: [180, 270],
        saturationRange: [20, 50],
        lightnessRange: [30, 60],
        warmTone: false,
        includeNeutral: true,
        complementary: false
    },
    // S (감각): 자연색, 중립색, 채도 중간
    S: {
        hueRange: [60, 180],
        saturationRange: [40, 70],
        lightnessRange: [40, 70],
        warmTone: false,
        includeNeutral: true,
        complementary: false
    },
    // N (직관): 비현실적 색상 조합, 채도 높음
    N: {
        hueRange: [0, 360],
        saturationRange: [60, 100],
        lightnessRange: [30, 80],
        warmTone: false,
        includeNeutral: false,
        complementary: true
    },
    // T (사고): 무채색 포함, 쿨톤, 채도 낮음
    T: {
        hueRange: [180, 300],
        saturationRange: [30, 60],
        lightnessRange: [30, 70],
        warmTone: false,
        includeNeutral: true,
        complementary: false
    },
    // F (감정): 파스텔톤, 웜톤, 채도 중상
    F: {
        hueRange: [300, 60],
        saturationRange: [50, 90],
        lightnessRange: [60, 90],
        warmTone: true,
        includeNeutral: false,
        complementary: false
    },
    // J (판단): 체계적이고 정렬된 색상, 유사색상 계열, 보색 관계
    J: {
        hueRange: [0, 360],
        saturationRange: [50, 85],
        lightnessRange: [45, 75],
        warmTone: false,
        includeNeutral: false,
        complementary: true,
        colorScheme: 'analogous',
        orderliness: 'high'
    },
    // P (인식): 자유롭고 다양한 색상 조합, 대비가 큰 색상들
    P: {
        hueRange: [0, 360],
        saturationRange: [20, 95],
        lightnessRange: [15, 85],
        warmTone: false,
        includeNeutral: true,
        complementary: false,
        colorScheme: 'random',
        orderliness: 'low'
    }
};
/**
 * HSL을 RGB로 변환
 */
function hslToRgb(h, s, l) {
    var normalizedH = h / 360;
    var normalizedS = s / 100;
    var normalizedL = l / 100;
    var c = (1 - Math.abs(2 * normalizedL - 1)) * normalizedS;
    var x = c * (1 - Math.abs(((normalizedH * 6) % 2) - 1));
    var m = normalizedL - c / 2;
    var r = 0;
    var g = 0;
    var b = 0;
    if (normalizedH >= 0 && normalizedH < 1 / 6) {
        r = c;
        g = x;
        b = 0;
    }
    else if (1 / 6 <= normalizedH && normalizedH < 2 / 6) {
        r = x;
        g = c;
        b = 0;
    }
    else if (2 / 6 <= normalizedH && normalizedH < 3 / 6) {
        r = 0;
        g = c;
        b = x;
    }
    else if (3 / 6 <= normalizedH && normalizedH < 4 / 6) {
        r = 0;
        g = x;
        b = c;
    }
    else if (4 / 6 <= normalizedH && normalizedH < 5 / 6) {
        r = x;
        g = 0;
        b = c;
    }
    else if (5 / 6 <= normalizedH && normalizedH < 1) {
        r = c;
        g = 0;
        b = x;
    }
    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
    };
}
/**
 * RGB를 HEX로 변환
 */
function rgbToHex(r, g, b) {
    // eslint-disable-next-line no-bitwise
    var hex = ((1 << 24) + (r << 16) + (g << 8) + b)
        .toString(16)
        .slice(1)
        .toUpperCase();
    return "#".concat(hex);
}
/**
 * HSL을 HEX로 변환
 */
function hslToHex(h, s, l) {
    var rgb = hslToRgb(h, s, l);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
}
/**
 * 무작위 숫자 생성 (min, max 포함)
 */
function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}
/**
 * 보색 계산
 */
function getComplementaryHue(hue) {
    return (hue + 180) % 360;
}
/**
 * 유사색상 생성 (J 타입용)
 */
function generateAnalogousColors(baseHue, count) {
    var hues = [];
    var step = 30; // 30도씩 차이
    for (var i = 0; i < count; i += 1) {
        var offset = (i - Math.floor(count / 2)) * step;
        hues.push((baseHue + offset + 360) % 360);
    }
    return hues;
}
/**
 * 삼원색 생성 (J 타입용)
 */
function generateTriadicColors(baseHue) {
    return [
        baseHue,
        (baseHue + 120) % 360,
        (baseHue + 240) % 360,
    ];
}
/**
 * 특정 MBTI 지표에 대한 색상 팔레트 생성
 */
function generateColorPaletteForMBTI(indicator) {
    var _a, _b, _c, _d;
    var rules = MBTI_COLOR_RULES[indicator];
    var palette = [];
    // J와 P에 대한 특별한 처리
    if (indicator === 'J') {
        // J: 체계적이고 정렬된 색상
        var baseHue = randomInRange(rules.hueRange[0], rules.hueRange[1]);
        if (rules.colorScheme === 'analogous') {
            // 유사색상 계열
            var hues = generateAnalogousColors(baseHue, 5);
            hues.forEach(function (hue) {
                var saturation = randomInRange(rules.saturationRange[0], rules.saturationRange[1]);
                var lightness = randomInRange(rules.lightnessRange[0], rules.lightnessRange[1]);
                palette.push(hslToHex(hue, saturation, lightness));
            });
        }
        else if (rules.complementary) {
            // 보색 관계 활용
            var hues = [baseHue, getComplementaryHue(baseHue)];
            for (var i = 0; i < 5; i += 1) {
                var hue = hues[i % 2];
                var saturation = randomInRange(rules.saturationRange[0], rules.saturationRange[1]);
                var lightness = randomInRange(rules.lightnessRange[0], rules.lightnessRange[1]);
                palette.push(hslToHex(hue, saturation, lightness));
            }
        }
    }
    else if (indicator === 'P') {
        // P: 자유롭고 다양한 색상 조합
        for (var i = 0; i < 5; i += 1) {
            var hue = void 0;
            var saturation = void 0;
            var lightness = void 0;
            // 매우 다양한 색상 조합
            hue = randomInRange(rules.hueRange[0], rules.hueRange[1]);
            saturation = randomInRange(rules.saturationRange[0], rules.saturationRange[1]);
            lightness = randomInRange(rules.lightnessRange[0], rules.lightnessRange[1]);
            // 중성색 포함 옵션 (P는 더 자주)
            if (rules.includeNeutral && Math.random() < 0.4) {
                saturation = randomInRange(0, 30);
            }
            // 대비가 큰 색상들 (밝기 차이)
            if (i > 0 && Math.random() < 0.6) {
                var prevLightness = Number.parseInt((_b = (_a = palette[palette.length - 1]) === null || _a === void 0 ? void 0 : _a.slice(5, 7)) !== null && _b !== void 0 ? _b : '80', 16) / 255 * 100;
                // 이전 색상과 대비되는 밝기
                lightness = prevLightness > 50
                    ? randomInRange(15, 45)
                    : randomInRange(55, 85);
            }
            palette.push(hslToHex(hue, saturation, lightness));
        }
    }
    else {
        // 다른 지표들은 기존 로직 사용
        for (var i = 0; i < 5; i += 1) {
            var hue = void 0;
            var saturation = void 0;
            if (rules.complementary && i > 0 && Math.random() < 0.3) {
                // 30% 확률로 보색 관계 활용
                var baseHue = palette.length > 0
                    ? (Number.parseInt((_d = (_c = palette[palette.length - 1]) === null || _c === void 0 ? void 0 : _c.slice(1, 3)) !== null && _d !== void 0 ? _d : '0', 16) *
                        360) /
                        255
                    : randomInRange(rules.hueRange[0], rules.hueRange[1]);
                hue = getComplementaryHue(baseHue);
            }
            else {
                hue = randomInRange(rules.hueRange[0], rules.hueRange[1]);
            }
            saturation = randomInRange(rules.saturationRange[0], rules.saturationRange[1]);
            var lightness = randomInRange(rules.lightnessRange[0], rules.lightnessRange[1]);
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
function generateMBTIDataset(samplesPerIndicator) {
    if (samplesPerIndicator === void 0) { samplesPerIndicator = 1000; }
    var dataset = {
        E: [],
        I: [],
        S: [],
        N: [],
        T: [],
        F: [],
        J: [],
        P: []
    };
    var indicators = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'];
    indicators.forEach(function (indicator) {
        for (var i = 0; i < samplesPerIndicator; i += 1) {
            var palette = generateColorPaletteForMBTI(indicator);
            dataset[indicator].push({
                label: indicator,
                palette: palette
            });
        }
    });
    return dataset;
}
exports.generateMBTIDataset = generateMBTIDataset;
/**
 * 특정 지표의 데이터만 생성
 */
function generateMBTIDataForIndicator(indicator, samples) {
    if (samples === void 0) { samples = 1000; }
    var data = [];
    for (var i = 0; i < samples; i += 1) {
        var palette = generateColorPaletteForMBTI(indicator);
        data.push({
            label: indicator,
            palette: palette
        });
    }
    return data;
}
exports.generateMBTIDataForIndicator = generateMBTIDataForIndicator;
/**
 * 데이터셋을 JSON 파일로 저장하기 위한 형식으로 변환
 */
function formatDatasetForExport(dataset) {
    return {
        'e-i': __spreadArray(__spreadArray([], dataset.E, true), dataset.I, true),
        's-n': __spreadArray(__spreadArray([], dataset.S, true), dataset.N, true),
        't-f': __spreadArray(__spreadArray([], dataset.T, true), dataset.F, true),
        'j-p': __spreadArray(__spreadArray([], dataset.J, true), dataset.P, true)
    };
}
exports.formatDatasetForExport = formatDatasetForExport;
