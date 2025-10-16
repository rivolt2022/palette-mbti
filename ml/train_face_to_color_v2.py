"""
얼굴 특징과 랜덤 시드를 활용한 향상된 얼굴-색상 모델 생성
148차원 입력 (descriptor 128 + 물리적 특징 15 + 랜덤 시드 5) → 15차원 RGB 출력
"""

import json
import numpy as np
import tensorflow as tf
from tensorflow import keras
import os
import random

def hex_to_rgb_normalized(hex_color):
    """16진수 색상을 0-1 범위의 RGB 값으로 변환"""
    hex_color = hex_color.lstrip('#')
    r = int(hex_color[0:2], 16) / 255.0
    g = int(hex_color[2:4], 16) / 255.0
    b = int(hex_color[4:6], 16) / 255.0
    return [r, g, b]

def load_emotion_color_mapping():
    """감정-색상 매핑 데이터 로드"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    mapping_path = os.path.join(script_dir, "..", "public", "data", "emotion-color-mapping.json")
    mapping_path = os.path.normpath(mapping_path)
    
    with open(mapping_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_enhanced_face_data(emotion_mapping, num_samples_per_emotion=30):
    """향상된 얼굴-색상 데이터 생성 (148차원 입력)"""
    X = []  # 148차원 입력 벡터 (descriptor 128 + 특징 15 + 랜덤 5)
    y = []  # 15차원 RGB 벡터 (5개 색상 × 3개 RGB)
    emotions = []  # 감정 라벨
    
    for emotion_name, emotion_data in emotion_mapping['emotions'].items():
        print(f"📊 {emotion_data['name']} 감정 데이터 생성 중...")
        
        for i in range(num_samples_per_emotion):
            # 1. 128차원 얼굴 descriptor 생성 (기존 방식)
            face_descriptor = generate_emotion_based_face_vector(emotion_name, emotion_data)
            
            # 2. 15차원 물리적 특징 생성 (감정에 따른 얼굴 특징)
            physical_features = generate_emotion_based_physical_features(emotion_name, emotion_data)
            
            # 3. 5차원 랜덤 시드 생성
            random_seed = [random.random() for _ in range(5)]
            
            # 4. 148차원 입력 벡터 조합
            combined_input = np.concatenate([face_descriptor, physical_features, random_seed])
            
            # 5. 감정에 맞는 색상 팔레트 선택
            base_palette = random.choice(emotion_data['basePalettes'])
            
            # 6. 색상 팔레트를 15차원 RGB 벡터로 변환
            rgb_vector = []
            for color in base_palette:
                rgb = hex_to_rgb_normalized(color)
                rgb_vector.extend(rgb)
            
            # 7. 색상 벡터에 물리적 특징과 랜덤 시드에 따른 변형 추가
            rgb_vector = add_enhanced_color_variation(
                rgb_vector, 
                physical_features, 
                random_seed,
                emotion_data['colorCharacteristics']
            )
            
            X.append(combined_input)
            y.append(rgb_vector)
            emotions.append(emotion_name)
    
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.float32), emotions

def generate_emotion_based_face_vector(emotion_name, emotion_data):
    """감정에 따른 얼굴 descriptor 생성 (기존 방식)"""
    # 기본 128차원 벡터 (정규분포)
    face_vector = np.random.normal(0, 1, 128)
    
    # 감정별 특성 반영
    char = emotion_data['colorCharacteristics']
    
    if emotion_name == 'happy':
        # 행복: 밝고 활기찬 특징 (양수 편향)
        face_vector = np.abs(face_vector) * 0.8 + 0.2
    elif emotion_name == 'sad':
        # 슬픔: 어둡고 차분한 특징 (음수 편향)
        face_vector = -np.abs(face_vector) * 0.6 - 0.1
    elif emotion_name == 'angry':
        # 분노: 강렬하고 대비 높은 특징 (극값)
        face_vector = np.sign(face_vector) * np.power(np.abs(face_vector), 0.5)
    elif emotion_name == 'fearful':
        # 두려움: 차가운 특징 (특정 차원 강조)
        face_vector[0:32] *= 1.5  # 앞쪽 차원 강조
    elif emotion_name == 'disgusted':
        # 혐오: 탁한 특징 (중간값 중심)
        face_vector = np.tanh(face_vector) * 0.5
    elif emotion_name == 'surprised':
        # 놀람: 선명한 특징 (고주파 성분)
        face_vector = face_vector * np.sin(np.linspace(0, 4*np.pi, 128))
    else:  # neutral
        # 중립: 균형 잡힌 특징 (정규분포 유지)
        pass
    
    # 정규화
    face_vector = (face_vector - np.mean(face_vector)) / (np.std(face_vector) + 1e-8)
    
    return face_vector

def generate_emotion_based_physical_features(emotion_name, emotion_data):
    """감정에 따른 물리적 특징 생성 (15차원)"""
    # 기본 15차원 특징 벡터 (0-1 범위)
    features = np.random.uniform(0, 1, 15)
    
    # 감정별 물리적 특징 패턴 적용
    if emotion_name == 'happy':
        # 행복: 큰 눈, 넓은 입, 높은 이마
        features[0] = np.random.uniform(0.6, 1.0)  # 얼굴 가로세로 비율 (둥근 얼굴)
        features[4] = np.random.uniform(0.7, 1.0)  # 눈 크기 (큰 눈)
        features[8] = np.random.uniform(0.7, 1.0)  # 입 너비 (넓은 입)
        features[2] = np.random.uniform(0.6, 1.0)  # 이마 너비 (넓은 이마)
        
    elif emotion_name == 'sad':
        # 슬픔: 작은 눈, 작은 입, 낮은 이마
        features[0] = np.random.uniform(0.3, 0.7)  # 얼굴 가로세로 비율 (긴 얼굴)
        features[4] = np.random.uniform(0.2, 0.6)  # 눈 크기 (작은 눈)
        features[8] = np.random.uniform(0.2, 0.5)  # 입 너비 (작은 입)
        features[2] = np.random.uniform(0.2, 0.6)  # 이마 너비 (좁은 이마)
        
    elif emotion_name == 'angry':
        # 분노: 가늘고 긴 얼굴, 작은 눈, 큰 입
        features[0] = np.random.uniform(0.2, 0.5)  # 얼굴 가로세로 비율 (긴 얼굴)
        features[4] = np.random.uniform(0.3, 0.7)  # 눈 크기 (중간)
        features[8] = np.random.uniform(0.6, 1.0)  # 입 너비 (큰 입)
        features[1] = np.random.uniform(0.6, 1.0)  # 턱선 각도 (각진 턱)
        
    elif emotion_name == 'fearful':
        # 두려움: 큰 눈, 작은 입, 좁은 얼굴
        features[0] = np.random.uniform(0.3, 0.6)  # 얼굴 가로세로 비율 (좁은 얼굴)
        features[4] = np.random.uniform(0.7, 1.0)  # 눈 크기 (큰 눈)
        features[8] = np.random.uniform(0.2, 0.5)  # 입 너비 (작은 입)
        features[5] = np.random.uniform(0.6, 1.0)  # 눈간 거리 (넓은 간격)
        
    elif emotion_name == 'disgusted':
        # 혐오: 작은 눈, 작은 입, 좁은 코
        features[4] = np.random.uniform(0.2, 0.5)  # 눈 크기 (작은 눈)
        features[8] = np.random.uniform(0.2, 0.4)  # 입 너비 (작은 입)
        features[12] = np.random.uniform(0.2, 0.5)  # 코 너비 (좁은 코)
        
    elif emotion_name == 'surprised':
        # 놀람: 매우 큰 눈, 큰 입, 넓은 얼굴
        features[0] = np.random.uniform(0.6, 1.0)  # 얼굴 가로세로 비율 (둥근 얼굴)
        features[4] = np.random.uniform(0.8, 1.0)  # 눈 크기 (매우 큰 눈)
        features[8] = np.random.uniform(0.7, 1.0)  # 입 너비 (큰 입)
        features[6] = np.random.uniform(0.7, 1.0)  # 눈 높이 (높은 눈)
        
    else:  # neutral
        # 중립: 균형 잡힌 특징
        features = np.random.uniform(0.3, 0.7, 15)
    
    return features

def add_enhanced_color_variation(rgb_vector, physical_features, random_seed, color_characteristics):
    """물리적 특징과 랜덤 시드를 활용한 색상 변형"""
    rgb_vector = np.array(rgb_vector)
    
    # 기본 색상 특성
    brightness = color_characteristics['brightness']
    saturation = color_characteristics['saturation']
    temperature = color_characteristics['temperature']
    
    # 물리적 특징에 따른 색상 조정
    face_ratio = physical_features[0]  # 얼굴 가로세로 비율
    eye_size = physical_features[4]    # 눈 크기
    mouth_width = physical_features[8] # 입 너비
    
    # 랜덤 시드에 따른 변형
    random_brightness = random_seed[0] * 0.3 - 0.15  # -0.15 ~ +0.15
    random_saturation = random_seed[1] * 0.4 - 0.2   # -0.2 ~ +0.2
    random_temperature = random_seed[2] * 0.4 - 0.2  # -0.2 ~ +0.2
    
    # 물리적 특징에 따른 색상 조정
    # 큰 눈 → 더 선명한 색상
    eye_enhancement = (eye_size - 0.5) * 0.2
    # 넓은 입 → 더 따뜻한 색상
    mouth_warmth = (mouth_width - 0.5) * 0.1
    # 둥근 얼굴 → 더 부드러운 색상
    face_softness = (face_ratio - 0.5) * 0.1
    
    # 최종 색상 조정 적용
    for i in range(0, len(rgb_vector), 3):
        r, g, b = rgb_vector[i:i+3]
        
        # 밝기 조정 (기본 + 랜덤 + 물리적 특징)
        brightness_factor = brightness + random_brightness + eye_enhancement
        rgb_vector[i:i+3] = rgb_vector[i:i+3] * brightness_factor + (1 - brightness_factor) * 0.1
        
        # 채도 조정
        saturation_factor = saturation + random_saturation + eye_enhancement
        max_val = max(r, g, b)
        if max_val > 0:
            rgb_vector[i:i+3] = rgb_vector[i:i+3] * saturation_factor + (1 - saturation_factor) * max_val
        
        # 색온도 조정 (기본 + 랜덤 + 입 특징)
        temperature_factor = temperature + random_temperature + mouth_warmth
        if temperature_factor > 0:  # 따뜻한 색
            rgb_vector[i] += temperature_factor * 0.1
            rgb_vector[i+1] += temperature_factor * 0.05
            rgb_vector[i+2] -= temperature_factor * 0.1
        else:  # 차가운 색
            rgb_vector[i] -= abs(temperature_factor) * 0.1
            rgb_vector[i+1] -= abs(temperature_factor) * 0.05
            rgb_vector[i+2] += abs(temperature_factor) * 0.1
        
        # 부드러움 조정 (둥근 얼굴)
        if face_softness > 0:
            rgb_vector[i:i+3] = rgb_vector[i:i+3] * (1 - face_softness * 0.1) + face_softness * 0.1
    
    # 0-1 범위로 클리핑
    rgb_vector = np.clip(rgb_vector, 0, 1)
    
    return rgb_vector.tolist()

def augment_enhanced_face_data(X, y, augmentation_factor=5):
    """향상된 얼굴-색상 데이터 증강"""
    X_augmented = []
    y_augmented = []
    
    for i in range(len(X)):
        # 원본 데이터 추가
        X_augmented.append(X[i])
        y_augmented.append(y[i])
        
        # 증강 데이터 생성
        for _ in range(augmentation_factor):
            # 각 부분별로 다른 노이즈 적용
            face_descriptor = X[i][:128]
            physical_features = X[i][128:143]
            random_seed = X[i][143:148]
            
            # 얼굴 descriptor에 노이즈 추가
            face_noise = np.random.normal(0, 0.1, 128)
            face_augmented = np.clip(face_descriptor + face_noise, -3, 3)
            
            # 물리적 특징에 약간의 노이즈 추가
            physical_noise = np.random.normal(0, 0.05, 15)
            physical_augmented = np.clip(physical_features + physical_noise, 0, 1)
            
            # 랜덤 시드 재생성
            random_augmented = np.random.uniform(0, 1, 5)
            
            # 조합
            combined_augmented = np.concatenate([face_augmented, physical_augmented, random_augmented])
            
            # 색상 벡터에 노이즈 추가
            color_noise = np.random.normal(0, 0.03, 15)
            color_augmented = np.clip(y[i] + color_noise, 0, 1)
            
            X_augmented.append(combined_augmented)
            y_augmented.append(color_augmented)
    
    return np.array(X_augmented, dtype=np.float32), np.array(y_augmented, dtype=np.float32)

def create_enhanced_face_to_color_model(input_dim=148, output_dim=15):
    """향상된 얼굴-색상 모델 생성"""
    model = keras.Sequential([
        # 입력층: 148차원 (descriptor 128 + 특징 15 + 랜덤 5)
        keras.layers.Dense(128, activation='relu', input_shape=(input_dim,)),
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.3),
        
        # 은닉층 1
        keras.layers.Dense(64, activation='relu'),
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.2),
        
        # 은닉층 2
        keras.layers.Dense(32, activation='relu'),
        keras.layers.Dropout(0.1),
        
        # 출력층: 15차원 RGB 벡터
        keras.layers.Dense(output_dim, activation='sigmoid')
    ])
    
    optimizer = keras.optimizers.Adam(learning_rate=0.001)
    
    model.compile(
        optimizer=optimizer,
        loss='mse',
        metrics=['mae']
    )
    
    return model

def train_enhanced_face_to_color_model(X, y):
    """향상된 얼굴-색상 모델 학습"""
    print("🧠 향상된 얼굴-색상 모델 학습 시작...")
    print(f"   입력 차원: {X.shape[1]} (descriptor 128 + 특징 15 + 랜덤 5)")
    print(f"   출력 차원: {y.shape[1]}")
    print(f"   총 샘플 수: {len(X)}")
    
    model = create_enhanced_face_to_color_model()
    
    # Early stopping 콜백
    early_stopping = keras.callbacks.EarlyStopping(
        monitor='val_loss',
        patience=20,
        restore_best_weights=True,
        verbose=1
    )
    
    # 학습률 감소 콜백
    reduce_lr = keras.callbacks.ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=10,
        min_lr=1e-7,
        verbose=1
    )
    
    # 학습
    history = model.fit(
        X, y,
        epochs=150,
        batch_size=32,
        validation_split=0.2,
        callbacks=[early_stopping, reduce_lr],
        verbose=1
    )
    
    # 최종 성능 출력
    final_loss = history.history['loss'][-1]
    val_loss = history.history['val_loss'][-1]
    print(f"최종 훈련 손실: {final_loss:.6f}")
    print(f"최종 검증 손실: {val_loss:.6f}")
    
    return model

def save_enhanced_face_to_color_model_as_tfjs(model):
    """향상된 얼굴-색상 모델을 TensorFlow.js 형식으로 저장"""
    # 모델 저장 디렉토리 생성
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_dir = os.path.join(script_dir, "..", "public", "models", "enhanced-face-to-color")
    model_dir = os.path.normpath(model_dir)
    
    # 기존 디렉토리 삭제 후 재생성
    import shutil
    if os.path.exists(model_dir):
        shutil.rmtree(model_dir)
    os.makedirs(model_dir, exist_ok=True)
    
    print(f"🔄 향상된 얼굴-색상 모델을 TensorFlow.js 형식으로 저장 중...")
    
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
    
    # 5. 모델 정보 저장
    model_info = {
        'input_dim': 148,
        'output_dim': 15,
        'description': '향상된 얼굴-색상 모델: descriptor(128) + 물리적 특징(15) + 랜덤 시드(5) → RGB(15)',
        'input_breakdown': {
            'face_descriptor': 128,
            'physical_features': 15,
            'random_seed': 5,
            'total': 148
        },
        'physical_features': [
            'face_aspect_ratio', 'jaw_angle', 'forehead_width', 'symmetry',
            'eye_size', 'eye_distance', 'eye_height', 'eye_angle',
            'mouth_width', 'mouth_height', 'lip_thickness',
            'nose_length', 'nose_width',
            'upper_face_ratio', 'lower_face_ratio'
        ],
        'emotions': ['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'neutral']
    }
    
    with open(os.path.join(model_dir, 'model_info.json'), 'w', encoding='utf-8') as f:
        json.dump(model_info, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 향상된 얼굴-색상 모델이 TensorFlow.js 형식으로 {model_dir}에 저장되었습니다.")
    print(f"   📁 생성된 파일: model.json, {len(weight_files)}개 가중치 파일, model_info.json")

def main():
    """메인 실행 함수"""
    print("🚀 향상된 얼굴-색상 팔레트 모델 학습 시작!")
    print("🌐 TensorFlow.js 브라우저 호환 형식으로 저장")
    print("📊 148차원 입력: descriptor(128) + 물리적 특징(15) + 랜덤 시드(5)")
    
    # 감정-색상 매핑 로드
    print("📊 감정-색상 매핑 데이터 로드 중...")
    emotion_mapping = load_emotion_color_mapping()
    
    # 향상된 데이터 생성
    print("🔧 향상된 얼굴-색상 데이터 생성 중...")
    X, y, emotions = generate_enhanced_face_data(emotion_mapping, num_samples_per_emotion=40)
    print(f"   생성된 샘플 수: {len(X)}")
    print(f"   입력 차원: {X.shape[1]} (descriptor 128 + 특징 15 + 랜덤 5)")
    print(f"   출력 차원: {y.shape[1]}")
    
    # 데이터 증강
    print("🔄 데이터 증강 중...")
    X_augmented, y_augmented = augment_enhanced_face_data(X, y, augmentation_factor=5)
    print(f"   증강 후 샘플 수: {len(X_augmented)}")
    
    # 모델 학습
    print("🧠 모델 학습 시작...")
    model = train_enhanced_face_to_color_model(X_augmented, y_augmented)
    
    # TensorFlow.js 형식으로 저장
    print("💾 TensorFlow.js 형식으로 저장 중...")
    save_enhanced_face_to_color_model_as_tfjs(model)
    
    print("🎉 향상된 얼굴-색상 모델 학습 및 저장 완료!")
    print("🌐 이제 브라우저에서 바로 사용할 수 있습니다!")
    print("📁 생성된 파일들:")
    print("   - model.json: TensorFlow.js 호환 모델 구조")
    print("   - weights_*.bin: 모델 가중치 파일들")
    print("   - model_info.json: 모델 정보 및 특징 설명")

if __name__ == "__main__":
    main()
