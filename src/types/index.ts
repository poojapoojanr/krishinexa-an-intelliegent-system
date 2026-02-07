
export type Farm = {
  id: string;
  name: string;
  location: string;
  size: number;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  acres?: string;
};

export type WeatherAlert = {
    id: string;
    title: string;
    description: string;
    date: string;
    severity: 'High' | 'Medium' | 'Low';
}

export type Task = {
    id: string;
    name: string;
    assignedTo: string;
    dueDate: string;
    status: string;
}

export type SeasonalTask = {
    id: string;
    activity: string;
    farm: string;
    date: string;
}

export type SensorData = {
    name: string;
    value: number;
}

export type CropPrice = {
    id: string;
    name: string;
    variety: string;
    market: string;
    price: number;
}

export type MachineryPrice = {
    id:string;
    name: string;
    imageId: string;
    purchasePrice: number;
    rentalPrice: number;
}

export type FertilizerPrice = {
    id: string;
    name: string;
    type: string;
    price: number;
}

export type Loan = {
    id: string;
    name: string;
    bank: string;
    interestRate: string;
    maxAmount: string;
    description: string;
}

export type Subsidy = {
    id: string;
    name: string;
    department: string;
    description: string;
    eligibility: string;
    link: string;
}

export type YieldData = {
  month: string;
  yield: number;
}

export type ProductionData = {
  name: string;
  value: number;
}
