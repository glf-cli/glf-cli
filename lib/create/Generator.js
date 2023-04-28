const { getRepoList, getTagList } = require("./http");
const downloadGitRepo = require("download-git-repo"); // 不支持 Promise
const chalk = require("chalk"); //控制台输出内容样式美化
const ora = require("ora");
const util = require("util");
const path = require("path");
const inquirer = require("inquirer");

// 添加加载动画
async function wrapLoading(fn, message, ...args) {
  return new Promise((resolve, reject) => {
    // 使用 ora 初始化，传入提示信息 message
    const spinner = ora(message);
    // 开始加载动画
    spinner.start();
    // 执行传入方法 fn
    fn(...args)
      .then((result) => {
        // 状态为修改为成功
        spinner.succeed();
        resolve(result);
      })
      .catch((err) => {
        console.log(err);
        spinner.fail("Request failed, refetch ...");
        reject();
      });
  });
}

class Generator {
  constructor(name, targetDir) {
    // 目录名称
    this.name = name;
    // 创建位置
    this.targetDir = targetDir;
    // 对 download-git-repo 进行 promise 化改造
    this.downloadGitRepo = util.promisify(downloadGitRepo);
  }

  // 获取用户选择的模板
  // 1）从远程拉取模板数据
  // 2）用户选择自己新下载的模板名称
  // 3）return 用户选择的名称
  async getRepo() {
    // 1）从远程拉取模板数据
    const repoList = await wrapLoading(getRepoList, "waiting fetch template");

    if (!repoList || !repoList.length) {
      return;
    }

    // 过滤我们需要的模板名称
    const repos = repoList.map((item) => item.name);

    // 2）用户选择自己新下载的模板名称
    const { repo } = await inquirer.prompt({
      name: "repo",
      type: "list",
      choices: repos,
      message: "Please choose a template to create project",
    });

    // 3）return 用户选择的名称
    return repo;
  }

  // 获取用户选择的版本
  // 1）基于 repo 结果，远程拉取对应的 版本 列表
  // 2）用户选择自己需要下载的 版本
  // 3）return 用户选择的 版本
  async getTag(repo) {
    // 1）基于 repo 结果，远程拉取对应的 版本  列表
    const tags = await wrapLoading(getTagList, "waiting fetch tag", repo);
    if (!tags || !tags.length) {
      return;
    }

    // 过滤我们需要的 tag 名称
    const tagsList = tags.map((item) => item.name);

    // 2）用户选择自己需要下载的 tag
    const { tag } = await inquirer.prompt({
      name: "tag",
      type: "list",
      choices: tagsList,
      message: "Place choose a tag to create project",
    });

    // 3）return 用户选择的 tag
    return tag;
  }

  // 下载远程模板
  // 1）拼接下载地址
  // 2）调用下载方法
  async download(repo, tag) {
    // 1）拼接下载地址
    const requestUrl = `glf-template/${repo}#${tag}`;

    // 2）调用下载方法
    await wrapLoading(
      this.downloadGitRepo, // 远程下载方法
      "waiting download template", // 加载提示信息
      requestUrl, // 参数1: 下载地址
      path.resolve(process.cwd(), this.targetDir)
    );
  }

  // 核心创建逻辑
  // 1）获取模板名称
  // 2）获取 tag 名称
  // 3）下载模板到模板目录
  async create() {
    const spinner = ora("waiting create template");

    // 1）获取模板名称
    const repo = await this.getRepo();
    if (!repo) {
      spinner.fail("There is no template");
      return;
    }

    // 2) 获取 tag 名称
    const tag = await this.getTag(repo);
    if (!tag) {
      spinner.fail("There is no tag");
      return;
    }

    // 3）下载模板到模板目录
    await this.download(repo, tag);
    spinner.succeed();

    // 参数2: 创建位置
    console.log(`\r\nSuccessfully created project ${chalk.cyan(this.name)} \r\n`);
  }
}

module.exports = Generator;
