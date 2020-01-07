export default {
  state: {
    graphqlUri: window.localStorage.getItem('uri') || '',
  },
  reducers: {
    save(state, { payload }) {
      return { ...state, ...payload };
    },
  },
};
