(async () => {
  const removeTailSlash = (url = '') => url.replace(/\/$/, '');
  const baseURL = removeTailSlash(location.href);
  const { createApp } = await import('./vue/dist/vue.esm-browser.js');

  const getApiList = async () => {
    const { code, data } = await fetch(`${baseURL}/mock-api/list`)
      .then(response => {
        if (response.status >= 200 && response.status < 300) {
          return Promise.resolve(response);
        } else {
          return Promise.reject(new Error(response.statusText));
        }
      })
      .then(response => response.json());
    return data;
  };
  const App = {
    template: '#api-list-template',
    data() {
      return {
        apiList: [],
      };
    },
    async mounted() {
      const apiListData = await getApiList();
      this.apiList = apiListData.map(item => ({
        id: `${item.methods.join('-')}-${item.path}`,
        path: item.path,
        methods: item.methods,
        previewURL: `${baseURL}${item.path}`,
      }));
    },
  };

  createApp(App).mount('#app');
})();
