
'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

// leaflet's default icons are not compatible with webpack and need to be re-set
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default,
  iconUrl: require('leaflet/dist/images/marker-icon.png').default,
  shadowUrl: require('leaflet/dist/images/marker-shadow.png').default,
});


interface InteractiveMapProps {
  position: [number, number];
}

export default function InteractiveMap({ position }: InteractiveMapProps) {
  
  // The MapContainer component needs to have a defined height.
  // We'll give it a class that sets height to 100%. Its parent must have a defined height.
  return (
    <MapContainer center={position} zoom={15} scrollWheelZoom={true} className="h-full w-full z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>
          Farm Location
        </Popup>
      </Marker>
    </MapContainer>
  );
}
