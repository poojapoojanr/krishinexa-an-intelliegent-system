import os

# Path to your dataset directory (folders = class names)
DATASET_DIR = os.path.join(os.path.dirname(__file__), '..', 'PlantVillage', 'PlantVillage')

labels = [d for d in os.listdir(DATASET_DIR) if os.path.isdir(os.path.join(DATASET_DIR, d))]
labels.sort()  # Sort for consistency

with open(os.path.join(os.path.dirname(__file__), 'labels.py'), 'w', encoding='utf-8') as f:
    f.write('# Auto-generated label list based on dataset folders\n')
    f.write('LABELS = [\n')
    for label in labels:
        f.write(f'    "{label}",\n')
    f.write(']\n')

print(f"Found {len(labels)} classes. labels.py updated.")
