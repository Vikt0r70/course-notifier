import api from './api';

export const configService = {
  async getFaculties() {
    const response = await api.get('/config/faculties');
    return response.data.data;
  },

  async getMajors() {
    const response = await api.get('/config/majors');
    return response.data.data;
  },
};
