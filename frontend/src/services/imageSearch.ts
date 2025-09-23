import axios from "axios";


const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 인증 토큰 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ImageResult {
  id: string;
  filename: string;
  url: string;
  title: string;
  description?: string;
  tags?: string[];
  relevance?: number;
  // 새로운 AI 분석 속성들
  similarity?: number;
  product_name?: string;
  price?: number;
  rating_avg?: number;
  brand?: string;
  detailed_analysis?: any;
}

export interface SearchResult {
  query: string;
  images: ImageResult[];
  totalCount: number;
  searchTime: number;
}

// 이미지 검색 API
export const searchImages = async (
  query: string,
  limit: number = 20
): Promise<SearchResult> => {
  try {
    const response = await api.get("/api/images/search", {
      params: { q: query, limit },
    });

    // URL을 절대 경로로 변환
    const result = response.data;
    result.images = result.images.map((img: ImageResult) => ({
      ...img,
      url: `${API_BASE_URL}${img.url}`,
    }));

    return result;
  } catch (error: any) {
    console.error("Image search error:", error);
    throw new Error(
      error.response?.data?.detail || "이미지 검색에 실패했습니다."
    );
  }
};

// 이미지 파일로 검색 API
export const searchImagesByFile = async (file: File): Promise<SearchResult> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/api/images/search-by-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // URL을 절대 경로로 변환
    const result = response.data;
    result.images = result.images.map((img: ImageResult) => ({
      ...img,
      url: `${API_BASE_URL}${img.url}`,
    }));

    return result;
  } catch (error: any) {
    console.error("Image file search error:", error);
    throw new Error(
      error.response?.data?.detail || "이미지 파일 검색에 실패했습니다."
    );
  }
};

// 고급 이미지 검색 API (의류 분리 포함)
export const searchImagesByFileAdvanced = async (file: File, clothingType: string = "all"): Promise<SearchResult & { separated_images?: any[], search_type?: string, advanced_search?: boolean }> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("clothing_type", clothingType);

    const response = await api.post("/api/images/search-by-image-advanced", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // URL을 절대 경로로 변환
    const result = response.data;
    result.images = result.images.map((img: ImageResult) => ({
      ...img,
      url: `${API_BASE_URL}${img.url}`,
    }));

    // 분리된 이미지 URL도 절대 경로로 변환
    if (result.separated_images) {
      result.separated_images = result.separated_images.map((img: any) => ({
        ...img,
        url: img.url.startsWith('http') ? img.url : `${API_BASE_URL}${img.url}`,
      }));
    }

    return result;
  } catch (error: any) {
    console.error("Advanced image file search error:", error);
    throw new Error(
      error.response?.data?.detail || "고급 이미지 검색에 실패했습니다."
    );
  }
};

// 이미지 목록 조회 API
export const listImages = async (limit: number = 20): Promise<SearchResult> => {
  try {
    const response = await api.get("/api/images/list", {
      params: { limit },
    });

    // URL을 절대 경로로 변환
    const result = response.data;
    result.images = result.images.map((img: ImageResult) => ({
      ...img,
      url: `${API_BASE_URL}${img.url}`,
    }));

    return result;
  } catch (error: any) {
    console.error("Image list error:", error);
    throw new Error(
      error.response?.data?.detail || "이미지 목록 조회에 실패했습니다."
    );
  }
};
