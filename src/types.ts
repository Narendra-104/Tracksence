export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type DriveDirection = 'FORWARD' | 'REVERSE';


export type DefectType = 
  | 'Surface Corrugation'
  | 'Loose Joint / Fishplate Gap'
  | 'Gauge Widening'
  | 'Rail Flaw / Crack'
  | 'Ballast Settlement'
  | 'Nominal Track';

export interface TelemetryPoint {
  timestamp: number;
  position: number; // 0 to 2.5 meters
  vibrationZ: number; // Vertical acceleration in Gs (-2.0 to +4.0)
  vibrationY: number; // Lateral acceleration in Gs (-1.5 to +1.5)
  gaugeMm: number; // Optical gauge measurement in mm (nominal 1676 mm)
  gaugeDevMm: number; // Deviation from 1676 mm
  confidenceScore: number; // Sensor Fusion Defect Confidence Score 0-100%
  status: 'NOMINAL' | 'ANOMALY' | 'DEFECT';
  laserSignalQuality: number; // 0-100%
  cameraSharpness: number; // 0-100%
}

export interface DefectRecord {
  id: string;
  timestamp: string;
  location: number; // Meter along 0 to 2.5m track
  defectType: DefectType;
  severity: SeverityLevel;
  gaugeMm: number;
  vibrationG: number;
  confidenceScore: number; // 0 to 100%
  actionRequired: string;
  acknowledged: boolean;
  sensorTriggers: {
    vibrationSpike: boolean;
    gaugeSpread: boolean;
    opticalAnomaly: boolean;
  };
}

export type PresetScenario = 
  | 'smooth'
  | 'corrugation'
  | 'loose_joint'
  | 'gauge_widening'
  | 'combined_critical';

export interface InjectorConfig {
  location: number; // 0.1 to 2.4 meters
  defectType: DefectType;
  severity: SeverityLevel;
  gaugeDevMm: number;
  vibrationAmpG: number;
}
