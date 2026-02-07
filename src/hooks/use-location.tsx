"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import locationData from '@/lib/karnataka-locations.json';

interface Village {
  village: string;
  latitude: number;
  longitude: number;
}

interface Taluk {
  taluk: string;
  villages: Village[];
}

interface District {
  district: string;
  taluks: Taluk[];
}

interface LocationContextType {
  districts: District[];
  selectedDistrict: District | null;
  selectedTaluk: Taluk | null;
  selectedVillage: Village | null;
  setDistrict: (districtName: string | null) => void;
  setTaluk: (talukName: string | null) => void;
  setVillage: (villageName: string | null) => void;
  locationString: string;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [districts] = useState<District[]>(locationData);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedTaluk, setSelectedTaluk] = useState<Taluk | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);

  // Load selection from localStorage on initial render
  useEffect(() => {
    const savedLocation = localStorage.getItem('selectedLocation');
    if (savedLocation) {
      const { district, taluk, village } = JSON.parse(savedLocation);
      if (district) setDistrict(district);
      if (taluk) setTaluk(taluk);
      if (village) setVillage(village);
    } else {
        // Set a default location if nothing is saved
        setDistrict("Mandya");
        setTaluk("Mandya");
        setVillage("Holalu");
    }
  }, []);

  const saveToLocalStorage = (district: string | null, taluk: string | null, village: string | null) => {
    localStorage.setItem('selectedLocation', JSON.stringify({ district, taluk, village }));
  };

  const setDistrict = (districtName: string | null) => {
    const district = districts.find(d => d.district === districtName) || null;
    setSelectedDistrict(district);
    setSelectedTaluk(null);
    setSelectedVillage(null);
    saveToLocalStorage(districtName, null, null);
  };

  const setTaluk = (talukName: string | null) => {
    const taluk = selectedDistrict?.taluks.find(t => t.taluk === talukName) || null;
    setSelectedTaluk(taluk);
    setSelectedVillage(null);
    saveToLocalStorage(selectedDistrict?.district || null, talukName, null);
  };

  const setVillage = (villageName: string | null) => {
    const village = selectedTaluk?.villages.find(v => v.village === villageName) || null;
    setSelectedVillage(village);
    saveToLocalStorage(selectedDistrict?.district || null, selectedTaluk?.taluk || null, villageName);
  };

  const locationString = useMemo(() => {
    if (selectedVillage && selectedTaluk && selectedDistrict) {
      return `${selectedVillage.village}, ${selectedTaluk.taluk}, ${selectedDistrict.district}`;
    }
    return 'Select a location';
  }, [selectedVillage, selectedTaluk, selectedDistrict]);

  const value = {
    districts,
    selectedDistrict,
    selectedTaluk,
    selectedVillage,
    setDistrict,
    setTaluk,
    setVillage,
    locationString
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
