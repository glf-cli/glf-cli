// 通过 axios 处理请求
const axios = require("axios");

axios.interceptors.response.use((res) => {
  return res.data;
});

/**
 * 获取模板列表
 * @returns Promise
 */
async function getRepoList() {
  return axios.get("https://api.github.com/orgs/glf-template/repos");
}

/**
 * 获取分支信息
 * @param {string} repo 模板名称
 * @returns Promise
 */
async function getBranchList(repo) {
  return axios.get(`https://api.github.com/repos/glf-template/${repo}/branches`);
}

module.exports = {
  getRepoList,
  getBranchList,
};
