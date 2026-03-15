import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api` 
    : 'https://hidaya-ai-backend-ooriginal.onrender.com/api',
  timeout: 20000,
});

export const getChatHistory = async (sessionId) => {
  const { data } = await API.get(`/companion/history/${sessionId}`);
  return data;
};

export const sendChatMessage = async (payload) => {
  const { data } = await API.post("/companion", payload);
  return data;
};

// Secure Chat Proxy - Frontend never communicates with AI API directly
export const sendSecureChatMessage = async (payload) => {
  const { data } = await API.post("/chat", payload);
  return data;
};

export const getSecureChatHistory = async (sessionId) => {
  const { data } = await API.get(`/chat/history/${sessionId}`);
  return data;
};

export const getSurahs = async () => {
  const { data } = await API.get("/quran/surahs");
  return data;
};

export const getReciters = async () => {
  const { data } = await API.get("/quran/reciters");
  return data;
};

export const getSurahDetails = async (surahNumber, reciter) => {
  const { data } = await API.get(`/quran/surah/${surahNumber}`, {
    params: { reciter },
  });
  return data;
};

export const getPrayerTimes = async (params) => {
  const { data } = await API.get("/prayer-times", { params });
  return data;
};

export const getQiblaDirection = async (params) => {
  const { data } = await API.get("/qibla", { params });
  return data;
};

export const calculateZakat = async (payload) => {
  const { data } = await API.post("/zakat/advanced", payload);
  return data;
};
