"""
다양한 얼굴-색상 패턴 학습을 위한 향상된 모델
얼굴 특징의 다양한 조합으로부터 MBTI 예측에 적합한 색상 다양성 확보
"""

import json
import numpy as np
import tensorflow as tf
from tensorflow import keras
import os
import random
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

def load_diverse_face_color_data():
    """다양한 얼굴-색상 데이터 로드"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(script_dir, "..", "public", "data", "diverse-face-color", "training-data.json")
    data_path = os.path.normpath(data_path)
    
    print(f"📊 데이터 로드 중: {data_path}")
    
    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    X = np.array(data['X'], dtype=np.float32)
    y = np.array(data['y'], dtype=np.float32)
    metadata = data['metadata']
    
    print(f"   입력 차원: {X.shape[1]} (descriptor 128 + 특징 15 + 랜덤 5)")
    print(f"   출력 차원: {y.shape[1]}")
    print(f"   총 샘플 수: {len(X)}")
    
    return X, y, metadata

def analyze_color_diversity(y, metadata):
    """색상 다양성 분석"""
    print("\n🌈 색상 다양성 분석:")
    
    # 색상 카테고리 분포
    categories = {}
    for item in metadata:
        category = item['colorCategory']
        categories[category] = categories.get(category, 0) + 1
    
    print("   색상 카테고리 분포:")
    for category, count in categories.items():
        print(f"     {category}: {count}개 ({count/len(metadata)*100:.1f}%)")
    
    # 색상 특성 분석
    brightness_values = [item['colorCharacteristics']['brightness'] for item in metadata]
    saturation_values = [item['colorCharacteristics']['saturation'] for item in metadata]
    temperature_values = [item['colorCharacteristics']['temperature'] for item in metadata]
    
    print(f"   밝기 범위: {min(brightness_values):.3f} ~ {max(brightness_values):.3f}")
    print(f"   채도 범위: {min(saturation_values):.3f} ~ {max(saturation_values):.3f}")
    print(f"   색온도 범위: {min(temperature_values):.3f} ~ {max(temperature_values):.3f}")
    
    # 고유 색상 수 계산
    unique_colors = set()
    for item in metadata:
        for color in item['colors']:
            unique_colors.add(color)
    
    print(f"   고유 색상 수: {len(unique_colors)}개")

def create_enhanced_diverse_model(input_dim=148, output_dim=15):
    """다양한 색상 패턴 학습을 위한 향상된 모델"""
    model = keras.Sequential([
        # 입력층: 148차원
        keras.layers.Dense(256, activation='relu', input_shape=(input_dim,)),
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.4),
        
        # 은닉층 1: 얼굴 특징 처리
        keras.layers.Dense(128, activation='relu'),
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.3),
        
        # 은닉층 2: 색상 패턴 학습
        keras.layers.Dense(64, activation='relu'),
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.2),
        
        # 은닉층 3: 색상 조합 학습
        keras.layers.Dense(32, activation='relu'),
        keras.layers.Dropout(0.1),
        
        # 출력층: 15차원 RGB 벡터
        keras.layers.Dense(output_dim, activation='sigmoid')
    ])
    
    # 학습률 스케줄링 (콜백으로 처리)
    optimizer = keras.optimizers.Adam(learning_rate=0.001)
    
    model.compile(
        optimizer=optimizer,
        loss='mse',
        metrics=['mae', 'cosine_similarity']
    )
    
    return model

def create_color_diversity_loss():
    """색상 다양성을 위한 커스텀 손실 함수"""
    def diversity_loss(y_true, y_pred):
        # 기본 MSE 손실
        mse_loss = tf.keras.losses.mse(y_true, y_pred)
        
        # 색상 다양성 손실 (색상 간 거리 최대화)
        batch_size = tf.shape(y_pred)[0]
        
        # 5개 색상으로 재구성 (각 색상은 3차원 RGB)
        colors = tf.reshape(y_pred, (batch_size, 5, 3))
        
        # 색상 간 평균 거리 계산
        color_distances = []
        for i in range(5):
            for j in range(i+1, 5):
                dist = tf.norm(colors[:, i, :] - colors[:, j, :], axis=1)
                color_distances.append(dist)
        
        if color_distances:
            avg_distance = tf.reduce_mean(tf.stack(color_distances, axis=1), axis=1)
            diversity_penalty = tf.exp(-avg_distance)  # 거리가 가까우면 페널티
        else:
            diversity_penalty = 0
        
        # 최종 손실 = MSE + 다양성 페널티
        return mse_loss + 0.1 * tf.reduce_mean(diversity_penalty)
    
    return diversity_loss

def train_diverse_face_to_color_model(X, y, metadata):
    """다양한 얼굴-색상 모델 학습"""
    print("🧠 다양한 얼굴-색상 모델 학습 시작...")
    
    # 데이터 분할
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print(f"   훈련 데이터: {len(X_train)}개")
    print(f"   검증 데이터: {len(X_val)}개")
    
    # 입력 데이터 정규화
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    
    # 모델 생성
    model = create_enhanced_diverse_model()
    
    # 모델 구조 출력
    print(f"\n📋 모델 구조:")
    model.summary()
    
    # 콜백 설정
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=25,
            restore_best_weights=True,
            verbose=1
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.7,
            patience=15,
            min_lr=1e-6,
            verbose=1
        ),
        keras.callbacks.ModelCheckpoint(
            'best_diverse_model.h5',
            monitor='val_loss',
            save_best_only=True,
            verbose=1
        )
    ]
    
    # 학습
    print("\n🚀 학습 시작...")
    history = model.fit(
        X_train_scaled, y_train,
        validation_data=(X_val_scaled, y_val),
        epochs=200,
        batch_size=64,
        callbacks=callbacks,
        verbose=1
    )
    
    # 최종 성능 출력
    final_loss = history.history['loss'][-1]
    val_loss = history.history['val_loss'][-1]
    print(f"\n📊 최종 성능:")
    print(f"   훈련 손실: {final_loss:.6f}")
    print(f"   검증 손실: {val_loss:.6f}")
    
    # 색상 다양성 테스트
    test_color_diversity(model, X_val_scaled, y_val)
    
    return model, scaler

def test_color_diversity(model, X_val, y_val):
    """색상 다양성 테스트"""
    print("\n🎨 색상 다양성 테스트:")
    
    # 예측 수행
    predictions = model.predict(X_val[:100])  # 100개 샘플 테스트
    
    # 색상 다양성 분석
    unique_colors = set()
    color_distances = []
    
    for pred in predictions:
        # 5개 색상으로 재구성
        colors = pred.reshape(5, 3)
        
        for color in colors:
            # RGB를 HEX로 변환
            hex_color = rgb_to_hex(color[0], color[1], color[2])
            unique_colors.add(hex_color)
        
        # 색상 간 거리 계산
        for i in range(5):
            for j in range(i+1, 5):
                dist = np.linalg.norm(colors[i] - colors[j])
                color_distances.append(dist)
    
    avg_distance = np.mean(color_distances)
    print(f"   예측된 고유 색상 수: {len(unique_colors)}개")
    print(f"   평균 색상 간 거리: {avg_distance:.3f}")
    print(f"   색상 다양성 점수: {len(unique_colors) / 100 * 100:.1f}%")

def rgb_to_hex(r, g, b):
    """RGB 값을 HEX로 변환"""
    def to_hex(n):
        hex_val = hex(int(n * 255))[2:]
        return hex_val if len(hex_val) == 2 else f"0{hex_val}"
    
    return f"#{to_hex(r)}{to_hex(g)}{to_hex(b)}"

def save_diverse_model_as_tfjs(model, scaler):
    """다양한 모델을 TensorFlow.js 형식으로 저장"""
    # 모델 저장 디렉토리 생성
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_dir = os.path.join(script_dir, "..", "public", "models", "diverse-face-to-color")
    model_dir = os.path.normpath(model_dir)
    
    # 기존 디렉토리 삭제 후 재생성
    import shutil
    if os.path.exists(model_dir):
        shutil.rmtree(model_dir)
    os.makedirs(model_dir, exist_ok=True)
    
    print(f"🔄 다양한 얼굴-색상 모델을 TensorFlow.js 형식으로 저장 중...")
    
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
                        layer_config['inputShape'] = batch_shape[1:]
                    del layer_config['batch_shape']
    
    # 2. 가중치 추출 및 저장
    weights = model.get_weights()
    weight_files = []
    
    for i, weight in enumerate(weights):
        weight_file = f"weights_{i}.bin"
        weight_path = os.path.join(model_dir, weight_file)
        weight.astype('float32').tofile(weight_path)
        weight_files.append(weight_file)
    
    # 3. 가중치 매니페스트 생성
    weights_manifest = [{
        "paths": weight_files,
        "weights": []
    }]
    
    # 각 가중치에 대한 상세 정보 추가
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
    
    # 4. model.json 파일 생성
    model_json = {
        "modelTopology": model_config,
        "weightsManifest": weights_manifest
    }
    
    with open(os.path.join(model_dir, 'model.json'), 'w') as f:
        json.dump(model_json, f, indent=2)
    
    # 5. 스케일러 정보 저장
    scaler_info = {
        'mean': scaler.mean_.tolist(),
        'scale': scaler.scale_.tolist(),
        'n_features_in_': scaler.n_features_in_
    }
    
    with open(os.path.join(model_dir, 'scaler_info.json'), 'w') as f:
        json.dump(scaler_info, f, indent=2)
    
    # 6. 모델 정보 저장
    model_info = {
        'input_dim': 148,
        'output_dim': 15,
        'description': '다양한 얼굴-색상 모델: MBTI 예측을 위한 색상 다양성 확보',
        'input_breakdown': {
            'face_descriptor': 128,
            'physical_features': 15,
            'random_seed': 5,
            'total': 148
        },
        'features': [
            'diverse_color_palettes', 'face_shape_analysis', 'color_harmony',
            'brightness_variation', 'saturation_diversity', 'temperature_range'
        ],
        'color_categories': [
            'vibrant', 'harmonious', 'cool', 'warm', 'neutral', 'contrast', 'random'
        ],
        'mbti_optimized': True
    }
    
    with open(os.path.join(model_dir, 'model_info.json'), 'w', encoding='utf-8') as f:
        json.dump(model_info, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 다양한 얼굴-색상 모델이 TensorFlow.js 형식으로 {model_dir}에 저장되었습니다.")
    print(f"   📁 생성된 파일: model.json, {len(weight_files)}개 가중치 파일, scaler_info.json, model_info.json")

def main():
    """메인 실행 함수"""
    print("🚀 다양한 얼굴-색상 모델 학습 시작!")
    print("🎨 MBTI 예측을 위한 색상 다양성 확보")
    print("📊 148차원 입력: descriptor(128) + 물리적 특징(15) + 랜덤 시드(5)")
    
    try:
        # 데이터 로드
        X, y, metadata = load_diverse_face_color_data()
        
        # 색상 다양성 분석
        analyze_color_diversity(y, metadata)
        
        # 모델 학습
        model, scaler = train_diverse_face_to_color_model(X, y, metadata)
        
        # TensorFlow.js 형식으로 저장
        save_diverse_model_as_tfjs(model, scaler)
        
        print("\n🎉 다양한 얼굴-색상 모델 학습 및 저장 완료!")
        print("🌐 이제 브라우저에서 바로 사용할 수 있습니다!")
        print("📁 생성된 파일들:")
        print("   - model.json: TensorFlow.js 호환 모델 구조")
        print("   - weights_*.bin: 모델 가중치 파일들")
        print("   - scaler_info.json: 입력 정규화 정보")
        print("   - model_info.json: 모델 정보")
        
    except FileNotFoundError:
        print("❌ 데이터 파일을 찾을 수 없습니다.")
        print("   먼저 'npm run generate-diverse-data'를 실행하여 데이터를 생성해주세요.")
    except Exception as error:
        print(f"❌ 오류 발생: {error}")

if __name__ == "__main__":
    main()