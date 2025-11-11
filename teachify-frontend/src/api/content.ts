import http from './http';

export interface GenerationRequest {
  prompt: string;
}

export interface VisualizationPrompt {
  section: string;
  prompt: string;
  image_path?: string | null;
  paragraph_index?: number | null;
  snippet?: string | null;
}

export interface LectureOutput {
  topic: string;
  introduction: string;
  main_body: string;
  conclusion: string;
  visualizations: VisualizationPrompt[];
  video_path: string;
  captions_url?: string | null;
}

export const contentApi = {
  generateFromPrompt: async (prompt: string): Promise<LectureOutput> => {
    const response = await http.post('/v1/content/generate', { prompt });
    return response.data;
  },

  generateFromDocuments: async (
    prompt: string,
    files: File[]
  ): Promise<LectureOutput> => {
    const formData = new FormData();
    formData.append('prompt', prompt);
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await http.post('/v1/content/generate-from-docs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
};
