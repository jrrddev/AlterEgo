export interface AIModel {
  id: string;
  name: string;
  modelString: string;
}

export const models: Record<string, AIModel> = {
  server_1: {
    id: 'server_1',
    name: 'Server 1',
    modelString: 'nvidia/nemotron-3-nano-30b-a3b:free'
  },
  server_2: {
    id: 'server_2',
    name: 'Server 2',
    modelString: 'gemini-3-flash-preview'
  }
};

export const modelList = Object.values(models);
