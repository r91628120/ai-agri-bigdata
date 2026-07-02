/*
========================================
AI Agriculture Core
WeatherAPI.js v1.0
農業氣象 API 服務層
========================================
*/

class WeatherAPI {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
  }

  async fetchWeather(stationId) {
  const url =
    this.apiUrl +
    "?location=" +
    encodeURIComponent(stationId);

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 8000);

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error("WeatherAPI：API 回應失敗");
    }

    return await response.json();

  } catch (error) {
    clearTimeout(timeoutId);

    return {
      success: false,
      stationId,
      message: "WeatherAPI：氣象資料讀取逾時或失敗",
      error: error.message
    };
  }
}
}

window.WeatherAPI = WeatherAPI;