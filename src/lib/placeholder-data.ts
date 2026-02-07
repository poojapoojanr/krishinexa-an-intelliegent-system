import type { Farm, WeatherAlert, SeasonalTask, SensorData, CropPrice, MachineryPrice, FertilizerPrice, Loan, Subsidy } from '@/types';

export const myFarms: Farm[] = [
  {
    id: 'farm-01',
    name: 'Green Valley Organics',
    location: 'Anand, Gujarat',
    size: '15 Acres',
    imageId: 'farm-1',
  },
  {
    id: 'farm-02',
    name: 'Sunrise Meadows',
    location: 'Kheda, Gujarat',
    size: '25 Acres',
    imageId: 'farm-2',
  },
  {
    id: 'farm-03',
    name: 'Golden Harvest Fields',
    location: 'Nadiad, Gujarat',
    size: '10 Acres',
    imageId: 'farm-3',
  },
];

export const weatherAlerts: WeatherAlert[] = [
    {
      id: 'alert-01',
      title: 'High Heat Warning',
      description: 'Temperatures expected to exceed 40°C. Ensure crops are well-irrigated.',
      date: '2024-07-28',
      severity: 'High',
    },
    {
      id: 'alert-02',
      title: 'Pest Advisory: Thrips',
      description: 'Conditions are favorable for thrips infestation. Monitor chili and cotton crops.',
      date: '2024-07-27',
      severity: 'Medium',
    },
    {
      id: 'alert-03',
      title: 'Chance of Rain',
      description: 'Light showers expected in the evening. Plan irrigation accordingly.',
      date: '2024-07-29',
      severity: 'Low',
    },
];

export const upcomingTasks: SeasonalTask[] = [
    {
        id: 'task-01',
        activity: 'Fertilizer Application',
        farm: 'Green Valley Organics',
        date: 'Today'
    },
    {
        id: 'task-02',
        activity: 'Sowing - Wheat',
        farm: 'Sunrise Meadows',
        date: 'Tomorrow'
    },
    {
        id: 'task-03',
        activity: 'Irrigation',
        farm: 'Golden Harvest Fields',
        date: 'July 30'
    },
    {
        id: 'task-04',
        activity: 'Pesticide Spray',
        farm: 'Green Valley Organics',
        date: 'Aug 02'
    },
     {
        id: 'task-05',
        activity: 'Harvesting - Maize',
        farm: 'Sunrise Meadows',
        date: 'Aug 15'
    },
    {
        id: 'task-06',
        activity: 'Soil Testing',
        farm: 'Golden Harvest Fields',
        date: 'Aug 20'
    }
];

export const soilMoistureData: SensorData[] = [
    { name: '00:00', value: 35 }, { name: '04:00', value: 38 },
    { name: '08:00', value: 32 }, { name: '12:00', value: 28 },
    { name: '16:00', value: 25 }, { name: '20:00', value: 30 },
];

export const soilTemperatureData: SensorData[] = [
    { name: '00:00', value: 26 }, { name: '04:00', value: 25 },
    { name: '08:00', value: 28 }, { name: '12:00', value: 32 },
    { name: '16:00', value: 34 }, { name: '20:00', value: 30 },
];

export const soilNutrientsData = {
    ph: [
        { name: 'Week 1', value: 6.8 }, { name: 'Week 2', value: 6.9 },
        { name: 'Week 3', value: 6.7 }, { name: 'Week 4', value: 6.8 },
    ],
    nitrogen: [
        { name: 'Week 1', value: 120 }, { name: 'Week 2', value: 115 },
        { name: 'Week 3', value: 110 }, { name: 'Week 4', value: 118 },
    ],
    phosphorus: [
        { name: 'Week 1', value: 50 }, { name: 'Week 2', value: 48 },
        { name: 'Week 3', value: 52 }, { name: 'Week 4', value: 51 },
    ],
    potassium: [
        { name: 'Week 1', value: 150 }, { name: 'Week 2', value: 155 },
        { name: 'Week 3', value: 148 }, { name: 'Week 4', value: 152 },
    ],
};

export const cropPrices: CropPrice[] = [
    { id: 'cp-1', name: 'Cotton', variety: 'Kapas', market: 'Anand APMC', price: 7500 },
    { id: 'cp-2', name: 'Paddy', variety: 'Basmati', market: 'Nadiad APMC', price: 3200 },
    { id: 'cp-3', name: 'Wheat', variety: 'Lokwan', market: 'Kheda APMC', price: 2400 },
    { id: 'cp-4', name: 'Maize', variety: 'Hybrid', market: 'Anand APMC', price: 2100 },
    { id: 'cp-5', name: 'Chilli', variety: 'S4', market: 'Kheda APMC', price: 15000 },
];

