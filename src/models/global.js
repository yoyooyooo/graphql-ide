let headers = '';
try {
  headers = JSON.parse(window.localStorage.getItem('headers') || '');
} catch (err) {}

export default {
  state: {
    graphqlUri: window.localStorage.getItem('uri') || '',
    headers: headers,
  },
  reducers: {
    save(state, { payload }) {
      return { ...state, ...payload };
    },
  },
};
