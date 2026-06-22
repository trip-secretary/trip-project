const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: authHeaders(),
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `요청 실패 (${res.status})`);
  }
  return res.json();
}

// ---------- 일정 ----------

export interface ItineraryItem {
  time: string;
  title: string;
  category: string;
  place_name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  duration_minutes: number | null;
  estimated_cost: number | null;
  notes: string | null;
  is_indoor: boolean;
}

export interface DayPlan {
  day: number;
  date: string;
  items: ItineraryItem[];
}

export interface PlanResult {
  plan_type: "A" | "B" | "C";
  title: string;
  description: string;
  theme: string;
  weather_condition: string;
  estimated_cost: number;
  days: DayPlan[];
}

export interface DayWeather {
  sky: string;
  precipitation: string;
  min_temp: number | null;
  max_temp: number | null;
  is_bad_weather: boolean;
  emoji: string;
}

export interface ItineraryResponse {
  destination: string;
  start_date: string;
  end_date: string;
  weather_summary: string;
  weather_by_date: Record<string, DayWeather>;
  plans: PlanResult[];
}

export function generateItinerary(params: {
  destination: string;
  start_date: string;
  end_date: string;
  purposes: string[];
}): Promise<ItineraryResponse> {
  return request("/itinerary/generate", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function saveTrip(data: {
  destination: string;
  start_date: string;
  end_date: string;
  purposes: string[];
  plan_type: string;
  title: string;
  description?: string;
  estimated_cost?: number;
  days: DayPlan[];
}): Promise<{ message: string; trip_id: number }> {
  return request("/itinerary/save", { method: "POST", body: JSON.stringify(data) });
}

export function getSavedTrips(): Promise<any[]> {
  return request("/itinerary/saved");
}

export function getTripDetail(tripId: number): Promise<any> {
  return request(`/itinerary/saved/${tripId}`);
}

export function deleteTrip(tripId: number): Promise<{ message: string }> {
  return request(`/itinerary/saved/${tripId}`, { method: "DELETE" });
}

// ---------- 인증 ----------

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  nickname: string;
  profile_image: string | null;
}

export function kakaoLogin(code: string): Promise<AuthResponse> {
  return request("/auth/kakao", { method: "POST", body: JSON.stringify({ code }) });
}