export const machineryPrices: MachineryPrice[] = [
    { id: 'mp-1', name: 'Tractor', imageId: 'machinery-tractor', purchasePrice: 850000, rentalPrice: 2000 },
    { id: 'mp-2', name: 'Rotavator', imageId: 'machinery-rotavator', purchasePrice: 120000, rentalPrice: 800 },
    { id: 'mp-3', name: 'Harvester', imageId: 'machinery-harvester', purchasePrice: 2500000, rentalPrice: 5000 },
    { id: 'mp-4', name: 'Seed Drill', imageId: 'machinery-seeddrill', purchasePrice: 95000, rentalPrice: 500 },
    { id: 'mp-5', name: 'Power Tiller', imageId: 'machinery-powertiller', purchasePrice: 180000, rentalPrice: 900 },
    { id: 'mp-6', name: 'Baler', imageId: 'machinery-baler', purchasePrice: 650000, rentalPrice: 2500 },
    { id: 'mp-7', name: 'Sprayer', imageId: 'machinery-sprayer', purchasePrice: 35000, rentalPrice: 200 },
    { id: 'mp-8', name: 'Plough', imageId: 'machinery-plough', purchasePrice: 40000, rentalPrice: 250 },
    { id: 'mp-9', name: 'Cultivator', imageId: 'machinery-cultivator', purchasePrice: 60000, rentalPrice: 350 },
    { id: 'mp-10', name: 'Disc Harrow', imageId: 'machinery-disharrow', purchasePrice: 85000, rentalPrice: 400 },
];

export const fertilizerPrices: FertilizerPrice[] = [
    { id: 'fp-1', name: 'Urea', type: 'Nitrogen', price: 266.50 },
    { id: 'fp-2', name: 'DAP', type: 'Phosphorus', price: 1350 },
    { id: 'fp-3', name: 'MOP', type: 'Potassium', price: 1700 },
    { id: 'fp-4', name: 'NPK (10:26:26)', type: 'Complex', price: 1470 },
    { id: 'fp-5', name: 'SSP', type: 'Phosphorus', price: 380 },
    { id: 'fp-6', name: 'Ammonium Sulphate', type: 'Nitrogen', price: 600 },
    { id: 'fp-7', name: 'CAN', type: 'Nitrogen', price: 1200 },
    { id: 'fp-8', name: 'Zinc Sulphate', type: 'Micronutrient', price: 2800 },
    { id: 'fp-9', name: 'Potash', type: 'Potassium', price: 1600 },
    { id: 'fp-10', name: 'NPK (20:20:0)', type: 'Complex', price: 950 },
];

export const availableLoans: Loan[] = [
    {
        id: 'loan-1',
        name: 'Kisan Credit Card (KCC)',
        bank: 'Multiple Public &amp; Private Banks',
        interestRate: '7% (3% interest subvention available)',
        maxAmount: 'Up to ₹3,00,000',
        description: 'Provides short-term credit for cultivation, post-harvest expenses, and consumption requirements.'
    },
    {
        id: 'loan-2',
        name: 'Agri Term Loan',
        bank: 'State Bank of India',
        interestRate: 'Starts from 8.5%',
        maxAmount: 'Based on project cost',
        description: 'For investment purposes like land development, minor irrigation, and purchasing farm machinery.'
    },
    {
        id: 'loan-3',
        name: 'Tractor Loan',
        bank: 'HDFC Bank',
        interestRate: 'Varies based on profile',
        maxAmount: 'Up to 90% of tractor cost',
        description: 'Flexible repayment options and quick processing for purchasing new or used tractors.'
    }
];

export const governmentSubsidies: Subsidy[] = [
    {
        id: 'sub-1',
        name: 'PM-KISAN Scheme',
        department: 'Dept. of Agriculture, Cooperation &amp; Farmers Welfare',
        description: 'Income support of ₹6,000 per year in three equal installments to all landholding farmer families.',
        eligibility: 'All landholding farmer families.',
        link: 'https://pmkisan.gov.in/'
    },
    {
        id: 'sub-2',
        name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
        department: 'Dept. of Agriculture, Cooperation &amp; Farmers Welfare',
        description: 'Insurance coverage and financial support to farmers in the event of failure of any of the notified crops as a result of natural calamities, pests &amp; diseases.',
        eligibility: 'Farmers growing notified crops in notified areas.',
        link: 'https://pmfby.gov.in/'
    },
    {
        id: 'sub-3',
        name: 'Solar Pump Subsidy (PM-KUSUM)',
        department: 'Ministry of New and Renewable Energy',
        description: 'Provides up to 60% subsidy on solar pumps to farmers, reducing dependence on diesel for irrigation.',
        eligibility: 'Individual farmers, groups of farmers, co-operatives.',
        link: 'https://pmkusum.mnre.gov.in/'
    }
];
