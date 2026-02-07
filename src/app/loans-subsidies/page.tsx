'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Landmark, HandCoins, ExternalLink, CheckCircle2, AlertCircle, Calculator, IndianRupee, Clock, FileText, Phone, Building, Percent, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/use-translation';

// Comprehensive loan data with detailed information
const loanSchemes = [
  {
    id: 'kcc',
    name: 'Kisan Credit Card (KCC)',
    bank: 'All Public & Private Banks',
    interestRate: '4% (after 3% subvention)',
    maxAmount: '₹3,00,000',
    tenure: '5 years (renewed annually)',
    description: 'Comprehensive credit for cultivation, post-harvest, consumption needs, and allied activities.',
    eligibility: [
      'All farmers (owner cultivators, tenant farmers, sharecroppers)',
      'Age: 18-75 years',
      'Valid land documents or tenancy agreement',
      'No defaulter history'
    ],
    documents: ['Aadhaar Card', 'Land Records/Tenancy Proof', 'Passport Photo', 'Bank Passbook'],
    benefits: ['Personal accident insurance ₹50,000', 'Flexible repayment', 'No collateral up to ₹1.6 lakh'],
    applyLink: 'https://pmkisan.gov.in/RegistrationFormupdated.aspx',
    helpline: '1800-180-1551'
  },
  {
    id: 'sbi-agri',
    name: 'SBI Agri Term Loan',
    bank: 'State Bank of India',
    interestRate: '8.5% - 10.5%',
    maxAmount: 'Up to ₹50 Lakhs',
    tenure: '7-12 years',
    description: 'For land development, irrigation, farm mechanization, dairy, poultry, and allied activities.',
    eligibility: [
      'Farmers with agricultural land',
      'Age: 21-65 years',
      'CIBIL Score: 650+',
      'Minimum 3 years farming experience'
    ],
    documents: ['Land Documents', 'ID Proof', 'Income Proof', 'Project Report', 'Quotations'],
    benefits: ['No prepayment charges', 'Moratorium period available', 'Flexible EMI options'],
    applyLink: 'https://sbi.co.in/web/agri-rural/agriculture-banking',
    helpline: '1800-11-2211'
  },
  {
    id: 'tractor-loan',
    name: 'Tractor & Machinery Loan',
    bank: 'Multiple Banks (HDFC, SBI, ICICI)',
    interestRate: '8% - 12%',
    maxAmount: 'Up to 90% of equipment cost',
    tenure: '5-7 years',
    description: 'Finance for purchasing tractors, harvesters, tillers, and other farm equipment.',
    eligibility: [
      'Land ownership of minimum 2.5 acres',
      'Age: 21-60 years',
      'CIBIL Score: 700+',
      '10% down payment required'
    ],
    documents: ['Land Records', 'ID & Address Proof', 'Bank Statements (6 months)', 'Quotation from dealer'],
    benefits: ['Quick disbursal', 'No hidden charges', 'Equipment insurance included'],
    applyLink: 'https://www.hdfcbank.com/agri/borrow',
    helpline: '1800-202-6161'
  },
  {
    id: 'dairy-loan',
    name: 'Dairy & Animal Husbandry Loan',
    bank: 'NABARD / Cooperative Banks',
    interestRate: '9% - 11%',
    maxAmount: '₹10 Lakhs - ₹2 Crores',
    tenure: '5-10 years',
    description: 'For establishing dairy farms, purchasing cattle, and building sheds and equipment.',
    eligibility: [
      'Farmers with allied agriculture activities',
      'Experience in dairy/animal husbandry',
      'Valid project report',
      'Land for setting up unit'
    ],
    documents: ['Project Report', 'Land Documents', 'Training Certificate (if any)', 'Bank Statements'],
    benefits: ['Up to 25% subsidy under NABARD schemes', 'Technical support available', 'Insurance coverage'],
    applyLink: 'https://www.nabard.org/content1.aspx?id=23&catid=23&mid=530',
    helpline: '1800-180-2000'
  }
];

