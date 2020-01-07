const code = `
{
    appVersion(query: {id: "", createTime: "", name: "",
      updateTime: "", app: {createTime: "", description: "", id: "", name: "", shortDescription: "", updateTime: ""}}) {
      id
      name
    }
  }

`;

const prettier = require('prettier');
const { parse } = require('graphql');

const output = prettier.format(code, { semi: false, parser: 'graphql' });
console.log(output);
