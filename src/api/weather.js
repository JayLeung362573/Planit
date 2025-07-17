// Weather API (OpenWeatherMap)
export const getWeatherData = async (lat, lon) => {
  if (process.env.REACT_APP_ENV !== "development") {
    try {
      const { data } = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.REACT_APP_OPENWEATHERMAP_KEY}`
      );

      return data;
    } catch (error) {
      console.log(error);
    }
  } else {
    console.log("Development environment detected");
  }
};
