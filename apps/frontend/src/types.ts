export interface Service {
  id: string | number;
  name: string;
  description: string;
  price?: number;
  estimated_hours: number;
  calculated_price: number;
}

// We also create an interface for the Admin initial data
export interface AdminInitialData {
  hourly_rate: number;
  services: Service[];
}
