"use strict";
/**
 * MBTI 색상 학습 데이터 자동 생성 스크립트
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var MBTIColorGenerator_1 = require("../src/utils/MBTIColorGenerator");
var SAMPLES_PER_INDICATOR = 1000;
var OUTPUT_DIR = (0, node_path_1.join)(process.cwd(), 'public', 'data', 'training-data');
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var dataset_1, indicators, exportData_1, fileMappings, fullDatasetPath, totalSamples;
        return __generator(this, function (_a) {
            // eslint-disable-next-line no-console
            console.log('🎨 MBTI 색상 학습 데이터 생성 시작...');
            // 출력 디렉토리 생성
            if (!(0, node_fs_1.existsSync)(OUTPUT_DIR)) {
                (0, node_fs_1.mkdirSync)(OUTPUT_DIR, { recursive: true });
                // eslint-disable-next-line no-console
                console.log("\uD83D\uDCC1 \uCD9C\uB825 \uB514\uB809\uD1A0\uB9AC \uC0DD\uC131: ".concat(OUTPUT_DIR));
            }
            try {
                // 데이터셋 생성
                // eslint-disable-next-line no-console
                console.log("\uD83D\uDCCA \uAC01 MBTI \uC9C0\uD45C\uBCC4 ".concat(SAMPLES_PER_INDICATOR, "\uAC1C \uC0D8\uD50C \uC0DD\uC131 \uC911..."));
                dataset_1 = (0, MBTIColorGenerator_1.generateMBTIDataset)(SAMPLES_PER_INDICATOR);
                indicators = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'];
                indicators.forEach(function (indicator) {
                    // eslint-disable-next-line no-console
                    console.log("  ".concat(indicator, ": ").concat(dataset_1[indicator].length, "\uAC1C \uC0D8\uD50C"));
                });
                exportData_1 = (0, MBTIColorGenerator_1.formatDatasetForExport)(dataset_1);
                fileMappings = [
                    { key: 'e-i', filename: 'e-i.json' },
                    { key: 's-n', filename: 's-n.json' },
                    { key: 't-f', filename: 't-f.json' },
                    { key: 'j-p', filename: 'j-p.json' },
                ];
                fileMappings.forEach(function (mapping) {
                    var filePath = (0, node_path_1.join)(OUTPUT_DIR, mapping.filename);
                    var data = exportData_1[mapping.key];
                    (0, node_fs_1.writeFileSync)(filePath, JSON.stringify(data, null, 2));
                    // eslint-disable-next-line no-console
                    console.log("\uD83D\uDCBE ".concat(mapping.filename, " \uC800\uC7A5 \uC644\uB8CC (").concat(data.length, "\uAC1C \uC0D8\uD50C)"));
                });
                fullDatasetPath = (0, node_path_1.join)(OUTPUT_DIR, 'full-dataset.json');
                (0, node_fs_1.writeFileSync)(fullDatasetPath, JSON.stringify(dataset_1, null, 2));
                // eslint-disable-next-line no-console
                console.log("\uD83D\uDCBE full-dataset.json \uC800\uC7A5 \uC644\uB8CC");
                totalSamples = Object.values(dataset_1).reduce(function (sum, data) { return sum + data.length; }, 0);
                // eslint-disable-next-line no-console
                console.log("\n\u2705 \uB370\uC774\uD130 \uC0DD\uC131 \uC644\uB8CC!");
                // eslint-disable-next-line no-console
                console.log("\uD83D\uDCC8 \uCD1D \uC0D8\uD50C \uC218: ".concat(totalSamples, "\uAC1C"));
                // eslint-disable-next-line no-console
                console.log("\uD83D\uDCC1 \uC800\uC7A5 \uC704\uCE58: ".concat(OUTPUT_DIR));
                // eslint-disable-next-line no-console
                console.log("\n\uD83D\uDCCB \uC0DD\uC131\uB41C \uD30C\uC77C:");
                fileMappings.forEach(function (mapping) {
                    // eslint-disable-next-line no-console
                    console.log("  - ".concat(mapping.filename));
                });
                // eslint-disable-next-line no-console
                console.log("  - full-dataset.json");
            }
            catch (error) {
                // eslint-disable-next-line no-console
                console.error('❌ 데이터 생성 중 오류 발생:', error);
                process.exit(1);
            }
            return [2 /*return*/];
        });
    });
}
// 스크립트 실행
main()["catch"](function (error) {
    // eslint-disable-next-line no-console
    console.error(error);
});
