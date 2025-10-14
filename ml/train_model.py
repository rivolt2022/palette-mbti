"""
MBTI 컬러 팔레트 예측 모델 생성
브라우저에서 실행 가능한 간단한 TensorFlow.js 모델을 생성합니다.
"""

import json
import numpy as np
import tensorflow as tf
from tensorflow import keras
from sklearn.preprocessing import LabelEncoder
import os

def hex_to_rgb_normalized(hex_color):
    """16진수 색상을 0-1 범위의 RGB 값으로 변환"""
    hex_color = hex_color.lstrip('#')
    r = int(hex_color[0:2], 16) / 255.0
    g = int(hex_color[2:4], 16) / 255.0
    b = int(hex_color[4:6], 16) / 255.0
    return [r, g, b]

def load_training_data():
    """학습 데이터 로드 및 전처리"""
    data_dir = "../public/data/training-data"
    
    # 각 MBTI 지표별 데이터 로드
    datasets = {}
    for indicator in ['e-i', 's-n', 't-f', 'j-p']:
        file_path = os.path.join(data_dir, f"{indicator}.json")
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            datasets[indicator] = data
    
    return datasets

def augment_color_palette(palette_rgb, noise_factor=0.05, indicator=None):
    """색상 팔레트 데이터 증강"""
    # palette_rgb는 이미 평탄화된 15차원 벡터 (5개 색상 × 3개 RGB 값)
    palette_array = np.array(palette_rgb)
    
    # 노이즈 추가
    noise = np.random.normal(0, noise_factor, len(palette_array))
    augmented = np.clip(palette_array + noise, 0, 1)  # 0~1 범위로 유지
    
    return augmented.tolist()

def prepare_data_for_training(datasets, use_augmentation=True):
    """학습을 위한 데이터 준비"""
    models_data = {}
    
    for indicator, data in datasets.items():
        X = []  # 색상 팔레트 데이터
        y = []  # 라벨 데이터
        
        for item in data:
            # 5개 색상을 RGB로 변환하고 평탄화 (15차원 벡터)
            palette_rgb = []
            for color in item['palette']:
                rgb = hex_to_rgb_normalized(color)
                palette_rgb.extend(rgb)
            
            X.append(palette_rgb)
            y.append(item['label'])
            
            # 데이터 증강 (모든 모델에 적용)
            if use_augmentation:
                # 모든 모델에 5배 증강 적용
                augmentation_count = 5
                for _ in range(augmentation_count):
                    augmented_palette = augment_color_palette(palette_rgb, indicator=indicator)
                    X.append(augmented_palette)
                    y.append(item['label'])
        
        X = np.array(X, dtype=np.float32)
        
        # 라벨을 숫자로 변환
        label_encoder = LabelEncoder()
        y_encoded = label_encoder.fit_transform(y)
        
        models_data[indicator] = {
            'X': X,
            'y': y_encoded,
            'label_encoder': label_encoder,
            'classes': label_encoder.classes_
        }
        
        print(f"{indicator.upper()} 데이터: {len(X)} 샘플")
    
    return models_data

def create_simple_model(input_dim, num_classes):
    """간단한 신경망 모델 생성 (브라우저 최적화)"""
    model = keras.Sequential([
        keras.layers.Dense(32, activation='relu', input_shape=(input_dim,)),
        keras.layers.Dropout(0.2),
        keras.layers.Dense(16, activation='relu'),
        keras.layers.Dropout(0.2),
        keras.layers.Dense(num_classes, activation='softmax')
    ])
    
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def create_improved_model(input_dim, num_classes, indicator):
    """개선된 신경망 모델 생성 (성능 최적화)"""
    # 모든 모델에 동일한 구조 사용
    model = keras.Sequential([
        keras.layers.Dense(64, activation='relu', input_shape=(input_dim,)),
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.3),
        keras.layers.Dense(32, activation='relu'),
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.3),
        keras.layers.Dense(16, activation='relu'),
        keras.layers.Dropout(0.2),
        keras.layers.Dense(num_classes, activation='softmax')
    ])
    
    # 모든 모델에 동일한 옵티마이저 설정
    optimizer = keras.optimizers.Adam(learning_rate=0.001)
    
    model.compile(
        optimizer=optimizer,
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def train_models(models_data):
    """각 MBTI 지표별 모델 학습"""
    trained_models = {}
    
    for indicator, data in models_data.items():
        print(f"\n=== {indicator.upper()} 모델 학습 시작 ===")
        
        X = data['X']
        y = data['y']
        num_classes = len(data['classes'])
        
        # 개선된 모델 생성
        model = create_improved_model(X.shape[1], num_classes, indicator)
        
        # 모델 구조 출력
        print(f"입력 차원: {X.shape[1]}")
        print(f"클래스 수: {num_classes}")
        print(f"클래스: {data['classes']}")
        
        # Early stopping 콜백
        early_stopping = keras.callbacks.EarlyStopping(
            monitor='val_accuracy',
            patience=10,
            restore_best_weights=True,
            verbose=1
        )
        
        # 학습률 감소 콜백
        reduce_lr = keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-7,
            verbose=1
        )
        
        # 학습
        history = model.fit(
            X, y,
            epochs=100,  # 더 많은 에포크
            batch_size=32,
            validation_split=0.2,
            callbacks=[early_stopping, reduce_lr],
            verbose=1
        )
        
        # 정확도 출력
        final_accuracy = history.history['accuracy'][-1]
        val_accuracy = history.history['val_accuracy'][-1]
        print(f"최종 훈련 정확도: {final_accuracy:.4f}")
        print(f"최종 검증 정확도: {val_accuracy:.4f}")
        
        trained_models[indicator] = {
            'model': model,
            'label_encoder': data['label_encoder'],
            'classes': data['classes']
        }
    
    return trained_models