// Comprehensive subsidy data
const subsidySchemes = [
  {
    id: 'pm-kisan',
    name: 'PM-KISAN',
    ministry: 'Ministry of Agriculture',
    amount: '₹6,000/year',
    frequency: '3 installments of ₹2,000',
    description: 'Direct income support to all landholding farmer families to supplement their financial needs.',
    eligibility: ['All landholding farmers', 'Valid Aadhaar linked to bank account', 'Land records in own/family name'],
    howToApply: ['Visit pmkisan.gov.in', 'Register with Aadhaar & land details', 'Verify through local agriculture office'],
    currentBeneficiaries: '11+ Crore farmers',
    link: 'https://pmkisan.gov.in/',
    status: 'Active'
  },
  {
    id: 'pmfby',
    name: 'PM Fasal Bima Yojana (PMFBY)',
    ministry: 'Ministry of Agriculture',
    amount: 'Full sum insured on crop loss',
    frequency: 'Season-wise (Kharif/Rabi)',
    description: 'Comprehensive crop insurance against yield losses due to non-preventable natural risks.',
    eligibility: ['Farmers growing notified crops', 'Both loanee and non-loanee farmers', 'Within notification dates'],
    howToApply: ['Apply through bank/CSC', 'Submit land & crop details', 'Pay nominal premium (1.5-2%)'],
    currentBeneficiaries: '5.5+ Crore farmers enrolled',
    link: 'https://pmfby.gov.in/',
    status: 'Active'
  },
  {
    id: 'kusum',
    name: 'PM-KUSUM (Solar Pump)',
    ministry: 'Ministry of New & Renewable Energy',
    amount: '60% subsidy (30% Central + 30% State)',
    frequency: 'One-time',
    description: 'Subsidized solar pumps for irrigation, reducing diesel dependency and electricity costs.',
    eligibility: ['Individual farmers', 'Farmer groups/cooperatives', 'Water user associations'],
    howToApply: ['Apply through state DISCOM portal', 'Submit land and electricity details', 'Get site inspection done'],
    currentBeneficiaries: '35 Lakh pumps sanctioned',
    link: 'https://pmkusum.mnre.gov.in/',
    status: 'Active'
  },
  {
    id: 'smam',
    name: 'Farm Mechanization (SMAM)',
    ministry: 'Ministry of Agriculture',
    amount: '40-50% subsidy on equipment',
    frequency: 'One-time',
    description: 'Subsidy on tractors, harvesters, tillers, and other farm machinery to boost productivity.',
    eligibility: ['Small & marginal farmers priority', 'SC/ST farmers (extra 10%)', 'Women farmers (extra benefit)'],
    howToApply: ['Register on agrimachinery.nic.in', 'Select equipment & apply', 'Verification by district officer'],
    currentBeneficiaries: '15+ Lakh beneficiaries',
    link: 'https://agrimachinery.nic.in/',
    status: 'Active'
  },
  {
    id: 'soil-health',
    name: 'Soil Health Card Scheme',
    ministry: 'Ministry of Agriculture',
    amount: 'Free soil testing',
    frequency: 'Every 2 years',
    description: 'Free soil testing and personalized fertilizer recommendations to improve crop yields.',
    eligibility: ['All farmers across India', 'No restrictions'],
    howToApply: ['Contact local Krishi Vigyan Kendra', 'Submit soil sample', 'Receive digital Soil Health Card'],
    currentBeneficiaries: '22+ Crore cards issued',
    link: 'https://soilhealth.dac.gov.in/',
    status: 'Active'
  }
];

