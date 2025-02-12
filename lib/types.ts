export interface Patient {
    id: number;
    name: string;
    age: number;
}

export interface AlertLog {
  type: string;
  message: string;
  timestamp: string;
  duration?: number;
}