def save_models_as_tfjs(trained_models):
    """모델을 TensorFlow.js 형식으로 저장 (브라우저 최적화)"""
    # 모델 저장 디렉토리 생성
    models_dir = "../public/models"
    os.makedirs(models_dir, exist_ok=True)
    
    for indicator, model_data in trained_models.items():
        model_dir = os.path.join(models_dir, indicator)
        os.makedirs(model_dir, exist_ok=True)
        
        # 기존 파일들 삭제
        import shutil
        if os.path.exists(model_dir):
            shutil.rmtree(model_dir)
        os.makedirs(model_dir, exist_ok=True)
        
        print(f"🔄 {indicator} 모델을 TensorFlow.js 형식으로 저장 중...")
        
        # TensorFlow.js 호환 형식으로 모델 저장
        model = model_data['model']
        
        # 1. 모델 구조를 TensorFlow.js 형식으로 저장
        model_topology = model.to_json()
        model_config = json.loads(model_topology)
        
        # InputLayer의 batch_shape를 inputShape로 변환
        if 'config' in model_config and 'layers' in model_config['config']:
            for layer in model_config['config']['layers']:
                if (layer.get('module') == 'keras.layers' and 
                    layer.get('class_name') == 'InputLayer'):
                    layer_config = layer.get('config', {})
                    if 'batch_shape' in layer_config:
                        batch_shape = layer_config['batch_shape']
                        if batch_shape and len(batch_shape) > 1:
                            # batch_shape [null, 15] -> inputShape [15]
                            layer_config['inputShape'] = batch_shape[1:]
                        # batch_shape 제거
                        del layer_config['batch_shape']
        
        # 2. 가중치 추출 및 저장
        weights = model.get_weights()
        weight_files = []
        
        for i, weight in enumerate(weights):
            weight_file = f"weights_{i}.bin"
            weight_path = os.path.join(model_dir, weight_file)
            
            # 가중치를 float32로 저장
            weight.astype('float32').tofile(weight_path)
            weight_files.append(weight_file)
        
        # 3. 가중치 매니페스트 생성 (TensorFlow.js 호환 형식)
        weights_manifest = [{
            "paths": weight_files,
            "weights": []
        }]
        
        # 각 가중치에 대한 상세 정보 추가 (실제 레이어 이름 사용)
        weight_names = []
        for layer in model.layers:
            if hasattr(layer, 'kernel'):
                weight_names.append(f"{layer.name}/kernel")
                if layer.use_bias:
                    weight_names.append(f"{layer.name}/bias")
            elif hasattr(layer, 'gamma'):
                # BatchNormalization 레이어
                weight_names.extend([
                    f"{layer.name}/gamma",
                    f"{layer.name}/beta", 
                    f"{layer.name}/moving_mean",
                    f"{layer.name}/moving_variance"
                ])
        
        for i, weight in enumerate(weights):
            weight_name = weight_names[i] if i < len(weight_names) else f"weight_{i}"
            weights_manifest[0]["weights"].append({
                "name": weight_name,
                "shape": list(weight.shape),
                "dtype": "float32"
            })
        
        # 4. model.json 파일 생성 (TensorFlow.js 호환 형식)
        model_json = {
            "modelTopology": model_config,
            "weightsManifest": weights_manifest
        }
        
        with open(os.path.join(model_dir, 'model.json'), 'w') as f:
            json.dump(model_json, f, indent=2)
        
        # 4. 라벨 정보 저장
        label_info = {
            'classes': model_data['classes'].tolist(),
            'indicator': indicator
        }
        
        with open(os.path.join(model_dir, 'labels.json'), 'w', encoding='utf-8') as f:
            json.dump(label_info, f, ensure_ascii=False, indent=2)
        
        print(f"✅ {indicator} 모델이 TensorFlow.js 형식으로 {model_dir}에 저장되었습니다.")
        print(f"   📁 생성된 파일: model.json, {len(weight_files)}개 가중치 파일, labels.json")


def main():
    """메인 실행 함수"""
    print("🚀 MBTI 컬러 팔레트 모델 학습 시작!")
    print("🌐 TensorFlow.js 브라우저 호환 형식으로 저장")
    
    # 데이터 로드
    print("📊 학습 데이터 로드 중...")
    datasets = load_training_data()
    
    # 데이터 전처리 (데이터 증강 포함)
    print("🔧 데이터 전처리 및 증강 중...")
    models_data = prepare_data_for_training(datasets, use_augmentation=True)
    
    # 모델 학습
    print("🧠 모델 학습 시작...")
    trained_models = train_models(models_data)
    
    # TensorFlow.js 형식으로 저장
    print("💾 TensorFlow.js 형식으로 저장 중...")
    save_models_as_tfjs(trained_models)
    
    print("🎉 모든 모델 학습 및 저장 완료!")
    print("🌐 이제 브라우저에서 바로 사용할 수 있습니다!")
    print("📁 생성된 파일들:")
    print("   - model.json: TensorFlow.js 호환 모델 구조")
    print("   - weights_*.bin: 모델 가중치 파일들")
    print("   - labels.json: 라벨 정보")

if __name__ == "__main__":
    main()