// Eligibility Checker Component - Based on L&T Finance Farmer Loan Criteria
function LoanEligibilityChecker({ t }: { t: (key: string) => string }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Personal Details
    age: '',
    farmingExperience: '',
    // Step 2: Land & Income
    landOwnership: '', // owned, leased, both
    landHolding: '',
    annualIncome: '',
    incomeSource: '', // agriculture, allied, mixed
    // Step 3: Financial Health
    cibilScore: '',
    existingLoans: '',
    monthlyEMI: '',
    bankBalance: '',
    // Step 4: Loan Details
    loanPurpose: '',
    loanAmount: '',
    hasKYC: '', // yes, no, partial
  });
  
  const [result, setResult] = useState<null | {
    eligible: boolean;
    score: number;
    grade: string;
    maxLoanAmount: string;
    interestRate: string;
    recommendations: string[];
    eligibleSchemes: string[];
    tips: string[];
    requiredDocs: string[];
    dti: number;
  }>(null);

  const calculateEligibility = () => {
    let score = 0;
    const recommendations: string[] = [];
    const eligibleSchemes: string[] = [];
    const tips: string[] = [];
    const requiredDocs: string[] = [];

    const age = parseInt(formData.age) || 0;
    const land = parseFloat(formData.landHolding) || 0;
    const income = parseInt(formData.annualIncome) || 0;
    const cibil = parseInt(formData.cibilScore) || 650;
    const existingLoans = parseInt(formData.existingLoans) || 0;
    const monthlyEMI = parseInt(formData.monthlyEMI) || 0;
    const experience = parseInt(formData.farmingExperience) || 0;
    const loanAmount = parseInt(formData.loanAmount) || 100000;
    const bankBalance = parseInt(formData.bankBalance) || 0;

    // Calculate Debt-to-Income Ratio
    const monthlyIncome = income / 12;
    const dti = monthlyIncome > 0 ? Math.round((monthlyEMI / monthlyIncome) * 100) : 0;

    // ===== SCORING CRITERIA (Total: 100 points) =====

    // 1. Age Requirement (Max: 10 points) - Must be 18-65 years
    if (age >= 18 && age <= 65) {
      if (age >= 25 && age <= 55) score += 10;
      else if (age >= 21 && age <= 60) score += 8;
      else score += 5;
    } else {
      tips.push('Age must be between 18-65 years at the time of application');
    }

    // 2. Farming Experience (Max: 15 points) - Minimum 2 years preferred
    if (experience >= 5) {
      score += 15;
      recommendations.push('Your farming experience (5+ years) qualifies you for premium loan terms');
    } else if (experience >= 2) {
      score += 12;
      recommendations.push('Good farming experience - eligible for most agricultural loans');
    } else if (experience >= 1) {
      score += 6;
      tips.push('Most lenders prefer minimum 2 years farming experience. Consider Kisan Credit Card for beginners');
    } else {
      score += 2;
      tips.push('New farmers: Apply for KCC or government-backed schemes with relaxed experience requirements');
    }

    // 3. Credit Score / CIBIL (Max: 25 points) - 650+ preferred
    if (cibil >= 750) {
      score += 25;
      recommendations.push('Excellent CIBIL (750+)! You qualify for lowest interest rates (7-8%)');
    } else if (cibil >= 700) {
      score += 20;
      recommendations.push('Good CIBIL (700-749) - Eligible for competitive interest rates (8-9%)');
    } else if (cibil >= 650) {
      score += 15;
      recommendations.push('Fair CIBIL (650-699) - KCC and cooperative bank loans recommended');
    } else if (cibil >= 550) {
      score += 8;
      tips.push('Improve CIBIL to 650+ by paying existing EMIs on time for 6 months');
    } else {
      score += 3;
      tips.push('Low CIBIL may limit options. Focus on KCC which has relaxed credit requirements');
    }

    // 4. Land Ownership/Lease (Max: 15 points)
    if (formData.landOwnership === 'owned') {
      score += 15;
      recommendations.push('Land ownership allows you to use land as collateral for larger loans');
      requiredDocs.push('Land Records (7/12 Extract, Khata, Patta)');
    } else if (formData.landOwnership === 'both') {
      score += 12;
      requiredDocs.push('Land Records + Lease Agreement');
    } else if (formData.landOwnership === 'leased') {
      score += 8;
      tips.push('Tenant farmers: Ensure lease agreement is registered and valid for loan tenure');
      requiredDocs.push('Registered Lease Agreement (minimum 5 years)');
    } else {
      tips.push('Land ownership or valid lease agreement is required for most farmer loans');
    }

    // 5. Land Holding Size (Max: 10 points)
    if (land >= 5) {
      score += 10;
    } else if (land >= 2.5) {
      score += 8;
    } else if (land >= 1) {
      score += 6;
    } else if (land > 0) {
      score += 3;
      tips.push('Small landholding: Consider Joint Liability Group (JLG) loans for better terms');
    }

    // 6. Income Stability (Max: 10 points)
    if (income >= 300000) {
      score += 10;
    } else if (income >= 150000) {
      score += 7;
    } else if (income >= 75000) {
      score += 5;
    } else {
      score += 2;
    }

    // Income source bonus
    if (formData.incomeSource === 'mixed') {
      score += 2;
      recommendations.push('Mixed income (agriculture + allied activities) shows diversified revenue');
    }

    // 7. Debt-to-Income Ratio (Max: 10 points) - Should be below 40%
    if (dti <= 20) {
      score += 10;
    } else if (dti <= 30) {
      score += 7;
    } else if (dti <= 40) {
      score += 4;
      tips.push('DTI ratio of 30-40% is acceptable but try to reduce existing EMIs');
    } else {
      score += 0;
      tips.push('High DTI (>40%): Clear some existing loans before applying for new credit');
    }

    // 8. Existing Loans (Max: 5 points)
    if (existingLoans === 0) {
      score += 5;
    } else if (existingLoans === 1) {
      score += 3;
    } else if (existingLoans <= 2) {
      score += 1;
    } else {
      tips.push('Multiple active loans may affect approval. Consider consolidation');
    }

    // 9. Bank Balance/Savings (Bonus: up to 3 points)
    if (bankBalance >= 50000) {
      score += 3;
    } else if (bankBalance >= 25000) {
      score += 2;
    } else if (bankBalance >= 10000) {
      score += 1;
    }

    // 10. KYC Documentation (Max: 5 points)
    if (formData.hasKYC === 'yes') {
      score += 5;
      requiredDocs.push('Aadhaar Card', 'PAN Card', 'Voter ID/Passport');
    } else if (formData.hasKYC === 'partial') {
      score += 2;
      tips.push('Complete KYC documents are mandatory. Apply for missing documents immediately');
      requiredDocs.push('Pending: Complete KYC (Aadhaar + PAN mandatory)');
    } else {
      tips.push('KYC documents (Aadhaar, PAN) are mandatory for all farmer loans');
    }

    // Add standard required documents
    requiredDocs.push('Passport Size Photos (2)', 'Bank Statements (Last 6 months)', 'Income Proof / Agricultural Sales Receipts');

    // ===== DETERMINE ELIGIBLE SCHEMES =====
    
    // Government schemes (more relaxed criteria)
    if (land > 0) eligibleSchemes.push('PM-KISAN (₹6,000/year direct benefit)');
    eligibleSchemes.push('PMFBY Crop Insurance (1.5-2% premium)');
    
    // KCC - Most accessible
    if (age >= 18 && age <= 75 && land > 0) {
      eligibleSchemes.push('Kisan Credit Card (KCC) - 4% interest, up to ₹3 lakh');
    }
    
    // Bank loans based on credit score
    if (cibil >= 650 && land >= 1 && experience >= 2) {
      eligibleSchemes.push('SBI Agri Gold Loan');
      eligibleSchemes.push('Bank of Baroda Kisan Credit');
    }
    
    if (cibil >= 700 && land >= 2 && formData.landOwnership === 'owned') {
      eligibleSchemes.push('HDFC Kisan Gold Card');
      eligibleSchemes.push('L&T Finance Farmer Loan');
      eligibleSchemes.push('Tractor/Farm Machinery Loan (up to 90% financing)');
    }
    
    if (formData.incomeSource === 'mixed' || formData.incomeSource === 'allied') {
      eligibleSchemes.push('Dairy Entrepreneurship Loan (25% subsidy)');
      eligibleSchemes.push('NABARD Poultry/Fishery Scheme');
    }
    
    eligibleSchemes.push('PM-KUSUM Solar Pump (60% subsidy)');
    eligibleSchemes.push('SMAM Farm Mechanization (40-50% subsidy)');

    // ===== PURPOSE-BASED RECOMMENDATIONS =====
    if (formData.loanPurpose === 'crop') {
      recommendations.push('Best option: KCC with 4% interest after government subvention');
      recommendations.push('Apply before sowing season for timely disbursal');
    } else if (formData.loanPurpose === 'machinery') {
      recommendations.push('Apply for SMAM subsidy first (40-50% off equipment cost)');
      recommendations.push('Compare: Bank loan vs dealer financing for tractors');
    } else if (formData.loanPurpose === 'dairy') {
      recommendations.push('NABARD Dairy Scheme: 25-33% subsidy + low interest');
      recommendations.push('Get trained at nearest KVK for better loan terms');
    } else if (formData.loanPurpose === 'irrigation') {
      recommendations.push('PM-KUSUM: Get 60% subsidy on solar pumps before taking loan');
      recommendations.push('Check state-specific borewell/drip irrigation subsidies');
    } else if (formData.loanPurpose === 'land') {
      recommendations.push('Land purchase loans require higher credit score (700+)');
      recommendations.push('Consider Land Development Loan for existing land improvements');
    }

    // ===== CALCULATE LOAN ELIGIBILITY =====
    const grade = score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : 'D';
    
    // Estimate max loan amount based on score and income
    let maxLoan = 0;
    if (score >= 80) maxLoan = Math.min(income * 5, 5000000);
    else if (score >= 65) maxLoan = Math.min(income * 4, 2500000);
    else if (score >= 50) maxLoan = Math.min(income * 3, 1000000);
    else maxLoan = Math.min(income * 2, 300000);

    // Estimate interest rate
    let interestRate = '';
    if (cibil >= 750 && score >= 75) interestRate = '7% - 8%';
    else if (cibil >= 700 && score >= 60) interestRate = '8% - 9.5%';
    else if (cibil >= 650 && score >= 50) interestRate = '9.5% - 11%';
    else interestRate = '11% - 14%';

    setResult({
      eligible: score >= 45,
      score,
      grade,
      maxLoanAmount: `₹${(maxLoan / 100000).toFixed(1)} Lakh`,
      interestRate,
      recommendations,
      eligibleSchemes,
      tips,
      requiredDocs,
      dti
    });
    setStep(5);
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          {t('Loan Eligibility Checker')}
        </CardTitle>
        <CardDescription>
          {t('Answer a few questions to check your loan eligibility and get personalized recommendations')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Step {Math.min(step, 4)} of 4</span>
            <span>{Math.min(step, 4) * 25}%</span>
          </div>
          <Progress value={Math.min(step, 4) * 25} className="h-2" />
        </div>

        {/* Step 1: Personal Details */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
              {t('Personal Details')}
            </h3>
            <p className="text-sm text-muted-foreground">Age must be 18-65 years. Minimum 2 years farming experience preferred.</p>
            <div className="grid gap-4">
              <div>
                <Label>{t('Your Age')} <span className="text-red-500">*</span></Label>
                <Input 
                  type="number" 
                  placeholder="e.g., 35"
                  min="18"
                  max="75"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                />
                {formData.age && (parseInt(formData.age) < 18 || parseInt(formData.age) > 65) && (
                  <p className="text-xs text-red-500 mt-1">Age must be between 18-65 years</p>
                )}
              </div>
              <div>
                <Label>{t('Farming Experience (years)')} <span className="text-red-500">*</span></Label>
                <Select onValueChange={(v) => setFormData({...formData, farmingExperience: v})}>
                  <SelectTrigger><SelectValue placeholder="Select experience" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">New to farming (&lt;1 year)</SelectItem>
                    <SelectItem value="1">1 year</SelectItem>
                    <SelectItem value="2">2 years</SelectItem>
                    <SelectItem value="3">3-4 years</SelectItem>
                    <SelectItem value="5">5-10 years</SelectItem>
                    <SelectItem value="10">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Do you have KYC documents? <span className="text-red-500">*</span></Label>
                <Select onValueChange={(v) => setFormData({...formData, hasKYC: v})}>
                  <SelectTrigger><SelectValue placeholder="Select KYC status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes - Aadhaar, PAN & Address Proof</SelectItem>
                    <SelectItem value="partial">Partial - Missing some documents</SelectItem>
                    <SelectItem value="no">No - Need to apply</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => setStep(2)} className="w-full" disabled={!formData.age || !formData.farmingExperience}>
              {t('Next')} →
            </Button>
          </div>
        )}

        {/* Step 2: Land & Income */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
              Land & Income Details
            </h3>
            <p className="text-sm text-muted-foreground">Land ownership or valid lease agreement is required for most loans.</p>
            <div className="grid gap-4">
              <div>
                <Label>Land Ownership Type <span className="text-red-500">*</span></Label>
                <Select onValueChange={(v) => setFormData({...formData, landOwnership: v})}>
                  <SelectTrigger><SelectValue placeholder="Select ownership type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owned">Owned Land (in my/family name)</SelectItem>
                    <SelectItem value="leased">Leased/Tenant Farmer</SelectItem>
                    <SelectItem value="both">Both Owned + Leased</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('Land Holding (acres)')} <span className="text-red-500">*</span></Label>
                <Input 
                  type="number" 
                  step="0.5"
                  placeholder="e.g., 2.5"
                  value={formData.landHolding}
                  onChange={(e) => setFormData({...formData, landHolding: e.target.value})}
                />
              </div>
              <div>
                <Label>{t('Annual Income')} (₹) <span className="text-red-500">*</span></Label>
                <Select onValueChange={(v) => setFormData({...formData, annualIncome: v})}>
                  <SelectTrigger><SelectValue placeholder={t('Select income range')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50000">Below ₹50,000</SelectItem>
                    <SelectItem value="75000">₹50,000 - ₹1 Lakh</SelectItem>
                    <SelectItem value="150000">₹1 - 2 Lakhs</SelectItem>
                    <SelectItem value="300000">₹2 - 4 Lakhs</SelectItem>
                    <SelectItem value="500000">₹4 - 6 Lakhs</SelectItem>
                    <SelectItem value="800000">Above ₹6 Lakhs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Primary Income Source</Label>
                <Select onValueChange={(v) => setFormData({...formData, incomeSource: v})}>
                  <SelectTrigger><SelectValue placeholder="Select income source" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agriculture">Agriculture (Crops only)</SelectItem>
                    <SelectItem value="allied">Allied Activities (Dairy, Poultry, etc.)</SelectItem>
                    <SelectItem value="mixed">Mixed (Agriculture + Allied)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">← {t('Back')}</Button>
              <Button onClick={() => setStep(3)} className="flex-1" disabled={!formData.landOwnership || !formData.landHolding || !formData.annualIncome}>
                {t('Next')} →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Financial Health */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
              Financial Health
            </h3>
            <p className="text-sm text-muted-foreground">CIBIL score of 650+ improves approval chances. DTI should be below 40%.</p>
            <div className="grid gap-4">
              <div>
                <Label>{t('CIBIL Score (if known)')}</Label>
                <Select onValueChange={(v) => setFormData({...formData, cibilScore: v})}>
                  <SelectTrigger><SelectValue placeholder={t('Select CIBIL range')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="800">750-900 (Excellent) ⭐</SelectItem>
                    <SelectItem value="725">700-749 (Good) 👍</SelectItem>
                    <SelectItem value="675">650-699 (Fair)</SelectItem>
                    <SelectItem value="600">550-649 (Poor)</SelectItem>
                    <SelectItem value="500">Below 550 (Very Poor)</SelectItem>
                    <SelectItem value="650">Don&apos;t Know / No Credit History</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Check free at: cibil.com or through your bank app</p>
              </div>
              <div>
                <Label>{t('Existing Loans')}</Label>
                <Select onValueChange={(v) => setFormData({...formData, existingLoans: v})}>
                  <SelectTrigger><SelectValue placeholder={t('Number of existing loans')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No existing loans ✓</SelectItem>
                    <SelectItem value="1">1 active loan</SelectItem>
                    <SelectItem value="2">2 active loans</SelectItem>
                    <SelectItem value="3">3 or more loans</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Total Monthly EMI (₹)</Label>
                <Input 
                  type="number" 
                  placeholder="e.g., 5000 (enter 0 if no EMIs)"
                  value={formData.monthlyEMI}
                  onChange={(e) => setFormData({...formData, monthlyEMI: e.target.value})}
                />
              </div>
              <div>
                <Label>Average Bank Balance (₹)</Label>
                <Select onValueChange={(v) => setFormData({...formData, bankBalance: v})}>
                  <SelectTrigger><SelectValue placeholder="Select average balance" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5000">Below ₹10,000</SelectItem>
                    <SelectItem value="15000">₹10,000 - ₹25,000</SelectItem>
                    <SelectItem value="40000">₹25,000 - ₹50,000</SelectItem>
                    <SelectItem value="75000">₹50,000 - ₹1 Lakh</SelectItem>
                    <SelectItem value="150000">Above ₹1 Lakh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">← {t('Back')}</Button>
              <Button onClick={() => setStep(4)} className="flex-1">
                {t('Next')} →
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Loan Requirements */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
              {t('Loan Purpose')}
            </h3>
            <div className="grid gap-4">
              <div>
                <Label>{t('What do you need the loan for?')} <span className="text-red-500">*</span></Label>
                <Select onValueChange={(v) => setFormData({...formData, loanPurpose: v})}>
                  <SelectTrigger><SelectValue placeholder={t('Select purpose')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crop">🌾 Crop Cultivation / Seasonal Farming</SelectItem>
                    <SelectItem value="machinery">🚜 Tractor / Farm Machinery</SelectItem>
                    <SelectItem value="dairy">🐄 Dairy / Animal Husbandry</SelectItem>
                    <SelectItem value="irrigation">💧 Irrigation / Borewell / Solar Pump</SelectItem>
                    <SelectItem value="land">🏞️ Land Purchase / Development</SelectItem>
                    <SelectItem value="warehouse">🏪 Warehouse / Storage / Cold Chain</SelectItem>
                    <SelectItem value="other">📋 Other Agricultural Purpose</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Expected Loan Amount (₹)</Label>
                <Select onValueChange={(v) => setFormData({...formData, loanAmount: v})}>
                  <SelectTrigger><SelectValue placeholder="Select loan amount range" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50000">Up to ₹50,000</SelectItem>
                    <SelectItem value="100000">₹50,000 - ₹1 Lakh</SelectItem>
                    <SelectItem value="300000">₹1 - 3 Lakhs</SelectItem>
                    <SelectItem value="500000">₹3 - 5 Lakhs</SelectItem>
                    <SelectItem value="1000000">₹5 - 10 Lakhs</SelectItem>
                    <SelectItem value="2500000">₹10 - 25 Lakhs</SelectItem>
                    <SelectItem value="5000000">Above ₹25 Lakhs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">← {t('Back')}</Button>
              <Button onClick={calculateEligibility} className="flex-1 bg-green-600 hover:bg-green-700" disabled={!formData.loanPurpose}>
                <Calculator className="mr-2 h-4 w-4" />
                {t('Check Eligibility')}
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Results */}
        {step === 5 && result && (
          <div className="space-y-6">
            {/* Score Display - Color based on Grade, not just eligible boolean */}
            <div className={`p-6 rounded-lg text-center ${
              result.grade === 'A' ? 'bg-green-50 border-2 border-green-200' :
              result.grade === 'B' ? 'bg-blue-50 border-2 border-blue-200' :
              result.grade === 'C' ? 'bg-amber-50 border-2 border-amber-200' :
              'bg-red-50 border-2 border-red-200'
            }`}>
              <div className="flex items-center justify-center gap-4 mb-3">
                <div className={`text-5xl font-bold ${
                  result.grade === 'A' ? 'text-green-600' :
                  result.grade === 'B' ? 'text-blue-600' :
                  result.grade === 'C' ? 'text-amber-600' :
                  'text-red-600'
                }`}>
                  {result.score}/100
                </div>
                <div className={`text-3xl font-bold px-4 py-2 rounded-lg ${
                  result.grade === 'A' ? 'bg-green-200 text-green-800' :
                  result.grade === 'B' ? 'bg-blue-200 text-blue-800' :
                  result.grade === 'C' ? 'bg-amber-200 text-amber-800' :
                  'bg-red-200 text-red-800'
                }`}>
                  Grade {result.grade}
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-lg">
                {result.grade === 'A' ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <span className="font-semibold text-green-700">Excellent Eligibility!</span>
                  </>
                ) : result.grade === 'B' ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-blue-600" />
                    <span className="font-semibold text-blue-700">{t('Good Eligibility!')}</span>
                  </>
                ) : result.grade === 'C' ? (
                  <>
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                    <span className="font-semibold text-amber-700">Fair Eligibility</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-6 w-6 text-red-600" />
                    <span className="font-semibold text-red-700">{t('Limited Eligibility')}</span>
                  </>
                )}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-lg font-bold text-blue-700">{result.maxLoanAmount}</div>
                <div className="text-xs text-blue-600">Est. Max Loan</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-lg font-bold text-green-700">{result.interestRate}</div>
                <div className="text-xs text-green-600">Interest Rate</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-lg font-bold text-purple-700">{result.dti}%</div>
                <div className="text-xs text-purple-600">DTI Ratio</div>
              </div>
            </div>

            {/* Eligible Schemes */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                {t('You are eligible for:')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.eligibleSchemes.slice(0, 8).map((scheme, i) => (
                  <Badge key={i} variant="secondary" className="bg-green-100 text-green-800">
                    {scheme}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">{t('Recommendations:')}</h4>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Required Documents */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Required Documents:
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.requiredDocs.map((doc, i) => (
                  <Badge key={i} variant="outline" className="text-blue-700 border-blue-300">
                    {doc}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tips */}
            {result.tips.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">{t('Tips to improve:')}</h4>
                <ul className="space-y-2">
                  {result.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => { setStep(1); setResult(null); }} variant="outline" className="flex-1">
                {t('Check Again')}
              </Button>
              <Button asChild className="flex-1 bg-green-600 hover:bg-green-700">
                <Link href="https://pmkisan.gov.in/RegistrationFormupdated.aspx" target="_blank">
                  Apply for KCC <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function LoansSubsidiesPage() {
  const { t } = useTranslation();
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">{t('Loans & Subsidies')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('Complete guide to agricultural loans, government schemes, and financial support for farmers.')}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-4 text-center">
            <IndianRupee className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <div className="text-2xl font-bold text-green-700">4%</div>
            <div className="text-xs text-green-600">{t('Lowest KCC Rate')}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-4 text-center">
            <Percent className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <div className="text-2xl font-bold text-blue-700">60%</div>
            <div className="text-xs text-blue-600">{t('Max Solar Subsidy')}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="pt-4 text-center">
            <CreditCard className="h-8 w-8 mx-auto text-amber-600 mb-2" />
            <div className="text-2xl font-bold text-amber-700">₹6K</div>
            <div className="text-xs text-amber-600">{t('PM-KISAN/Year')}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-4 text-center">
            <Building className="h-8 w-8 mx-auto text-purple-600 mb-2" />
            <div className="text-2xl font-bold text-purple-700">11Cr+</div>
            <div className="text-xs text-purple-600">{t('Farmers Covered')}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="eligibility" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="eligibility">
            <Calculator className="h-4 w-4 mr-2" />
            {t('Check Eligibility')}
          </TabsTrigger>
          <TabsTrigger value="loans">
            <Landmark className="h-4 w-4 mr-2" />
            {t('Loans')}
          </TabsTrigger>
          <TabsTrigger value="subsidies">
            <HandCoins className="h-4 w-4 mr-2" />
            {t('Subsidies')}
          </TabsTrigger>
        </TabsList>

        {/* Eligibility Checker Tab */}
        <TabsContent value="eligibility">
          <LoanEligibilityChecker t={t} />
        </TabsContent>

        {/* Loans Tab */}
        <TabsContent value="loans" className="space-y-6">
          {loanSchemes.map((loan) => (
            <Card key={loan.id} className="overflow-hidden">
              <CardHeader className="cursor-pointer" onClick={() => setExpandedLoan(expandedLoan === loan.id ? null : loan.id)}>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Landmark className="h-5 w-5 text-primary" />
                      {loan.name}
                    </CardTitle>
                    <CardDescription>{loan.bank}</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                    {loan.interestRate}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{loan.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Max:</strong> {loan.maxAmount}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Tenure:</strong> {loan.tenure}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Helpline:</strong> {loan.helpline}</span>
                  </div>
                </div>

                {expandedLoan === loan.id && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        {t('Eligibility Criteria')}
                      </h4>
                      <ul className="text-sm space-y-1 ml-6">
                        {loan.eligibility.map((item, i) => (
                          <li key={i} className="list-disc">{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        {t('Documents Required')}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {loan.documents.map((doc, i) => (
                          <Badge key={i} variant="secondary">{doc}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">{t('Benefits')}</h4>
                      <ul className="text-sm space-y-1 ml-6">
                        {loan.benefits.map((item, i) => (
                          <li key={i} className="list-disc text-green-700">{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-muted/50 flex gap-2">
                <Button asChild className="flex-1">
                  <Link href={loan.applyLink} target="_blank" rel="noopener noreferrer">
                    {t('Apply Now')} <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => setExpandedLoan(expandedLoan === loan.id ? null : loan.id)}>
                  {expandedLoan === loan.id ? t('Less') : t('More Details')}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </TabsContent>

        {/* Subsidies Tab */}
        <TabsContent value="subsidies" className="space-y-6">
          {subsidySchemes.map((subsidy) => (
            <Card key={subsidy.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <HandCoins className="h-5 w-5 text-primary" />
                      {subsidy.name}
                    </CardTitle>
                    <CardDescription>{subsidy.ministry}</CardDescription>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-600">{subsidy.amount}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{subsidy.frequency}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{subsidy.description}</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">{t('Who can apply:')}</h4>
                    <ul className="text-sm space-y-1">
                      {subsidy.eligibility.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">{t('How to apply:')}</h4>
                    <ol className="text-sm space-y-1">
                      {subsidy.howToApply.map((step, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">{i + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2 border-t text-sm text-muted-foreground">
                  <span>👥 {subsidy.currentBeneficiaries}</span>
                  <Badge variant={subsidy.status === 'Active' ? 'default' : 'secondary'} className="bg-green-100 text-green-800">
                    ✓ {subsidy.status}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50">
                <Button asChild className="w-full">
                  <Link href={subsidy.link} target="_blank" rel="noopener noreferrer">
                    {t('Visit Official Portal')} <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Helpline Section */}
      <Card className="mt-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-1">{t('Need Help?')}</h3>
              <p className="text-green-100">
                {t('Call the Kisan Call Center for free assistance in your language')}
              </p>
            </div>
            <Button size="lg" variant="secondary" className="text-green-700 font-bold" asChild>
              <a href="mailto:krishinexa@gmail.com">
                <FileText className="mr-2 h-5 w-5" />
                majorprojectsjce2026@gmail.com
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
