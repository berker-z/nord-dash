import { WeatherData } from '../types';

export const fetchWeather = async (): Promise<WeatherData | null> => {
  try {
    // Open-Meteo API for Istanbul coordinates (41.0082, 28.9784)
    const response = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=41.0082&longitude=28.9784&current_weather=true"
    );
    const data = await response.json();
    
    if (data.current_weather) {
      return {
        temperature: data.current_weather.temperature,
        weatherCode: data.current_weather.weathercode
      };
    }
    return null;
  } catch (e) {
    console.error("Weather fetch error", e);
    return null;
  }
};