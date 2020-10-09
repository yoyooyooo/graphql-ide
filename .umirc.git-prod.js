// ref: https://umijs.org/config/
export default {
  publicPath: '/graphql-ide/',
  base: '/graphql-ide/',
  plugins: [
    // ref: https://umijs.org/plugin/umi-plugin-react.html
    [
      'umi-plugin-react',
      {
        antd: false,
        dva: true,
        dynamicImport: { webpackChunkName: true },
        title: 'graphiql',
        dll: true,
        pwa: {
          manifestOptions: {
            srcPath: './manifest.json',
          },
          workboxOptions: {
            importWorkboxFrom: 'local',
            swDest: 'my-sw.js',
          },
        },
        routes: {
          exclude: [/components\//],
        },
      },
    ],
  ],
  extraBabelIncludes: [/node_modules/],
};
