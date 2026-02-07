// 'use client';

// import { MapContainer, TileLayer } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';

// interface Props {
//   baseLayer: string;
//   boundaryLayer?: string;
// }

// export default function SatelliteMap({ baseLayer, boundaryLayer }: Props) {
//   return (
//     <div className="h-[450px] w-full rounded-lg overflow-hidden border">
//       <MapContainer
//         key={baseLayer}              // ✅ CRITICAL FIX
//         center={[12.97, 77.59]}
//         zoom={8}
//         style={{ height: '100%', width: '100%' }}
//       >
//         {/* Base satellite / NDVI layer */}
//         <TileLayer
//           url={baseLayer}
//           attribution="© Google Earth Engine"
//         />

//         {/* District boundary */}
//         {boundaryLayer && (
//           <TileLayer url={boundaryLayer} />
//         )}
//       </MapContainer>
//     </div>
//   );
// }














'use client';

import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  baseLayer: string;
  boundaryLayer?: string;
}

export default function SatelliteMap({ baseLayer, boundaryLayer }: Props) {
  return (
    <div className="h-[450px] w-full rounded-lg overflow-hidden border">
      <MapContainer
  center={[12.97, 77.59]}
  zoom={9}
  style={{ height: '100%', width: '100%' }}
>
  {/* Base Map */}
  <TileLayer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution="© OpenStreetMap contributors"
  />

  {/* Satellite / NDVI */}
  <TileLayer
    url={baseLayer}
    attribution="© Google Earth Engine"
    opacity={0.8}
  />

  {boundaryLayer && (
    <TileLayer url={boundaryLayer} />
  )}
</MapContainer>

    </div>
  );
}














