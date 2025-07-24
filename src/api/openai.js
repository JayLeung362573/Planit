import axios from 'axios';

export const getPlacesData = async (type, sw, ne) => {
  // Mock data for development or missing API key
  if (
    process.env.REACT_APP_ENV === "development" ||
    !process.env.REACT_APP_OPENAI_API_KEY
  ) {
    console.log("Development environment or missing API key: returning mock data");
    return [
      {
        name: "Mock Place 1",
        description: "A great place to visit!",
        latitude: sw.lat + 0.01,
        longitude: sw.lng + 0.01,
      },
      {
        name: "Mock Place 2",
        description: "Another fun spot!",
        latitude: ne.lat - 0.01,
        longitude: ne.lng - 0.01,
      },
    ];
  }

  // Placeholder for real API call, uncomment and fill in later when you have an API key
  // try {
  //   const prompt = `
  //     You are a helpful travel advisor.
  //     Suggest ${type} to visit within the following boundaries:
  //     SouthWest (lat: ${sw.lat}, lng: ${sw.lng}),
  //     NorthEast (lat: ${ne.lat}, lng: ${ne.lng}).
  //     Please return a list of interesting places.
  //   `;
  //
  //   const response = await axios.post(
  //     "https://api.openai.com/v1/chat/completions",
  //     {
  //       model: "gpt-4o",
  //       messages: [
  //         { role: "system", content: "You are a helpful travel advisor." },
  //         { role: "user", content: prompt }
  //       ],
  //       max_tokens: 500,
  //     },
  //     {
  //       headers: {
  //         "Authorization": `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
  //         "Content-Type": "application/json"
  //       }
  //     }
  //   );
  //   return response.data.choices[0].message.content;
  // } catch (error) {
  //   console.log(error);
  //   return [];
  // }

  return [];
};