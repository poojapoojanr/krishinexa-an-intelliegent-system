"""
Train a single MobileNetV2 model for plant disease detection using PlantVillage dataset.
Saves model as plant_disease_mobilenetv2.h5 and labels as disease_labels.txt in app folder.
"""
import os
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam

DATA_DIR = os.path.join(os.path.dirname(__file__), 'Data', 'PlantVillage')
IMG_SIZE = (128, 128)
BATCH_SIZE = 32
EPOCHS = 20
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'plant_disease_mobilenetv2.h5')
LABELS_PATH = os.path.join(os.path.dirname(__file__), 'disease_labels.txt')

# Data generators
train_datagen = ImageDataGenerator(rescale=1./255, validation_split=0.2)
train_gen = train_datagen.flow_from_directory(
    DATA_DIR, target_size=IMG_SIZE, batch_size=BATCH_SIZE,
    class_mode='categorical', subset='training')
val_gen = train_datagen.flow_from_directory(
    DATA_DIR, target_size=IMG_SIZE, batch_size=BATCH_SIZE,
    class_mode='categorical', subset='validation')

# Model
base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=IMG_SIZE + (3,))
x = GlobalAveragePooling2D()(base_model.output)
output = Dense(train_gen.num_classes, activation='softmax')(x)
model = Model(inputs=base_model.input, outputs=output)

model.compile(optimizer=Adam(), loss='categorical_crossentropy', metrics=['accuracy'])
model.fit(train_gen, validation_data=val_gen, epochs=EPOCHS)

model.save(MODEL_PATH)

# Save labels
labels = list(train_gen.class_indices.keys())
with open(LABELS_PATH, 'w') as f:
    for label in labels:
        f.write(label + '\n')

print(f"Model saved to {MODEL_PATH}")
print(f"Labels saved to {LABELS_PATH}")
