import { initializeFirebase } from '@/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';

// NOTE: Replace with a real user ID from your Firebase Authentication
const USER_ID = '{{REPLACE_WITH_REAL_USER_ID}}';

async function seedDatabase() {
  if (USER_ID.startsWith('{{')) {
    console.error(
      'Error: Please replace USER_ID in src/lib/seed.ts with a real user ID from your Firebase Authentication.'
    );
    return;
  }

  const { firestore } = initializeFirebase();
  const batch = writeBatch(firestore);

  console.log('Starting to seed data for user:', USER_ID);

  // 1. Seed Farms
  const farms = [
    { id: 'farm-01', name: 'Green Valley Organics', location: 'Mandya, Karnataka', size: 15, imageId: 'farm-1' },
    { id: 'farm-02', name: 'Sunrise Meadows', location: 'Hassan, Karnataka', size: 25, imageId: 'farm-2' },
    { id: 'farm-03', name: 'Golden Harvest Fields', location: 'Mysuru, Karnataka', size: 10, imageId: 'farm-3' },
  ];

  farms.forEach((farm) => {
    const farmRef = doc(firestore, `users/${USER_ID}/farms`, farm.id);
    batch.set(farmRef, farm);
  });
  console.log('Farms queued for seeding.');

  // 2. Seed Tasks
  const tasks = [
    { id: 'task-01', name: 'Apply Fertilizer to Ragi', assignedTo: 'Ramesh', dueDate: '29-Aug-24', status: 'Pending' },
    { id: 'task-02', name: 'Harvest Sugarcane', assignedTo: 'Suresh', dueDate: '02-Sep-24', status: 'In Progress' },
  ];

  tasks.forEach(task => {
    const taskRef = doc(firestore, `users/${USER_ID}/tasks`, task.id);
    batch.set(taskRef, task);
  });
  console.log('Tasks queued for seeding.');

  // 3. Seed Yield Data
  const yieldData = [
      { month: "Jan", yield: 186 }, { month: "Feb", yield: 305 },
      { month: "Mar", yield: 237 }, { month: "Apr", yield: 273 },
      { month: "May", yield: 300 }, { month: "Jun", yield: 209 },
      { month: "Jul", yield: 214 }, { month: "Aug", yield: 350 },
      { month: "Sep", yield: 400 },
  ];

  yieldData.forEach(data => {
    const yieldRef = doc(collection(firestore, `users/${USER_ID}/yieldData`));
    batch.set(yieldRef, data);
  });
  console.log('Yield data queued for seeding.');

  // 4. Seed Production Data
  const productionData = [
    { name: 'Wheat', value: 40 },
    { name: 'Corn', value: 30 },
    { name: 'Rice', value: 20 },
  ];

  productionData.forEach(data => {
    const prodRef = doc(collection(firestore, `users/${USER_ID}/productionData`));
    batch.set(prodRef, data);
  });
  console.log('Production data queued for seeding.');


  try {
    await batch.commit();
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase();
